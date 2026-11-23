import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ChatMessageModels } from './list-chat-messages.usecase';
import type { ChatMessageRow } from './map-chat-message-to-dto';
import { listChatMessagesCommand } from './list-chat-messages.command';
import { listChatMessages } from './list-chat-messages.usecase';
import { toAttachmentKey } from './map-chat-message-to-dto';

type Filter = Record<string, unknown>;

const BASE = 'https://old.example.test/api/migration';
const DM_1 = '65f0000000000000000000c1';
const DM_2 = '65f0000000000000000000c2';

const id = (value: string) => ({ toString: () => value });

const row = (overrides: Partial<ChatMessageRow> = {}): ChatMessageRow => ({
  _id: id('65f000000000000000000001'),
  conversationId: id(DM_1),
  sender: { type: 'client', id: id('65f0000000000000000000b1') },
  content: 'hello',
  attachments: [],
  forwardedFromMessageId: null,
  createdAt: new Date('2026-03-09T08:00:00.000Z'),
  updatedAt: new Date('2026-03-09T08:05:00.000Z'),
  ...overrides,
});

const stubModels = (rows: ChatMessageRow[], total: number, directIds: string[] = [DM_1, DM_2]) => {
  const calls = {
    conversationFind: [] as Filter[],
    conversationSelect: [] as string[],
    find: [] as Filter[],
    count: [] as Filter[],
    select: [] as string[],
    sort: [] as Filter[],
    skip: [] as number[],
    limit: [] as number[],
    diskUse: [] as boolean[],
  };
  const chain = (result: unknown, selects: string[]) => {
    const query: Record<string, unknown> = {};
    query.select = (columns: string) => (selects.push(columns), query);
    query.sort = (order: Filter) => (calls.sort.push(order), query);
    query.skip = (n: number) => (calls.skip.push(n), query);
    query.limit = (n: number) => (calls.limit.push(n), query);
    query.allowDiskUse = (enabled: boolean) => (calls.diskUse.push(enabled), query);
    query.lean = () => Promise.resolve(result);
    return query;
  };
  const models = {
    conversations: {
      find: (filter: Filter) => (calls.conversationFind.push(filter), chain(directIds.map((value) => ({ _id: id(value) })), calls.conversationSelect)),
    },
    messages: {
      find: (filter: Filter) => (calls.find.push(filter), chain(rows, calls.select)),
      countDocuments: (filter: Filter) => (calls.count.push(filter), Promise.resolve(total)),
    },
  } as unknown as ChatMessageModels;
  return { models, calls };
};

const idsOf = (filter: Filter): string[] => (filter.conversationId as { $in: Array<{ toString(): string }> }).$in.map(String);

