import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MAX_LEAD_IDS } from '../../../shared/lead-ids-query';
import type { ZohoRecord, ZohoRelatedReadClient, ZohoRelatedRecords } from '../../../shared/zoho-read-client';
import { APPLICATION_STATUS_HISTORY_FIELDS } from '../../fields/application-status-history-fields';
import { listZohoApplicationStatusHistoryCommand } from './list-zoho-application-status-history.command';
import { listZohoApplicationStatusHistory } from './list-zoho-application-status-history.usecase';

const entry = (overrides: Record<string, unknown> = {}): ZohoRecord => ({ id: '9000000000000000001', ...overrides });

const stubClient = (histories: ZohoRelatedRecords[]) => {
  const calls: { module: string; parentIds: string[]; relatedList: string; fields: readonly string[] }[] = [];
  const client: ZohoRelatedReadClient = {
    getRelatedRecords: async (module, parentIds, relatedList, fields) => {
      calls.push({ module, parentIds, relatedList, fields });
      return histories;
    },
  };
  return { client, calls };
};

describe('listZohoApplicationStatusHistoryCommand', () => {
  it('splits, trims and de-duplicates the ids', () => {
    const parsed = listZohoApplicationStatusHistoryCommand.parse({ leadIds: ' 11, 22 ,11,,33 ' });
    assert.deepEqual(parsed.leadIds, ['11', '22', '33']);
  });

  it('requires at least one id and accepts at most 100', () => {
    const ids = (count: number) => Array.from({ length: count }, (_, index) => String(index + 1)).join(',');
    assert.equal(listZohoApplicationStatusHistoryCommand.safeParse({}).success, false);
    assert.equal(listZohoApplicationStatusHistoryCommand.safeParse({ leadIds: ids(MAX_LEAD_IDS) }).success, true);
    assert.equal(listZohoApplicationStatusHistoryCommand.safeParse({ leadIds: ids(MAX_LEAD_IDS + 1) }).success, false);
  });

  it('rejects ids that are not numeric and unknown query keys', () => {
    assert.equal(listZohoApplicationStatusHistoryCommand.safeParse({ leadIds: '11,abc' }).success, false);
    assert.equal(listZohoApplicationStatusHistoryCommand.safeParse({ leadIds: '11', page: '1' }).success, false);
  });
});

describe('listZohoApplicationStatusHistory', () => {
  it('reads the history related list of Visa_Applications for the ids with the allow list', async () => {
    const { client, calls } = stubClient([]);

    await listZohoApplicationStatusHistory({ leadIds: ['1', '2'] }, client);

    assert.deepEqual(calls, [
      { module: 'Visa_Applications', parentIds: ['1', '2'], relatedList: 'Application_Status_History', fields: APPLICATION_STATUS_HISTORY_FIELDS },
    ]);
  });

  it('asks Zoho for exactly the agreed fields and no Duration_Days', () => {
    assert.deepEqual([...APPLICATION_STATUS_HISTORY_FIELDS].sort(), ['Application_Stage', 'Modified_By', 'Modified_Time', 'Moved_To__s']);
  });

  it('returns one item per entry, each with its lead id and its own externalId', async () => {
    const { client } = stubClient([
      { parentId: '1', records: [entry({ id: 'a' }), entry({ id: 'b' })] },
      { parentId: '2', records: [entry({ id: 'c' })] },
    ]);

    const page = await listZohoApplicationStatusHistory({ leadIds: ['1', '2'] }, client);

    assert.deepEqual(
      page.data.map(({ leadId, externalId }) => [leadId, externalId]),
      [
        ['1', 'a'],
        ['1', 'b'],
        ['2', 'c'],
      ]
    );
  });

  it('counts a lead with no entries, or unknown to Zoho, as requested but not found', async () => {
    const { client } = stubClient([
      { parentId: '1', records: [entry()] },
      { parentId: '2', records: [] },
      { parentId: '3', records: [] },
    ]);

    const page = await listZohoApplicationStatusHistory({ leadIds: ['1', '2', '3'] }, client);

    assert.equal(page.requested, 3);
    assert.equal(page.found, 1);
    assert.equal(page.data.length, 1);
  });

  it('maps the stage, the stage it moved to and the time, untouched', async () => {
    const { client } = stubClient([
      {
        parentId: '1',
        records: [entry({ Application_Stage: 'Skill Assessment Stage', Moved_To__s: 'Stage 1 Documentation Reviewed', Modified_Time: '2026-11-21T12:21:24+05:30' })],
      },
    ]);

    const [item] = (await listZohoApplicationStatusHistory({ leadIds: ['1'] }, client)).data;

    assert.equal(item.stage, 'Skill Assessment Stage');
    assert.equal(item.movedTo, 'Stage 1 Documentation Reviewed');
    assert.equal(item.modifiedAt, '2026-11-21T12:21:24+05:30');
  });

  it('turns an empty stage or moved-to value into null', async () => {
    const { client } = stubClient([{ parentId: '1', records: [entry({ Application_Stage: null, Moved_To__s: '' })] }]);

    const [item] = (await listZohoApplicationStatusHistory({ leadIds: ['1'] }, client)).data;

    assert.equal(item.stage, null);
    assert.equal(item.movedTo, null);
    assert.equal(item.modifiedAt, null);
  });

  it('returns the user as id and name only, never the email', async () => {
    const { client } = stubClient([
      { parentId: '1', records: [entry({ Modified_By: { id: '164193000015755001', name: 'Processing Team A', email: 'processing1@worldvisa.in' } })] },
    ]);

    const [item] = (await listZohoApplicationStatusHistory({ leadIds: ['1'] }, client)).data;

    assert.deepEqual(item.modifiedBy, { id: '164193000015755001', name: 'Processing Team A' });
    assert.doesNotMatch(JSON.stringify(item), /worldvisa\.in/);
  });

  it('gives a null user when Zoho sends none, and a null name when the name is blank', async () => {
    const { client } = stubClient([
      { parentId: '1', records: [entry({ Modified_By: null }), entry({ Modified_By: { id: '5', name: '' } })] },
    ]);

    const items = (await listZohoApplicationStatusHistory({ leadIds: ['1'] }, client)).data;

    assert.equal(items[0].modifiedBy, null);
    assert.deepEqual(items[1].modifiedBy, { id: '5', name: null });
  });

  it('never returns a field outside the allow list', async () => {
    const { client } = stubClient([{ parentId: '1', records: [entry({ Duration_Days: 7, Exchange_Rate: 1, Owner: { id: '1' } })] }]);

    const [item] = (await listZohoApplicationStatusHistory({ leadIds: ['1'] }, client)).data;

    assert.deepEqual(Object.keys(item).sort(), ['externalId', 'leadId', 'modifiedAt', 'modifiedBy', 'movedTo', 'stage']);
  });
});
