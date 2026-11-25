import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Model } from 'mongoose';
import { ZohoUnavailableError, type ZohoReadClient, type ZohoRecord } from '../../../shared/zoho-read-client';
import { APPLICATION_COLUMNS, type ApplicationRow } from './map-application-to-dto';
import { listApplicationsCommand } from './list-applications.command';
import { buildApplicationFilter, listApplications } from './list-applications.usecase';

type ModelStub = Pick<Model<ApplicationRow>, 'find' | 'countDocuments'>;

const row = (overrides: Partial<ApplicationRow> = {}): ApplicationRow => ({
  _id: { toString: () => '65f000000000000000000001' },
  lead_id: '1234567890123456789',
  record_type: 'visa_application',
  name: 'Asha Rao',
  email: 'asha@example.com',
  phone: '9876543210',
  lead_owner: 'case.officer',
  ...overrides,
});

const stubModel = (rows: ApplicationRow[], total: number) => {
  const calls: Record<string, unknown> = {};
  const query = {
    select: (columns: string) => ((calls.select = columns), query),
    sort: (order: unknown) => ((calls.sort = order), query),
    skip: (count: number) => ((calls.skip = count), query),
    limit: (count: number) => ((calls.limit = count), query),
    allowDiskUse: (enabled: boolean) => ((calls.allowDiskUse = enabled), query),
    lean: async () => rows,
  };
  const model = {
    find: (filter: unknown) => ((calls.filter = filter), query),
    countDocuments: async () => total,
  } as unknown as ModelStub;
  return { model, calls };
};

const stubZoho = (records: ZohoRecord[] = []) => {
  const calls: { module: string; ids: string[]; fields: readonly string[] }[] = [];
  const client: ZohoReadClient = {
    getRecords: async (module, ids, fields) => {
      calls.push({ module, ids, fields });
      return records.filter((record) => ids.includes(record.id));
    },
  };
  return { client, calls };
};

describe('listApplications', () => {
  it('pages in a total order and reports the matching total', async () => {
    const { model, calls } = stubModel([row()], 2267);
    const command = listApplicationsCommand.parse({ page: '3', limit: '500' });

    const result = await listApplications(command, model, stubZoho().client);

    assert.deepEqual(calls.sort, { created_at: 1, _id: 1 });
    assert.equal(calls.skip, 1000);
    assert.equal(calls.limit, 500);
    assert.equal(calls.allowDiskUse, true);
    assert.equal(result.total, 2267);
    assert.equal(result.page, 3);
    assert.equal(result.limit, 500);
  });

  it('selects only the allow-listed columns, never secrets or embedded arrays', async () => {
    const { model, calls } = stubModel([], 0);

    await listApplications(listApplicationsCommand.parse({}), model, stubZoho().client);

    const selected = String(calls.select).split(' ');
    assert.equal(selected.join(' '), APPLICATION_COLUMNS.join(' '));
    for (const forbidden of ['password', 'password_value', 'checklist', 'notes', 'deadline_extensions', 'clerk_id']) {
      assert.ok(!selected.includes(forbidden), forbidden);
    }
  });

  it('maps a row with missing optional values to nulls and never to 1970', async () => {
    const { model } = stubModel(
      [row({ zoho_created_time: null, zoho_modified_time: new Date(0), created_at: new Date('2024-05-01T10:00:00Z') })],
      1
    );

    const [item] = (await listApplications(listApplicationsCommand.parse({}), model, stubZoho().client)).data;

    assert.equal(item.externalId, '65f000000000000000000001');
    assert.equal(item.leadId, '1234567890123456789');
    assert.equal(item.createdAt, null);
    assert.equal(item.modifiedAt, null);
    assert.equal(item.dmsCreatedAt, '2024-05-01T10:00:00.000Z');
    assert.equal(item.applicationState, null);
    assert.ok(!('password' in item));
  });

  it('returns a null record type for a row that has none', async () => {
    const { model } = stubModel([row({ record_type: null })], 1);

    const [item] = (await listApplications(listApplicationsCommand.parse({}), model, stubZoho().client)).data;

    assert.equal(item.recordType, null);
  });
});