describe('listChatMessages', () => {
  it('reads the direct-message conversation ids with the DM rule and selects only their ids', async () => {
    const { models, calls } = stubModels([], 0);

    await listChatMessages(listChatMessagesCommand.parse({}), BASE, models);

    assert.deepEqual(calls.conversationFind, [{ type: 'dm', participants: { $size: 2 } }]);
    assert.deepEqual(calls.conversationSelect, ['_id']);
  });

  it('matches live messages of direct conversations only and counts with the same filter', async () => {
    const { models, calls } = stubModels([], 1340);

    const result = await listChatMessages(listChatMessagesCommand.parse({}), BASE, models);

    assert.deepEqual(idsOf(calls.find[0]), [DM_1, DM_2]);
    assert.equal(calls.find[0].deletedAt, null);
    assert.deepEqual(calls.count[0], calls.find[0]);
    assert.equal(result.total, 1340);
  });

  it('narrows to one conversation when it is a direct conversation', async () => {
    const { models, calls } = stubModels([], 0);

    await listChatMessages(listChatMessagesCommand.parse({ conversationId: DM_2 }), BASE, models);

    assert.deepEqual(idsOf(calls.find[0]), [DM_2]);
  });

  it('matches nothing for a conversation that is not a direct conversation', async () => {
    const { models, calls } = stubModels([], 0);

    await listChatMessages(listChatMessagesCommand.parse({ conversationId: '65f0000000000000000000ff' }), BASE, models);

    assert.deepEqual(idsOf(calls.find[0]), []);
  });

  it('orders by created time then id, pages with skip and limit, and allows disk use', async () => {
    const { models, calls } = stubModels([], 1340);

    const result = await listChatMessages(listChatMessagesCommand.parse({ page: '3', limit: '50' }), BASE, models);

    assert.deepEqual(calls.sort, [{ createdAt: 1, _id: 1 }]);
    assert.deepEqual(calls.skip, [100]);
    assert.deepEqual(calls.limit, [50]);
    assert.deepEqual(calls.diskUse, [true]);
    assert.equal(result.page, 3);
    assert.equal(result.limit, 50);
  });

  it('selects only the allow-listed columns and never the deletion marker', async () => {
    const { models, calls } = stubModels([], 0);

    await listChatMessages(listChatMessagesCommand.parse({}), BASE, models);

    assert.equal(calls.select[0], 'conversationId sender content attachments forwardedFromMessageId createdAt updatedAt');
    assert.ok(!calls.select[0].includes('deletedAt'));
  });

  it('filters by created time with an inclusive from and an exclusive to', async () => {
    const { models, calls } = stubModels([], 0);

    await listChatMessages(listChatMessagesCommand.parse({ from: '2026-03-01', to: '2026-04-01T00:00:00Z' }), BASE, models);

    assert.deepEqual(calls.find[0].createdAt, { $gte: new Date('2026-03-01'), $lt: new Date('2026-04-01T00:00:00Z') });
  });

  it('maps a plain message', async () => {
    const { models } = stubModels([row()], 1);

    const { data } = await listChatMessages(listChatMessagesCommand.parse({}), BASE, models);

    assert.deepEqual(data, [
      {
        externalId: '65f000000000000000000001',
        conversationId: DM_1,
        sender: { type: 'client', id: '65f0000000000000000000b1' },
        content: 'hello',
        attachments: [],
        forwarded: false,
        createdAt: '2026-03-09T08:00:00.000Z',
        modifiedAt: '2026-03-09T08:05:00.000Z',
      },
    ]);
  });

  it('maps an attachment-only message to download links by position and never returns the stored URL', async () => {
    const attachments = [
      { url: 'https://pub-x.r2.dev/chat-attachments/c1/1-a.pdf', name: 'a.pdf', contentType: 'application/pdf', size: 2048 },
      { url: 'https://pub-x.r2.dev/chat-attachments/c1/2-b.png', name: 'b.png', contentType: 'image/png', size: 0 },
    ];
    const { models } = stubModels([row({ content: null, attachments })], 1);

    const { data } = await listChatMessages(listChatMessagesCommand.parse({}), BASE, models);

    assert.equal(data[0].content, null);
    assert.deepEqual(data[0].attachments, [
      {
        name: 'a.pdf',
        contentType: 'application/pdf',
        size: 2048,
        file: { url: `${BASE}/files/chat-messages/65f000000000000000000001?index=0`, storageKind: 'r2', size: null, checksum: null, name: 'a.pdf' },
      },
      {
        name: 'b.png',
        contentType: 'image/png',
        size: null,
        file: { url: `${BASE}/files/chat-messages/65f000000000000000000001?index=1`, storageKind: 'r2', size: null, checksum: null, name: 'b.png' },
      },
    ]);
    const body = JSON.stringify(data);
    assert.ok(!body.includes('r2.dev'));
    assert.ok(!body.includes('chat-attachments'));
  });

  it('answers a null file link for an attachment without a stored URL', async () => {
    const { models } = stubModels([row({ attachments: [{ name: 'x.pdf', contentType: 'application/pdf', size: 1 }] })], 1);

    const { data } = await listChatMessages(listChatMessagesCommand.parse({}), BASE, models);

    assert.equal(data[0].attachments[0].file, null);
  });

  it('flags a forwarded message without returning the forwarded message id', async () => {
    const { models } = stubModels([row({ forwardedFromMessageId: id('65f0000000000000000000d1') })], 1);

    const { data } = await listChatMessages(listChatMessagesCommand.parse({}), BASE, models);

    assert.equal(data[0].forwarded, true);
    assert.ok(!JSON.stringify(data).includes('65f0000000000000000000d1'));
  });

  it('keeps a staff sender and tolerates a message with no attachments field', async () => {
    const { models } = stubModels([row({ sender: { type: 'staff', id: id('65f0000000000000000000a1') }, attachments: undefined })], 1);

    const { data } = await listChatMessages(listChatMessagesCommand.parse({}), BASE, models);

    assert.deepEqual(data[0].sender, { type: 'staff', id: '65f0000000000000000000a1' });
    assert.deepEqual(data[0].attachments, []);
  });

  it('answers null dates for missing timestamps and never a 1970 date', async () => {
    const { models } = stubModels([row({ createdAt: new Date(0), updatedAt: undefined })], 1);

    const { data } = await listChatMessages(listChatMessagesCommand.parse({}), BASE, models);

    assert.equal(data[0].createdAt, null);
    assert.equal(data[0].modifiedAt, null);
  });

  it('reports a total of 0 when nothing matches', async () => {
    const { models } = stubModels([], 0);

    const result = await listChatMessages(listChatMessagesCommand.parse({}), BASE, models);

    assert.deepEqual(result, { data: [], total: 0, page: 1, limit: 100 });
  });
});

describe('toAttachmentKey', () => {
  it('takes the key from a public R2 URL, from a bare key and decodes escaped characters', () => {
    assert.equal(toAttachmentKey('https://pub-x.r2.dev/chat-attachments/c1/1-a.pdf'), 'chat-attachments/c1/1-a.pdf');
    assert.equal(toAttachmentKey('chat-attachments/c1/1-a.pdf'), 'chat-attachments/c1/1-a.pdf');
    assert.equal(toAttachmentKey('/chat-attachments/c1/1-a.pdf'), 'chat-attachments/c1/1-a.pdf');
    assert.equal(toAttachmentKey('https://pub-x.r2.dev/chat-attachments/c1/1-a%20b.pdf'), 'chat-attachments/c1/1-a b.pdf');
    assert.equal(toAttachmentKey('https://pub-x.r2.dev/chat-attachments/c1/100%.pdf'), 'chat-attachments/c1/100%.pdf');
  });
});

describe('listChatMessagesCommand', () => {
  it('defaults to the first page of 100', () => {
    assert.deepEqual(listChatMessagesCommand.parse({}), { page: 1, limit: 100 });
  });

  it('rejects unknown query keys, a bad conversation id, a bad date, from not before to, and a page size over 1000', () => {
    const queries = [{ leadId: '1' }, { conversationId: 'nope' }, { from: 'yesterday' }, { from: '2026-05-01', to: '2026-04-01' }, { limit: '1001' }, { page: '0' }];
    for (const query of queries) {
      assert.equal(listChatMessagesCommand.safeParse(query).success, false, JSON.stringify(query));
    }
  });
});
