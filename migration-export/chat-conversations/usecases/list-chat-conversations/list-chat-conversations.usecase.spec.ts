import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ChatConversationModels } from './list-chat-conversations.usecase';
import type { ChatConversationRow } from './map-chat-conversation-to-dto';
import { listChatConversationsCommand } from './list-chat-conversations.command';
import { listChatConversations } from './list-chat-conversations.usecase';

type Filter = Record<string, unknown>;

const id = (value: string) => ({ toString: () => value });

const row = (overrides: Partial<ChatConversationRow> = {}): ChatConversationRow => ({
  _id: id('65f000000000000000000001'),
  participants: [
    { type: 'staff', id: id('65f0000000000000000000a1') },
    { type: 'client', id: id('65f0000000000000000000b1') },
  ],
  lastMessageAt: new Date('2026-11-21T10:00:00.000Z'),
  createdAt: new Date('2026-03-09T08:00:00.000Z'),
  updatedAt: new Date('2026-11-21T10:00:00.000Z'),
  ...overrides,
});

const stubModels = (rows: ChatConversationRow[], total: number, clients: Array<{ _id: { toString(): string }; lead_id?: string | null }> = []) => {
  const calls = { find: [] as Filter[], count: [] as Filter[], select: [] as string[], sort: [] as Filter[], skip: [] as number[], limit: [] as number[], diskUse: [] as boolean[], clientFind: [] as Filter[] };
  const chain = (result: unknown) => {
    const query: Record<string, unknown> = {};
    query.select = (columns: string) => (calls.select.push(columns), query);
    query.sort = (order: Filter) => (calls.sort.push(order), query);
    query.skip = (n: number) => (calls.skip.push(n), query);
    query.limit = (n: number) => (calls.limit.push(n), query);
    query.allowDiskUse = (enabled: boolean) => (calls.diskUse.push(enabled), query);
    query.lean = () => Promise.resolve(result);
    return query;
  };
  const models = {
    conversations: {
      find: (filter: Filter) => (calls.find.push(filter), chain(rows)),
      countDocuments: (filter: Filter) => (calls.count.push(filter), Promise.resolve(total)),
    },
    clients: {
      find: (filter: Filter) => (calls.clientFind.push(filter), chain(clients)),
    },
  } as unknown as ChatConversationModels;
  return { models, calls };
};