describe('listApplications created time', () => {
  const list = async (rows: ApplicationRow[], client: ZohoReadClient) =>
    (await listApplications(listApplicationsCommand.parse({}), stubModel(rows, rows.length).model, client)).data;

  it('reads it from Zoho when the stored copy is empty, asking for that field only', async () => {
    const zoho = stubZoho([{ id: '111', Created_Time: '2022-12-27T15:30:00+05:30' }]);

    const [item] = await list([row({ lead_id: '111', zoho_created_time: null })], zoho.client);

    assert.equal(item.createdAt, '2022-12-27T10:00:00.000Z');
    assert.deepEqual(zoho.calls, [{ module: 'Visa_Applications', ids: ['111'], fields: ['Created_Time'] }]);
  });

  it('keeps the stored value and does not call Zoho', async () => {
    const zoho = stubZoho([{ id: '111', Created_Time: '2022-12-27T15:30:00+05:30' }]);

    const [item] = await list([row({ lead_id: '111', zoho_created_time: new Date('2025-01-02T00:00:00Z') })], zoho.client);

    assert.equal(item.createdAt, '2025-01-02T00:00:00.000Z');
    assert.deepEqual(zoho.calls, []);
  });

  it('reads each record type from its own Zoho module', async () => {
    const zoho = stubZoho([
      { id: '111', Created_Time: '2023-01-01T00:00:00Z' },
      { id: '222', Created_Time: '2024-01-01T00:00:00Z' },
    ]);

    const items = await list([row({ lead_id: '222', record_type: 'spouse_skill_assessment' }), row({ lead_id: '111' })], zoho.client);

    assert.deepEqual(
      items.map((item) => item.createdAt),
      ['2024-01-01T00:00:00.000Z', '2023-01-01T00:00:00.000Z']
    );
    assert.deepEqual(
      zoho.calls.map(({ module, ids }) => ({ module, ids })),
      [
        { module: 'Visa_Applications', ids: ['111'] },
        { module: 'Spouse_Skill_Assessment', ids: ['222'] },
      ]
    );
  });

  it('stays null for a lead Zoho does not have or has no date for', async () => {
    const zoho = stubZoho([{ id: '222', Created_Time: null }]);

    const items = await list([row({ lead_id: '111' }), row({ lead_id: '222' })], zoho.client);

    assert.deepEqual(
      items.map((item) => item.createdAt),
      [null, null]
    );
  });

  it('asks for at most 100 distinct ids per request', async () => {
    const zoho = stubZoho();
    const rows = Array.from({ length: 150 }, (_, index) => row({ lead_id: String(1000 + index) }));

    await list([...rows, row({ lead_id: '1000' })], zoho.client);

    assert.deepEqual(
      zoho.calls.map(({ ids }) => ids.length),
      [100, 50]
    );
  });

  it('does not ask Zoho about a row with no record type or a lead id that is not a Zoho id', async () => {
    const zoho = stubZoho();

    await list([row({ record_type: null }), row({ lead_id: 'manual-1' })], zoho.client);

    assert.deepEqual(zoho.calls, []);
  });

  it('fails the request when Zoho does not answer instead of returning null', async () => {
    const client: ZohoReadClient = {
      getRecords: async () => {
        throw new ZohoUnavailableError();
      },
    };

    await assert.rejects(list([row()], client), ZohoUnavailableError);
  });
});

describe('buildApplicationFilter', () => {
  it('has no conditions when nothing is asked for', () => {
    assert.deepEqual(buildApplicationFilter(listApplicationsCommand.parse({})), {});
  });

  it('filters by record type and an inclusive-from, exclusive-to window on created_at', () => {
    const command = listApplicationsCommand.parse({
      recordType: 'spouse_skill_assessment',
      from: '2024-01-01',
      to: '2024-02-01T00:00:00Z',
    });

    assert.deepEqual(buildApplicationFilter(command), {
      record_type: 'spouse_skill_assessment',
      created_at: { $gte: new Date('2024-01-01'), $lt: new Date('2024-02-01T00:00:00Z') },
    });
  });
});

describe('listApplicationsCommand', () => {
  it('defaults to page 1 and 100 rows', () => {
    const command = listApplicationsCommand.parse({});
    assert.equal(command.page, 1);
    assert.equal(command.limit, 100);
  });

  it('rejects a limit above 1000, an unknown record type and a reversed window', () => {
    assert.equal(listApplicationsCommand.safeParse({ limit: '1001' }).success, false);
    assert.equal(listApplicationsCommand.safeParse({ recordType: 'main' }).success, false);
    assert.equal(listApplicationsCommand.safeParse({ from: '2024-02-01', to: '2024-01-01' }).success, false);
    assert.equal(listApplicationsCommand.safeParse({ from: 'yesterday' }).success, false);
  });

  it('rejects an unknown query key instead of silently returning every row', () => {
    assert.equal(listApplicationsCommand.safeParse({ recordtype: 'visa_application' }).success, false);
    assert.equal(listApplicationsCommand.safeParse({ leadId: '1' }).success, false);
  });
});