describe('listChatConversations', () => {
  it('matches direct messages with exactly two participants and counts with the same filter', async () => {
    const { models, calls } = stubModels([], 175);

    const result = await listChatConversations(listChatConversationsCommand.parse({}), models);

    assert.deepEqual(calls.find[0], { type: 'dm', participants: { $size: 2 } });
    assert.deepEqual(calls.count[0], calls.find[0]);
    assert.equal(result.total, 175);
  });

  it('orders by created time then id, pages with skip and limit, and allows disk use', async () => {
    const { models, calls } = stubModels([], 175);

    const result = await listChatConversations(listChatConversationsCommand.parse({ page: '3', limit: '50' }), models);

    assert.deepEqual(calls.sort, [{ createdAt: 1, _id: 1 }]);
    assert.deepEqual(calls.skip, [100]);
    assert.deepEqual(calls.limit, [50]);
    assert.deepEqual(calls.diskUse, [true]);
    assert.equal(result.page, 3);
    assert.equal(result.limit, 50);
  });

  it('selects only the allow-listed columns', async () => {
    const { models, calls } = stubModels([], 0);

    await listChatConversations(listChatConversationsCommand.parse({}), models);

    assert.equal(calls.select[0], 'participants lastMessageAt createdAt updatedAt');
  });

  it('filters by created time with an inclusive from and an exclusive to', async () => {
    const { models, calls } = stubModels([], 0);

    await listChatConversations(listChatConversationsCommand.parse({ from: '2026-03-01', to: '2026-04-01T00:00:00Z' }), models);

    assert.deepEqual(calls.find[0].createdAt, { $gte: new Date('2026-03-01'), $lt: new Date('2026-04-01T00:00:00Z') });
  });

  it('maps a staff-with-client conversation and resolves the client lead id', async () => {
    const { models } = stubModels([row()], 1, [{ _id: id('65f0000000000000000000b1'), lead_id: '1234567890123456789' }]);

    const { data } = await listChatConversations(listChatConversationsCommand.parse({}), models);

    assert.deepEqual(data, [
      {
        externalId: '65f000000000000000000001',
        participants: [
          { type: 'staff', id: '65f0000000000000000000a1' },
          { type: 'client', id: '65f0000000000000000000b1' },
        ],
        clientLeadId: '1234567890123456789',
        lastMessageAt: '2026-11-21T10:00:00.000Z',
        createdAt: '2026-03-09T08:00:00.000Z',
        modifiedAt: '2026-11-21T10:00:00.000Z',
      },
    ]);
  });

  it('keeps the stored participant order when the client is stored first', async () => {
    const { models } = stubModels(
      [row({ participants: [{ type: 'client', id: id('65f0000000000000000000b1') }, { type: 'staff', id: id('65f0000000000000000000a1') }] })],
      1,
      [{ _id: id('65f0000000000000000000b1'), lead_id: '99' }]
    );

    const { data } = await listChatConversations(listChatConversationsCommand.parse({}), models);

    assert.deepEqual(data[0].participants.map(({ type }) => type), ['client', 'staff']);
    assert.equal(data[0].clientLeadId, '99');
  });

  it('answers a null client lead id for staff with staff and never looks clients up', async () => {
    const staffOnly = row({ participants: [{ type: 'staff', id: id('65f0000000000000000000a1') }, { type: 'staff', id: id('65f0000000000000000000a2') }] });
    const { models, calls } = stubModels([staffOnly], 1);

    const { data } = await listChatConversations(listChatConversationsCommand.parse({}), models);

    assert.equal(data[0].clientLeadId, null);
    assert.deepEqual(calls.clientFind, []);
  });

  it('answers a null client lead id when the client record no longer exists or has no lead id', async () => {
    const { models } = stubModels([row(), row({ _id: id('65f000000000000000000002') })], 2, [{ _id: id('65f0000000000000000000b1'), lead_id: null }]);

    const { data } = await listChatConversations(listChatConversationsCommand.parse({}), models);

    assert.deepEqual(data.map(({ clientLeadId }) => clientLeadId), [null, null]);
  });

  it('looks every client of the page up in one query', async () => {
    const second = row({ _id: id('65f000000000000000000002'), participants: [{ type: 'staff', id: id('65f0000000000000000000a1') }, { type: 'client', id: id('65f0000000000000000000b2') }] });
    const { models, calls } = stubModels([row(), second], 2, [
      { _id: id('65f0000000000000000000b1'), lead_id: '1' },
      { _id: id('65f0000000000000000000b2'), lead_id: '2' },
    ]);

    const { data } = await listChatConversations(listChatConversationsCommand.parse({}), models);

    assert.equal(calls.clientFind.length, 1);
    const queriedIds = (calls.clientFind[0]._id as { $in: Array<{ toString(): string }> }).$in.map(String);
    assert.deepEqual(queriedIds, ['65f0000000000000000000b1', '65f0000000000000000000b2']);
    assert.deepEqual(data.map(({ clientLeadId }) => clientLeadId), ['1', '2']);
  });

  it('answers null dates for a conversation with no messages and never a 1970 date', async () => {
    const { models } = stubModels([row({ lastMessageAt: null, createdAt: new Date(0), updatedAt: undefined })], 1);

    const { data } = await listChatConversations(listChatConversationsCommand.parse({}), models);

    assert.equal(data[0].lastMessageAt, null);
    assert.equal(data[0].createdAt, null);
    assert.equal(data[0].modifiedAt, null);
  });

  it('reports a total of 0 when nothing matches', async () => {
    const { models } = stubModels([], 0);

    const result = await listChatConversations(listChatConversationsCommand.parse({}), models);

    assert.deepEqual(result, { data: [], total: 0, page: 1, limit: 100 });
  });
});

describe('listChatConversationsCommand', () => {
  it('defaults to the first page of 100', () => {
    assert.deepEqual(listChatConversationsCommand.parse({}), { page: 1, limit: 100 });
  });

  it('rejects unknown query keys, a bad date, from not before to, and a page size over 1000', () => {
    const queries = [{ leadId: '1' }, { from: 'yesterday' }, { from: '2026-05-01', to: '2026-04-01' }, { limit: '1001' }, { page: '0' }];
    for (const query of queries) {
      assert.equal(listChatConversationsCommand.safeParse(query).success, false, JSON.stringify(query));
    }
  });
});
