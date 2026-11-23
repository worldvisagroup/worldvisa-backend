import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MAX_LEAD_IDS } from '../../../shared/lead-ids-query';
import type { ZohoReadClient, ZohoRecord } from '../../../shared/zoho-read-client';
import {
  EOI,
  INVITATION,
  ITA_FILED,
  ITA_FINAL,
  LANGUAGE,
  LANGUAGE_TESTS,
  LODGE,
  MEDICALS,
  OTHER,
  ROI_ROUNDS,
  SA_OUTCOME,
  SKILL_ASSESSMENT,
  VISA_APPLICATION_FIELDS,
  VISA_GRANT,
} from '../../fields/visa-application-fields';
import { listZohoVisaApplicationsCommand } from './list-zoho-visa-applications.command';
import { listZohoVisaApplications } from './list-zoho-visa-applications.usecase';

const record = (overrides: Record<string, unknown> = {}): ZohoRecord => ({ id: '1000000000000000001', ...overrides });

const stubClient = (records: ZohoRecord[]) => {
  const calls: { module: string; ids: string[]; fields: readonly string[] }[] = [];
  const client: ZohoReadClient = {
    getRecords: async (module, ids, fields) => {
      calls.push({ module, ids, fields });
      return records;
    },
  };
  return { client, calls };
};

describe('listZohoVisaApplicationsCommand', () => {
  it('splits, trims and de-duplicates the ids', () => {
    const parsed = listZohoVisaApplicationsCommand.parse({ leadIds: ' 11, 22 ,11,,33 ' });
    assert.deepEqual(parsed.leadIds, ['11', '22', '33']);
  });

  it('requires at least one id', () => {
    assert.equal(listZohoVisaApplicationsCommand.safeParse({}).success, false);
    assert.equal(listZohoVisaApplicationsCommand.safeParse({ leadIds: ' , ' }).success, false);
  });

  it('accepts exactly 100 ids and rejects 101', () => {
    const ids = (count: number) => Array.from({ length: count }, (_, index) => String(index + 1)).join(',');
    assert.equal(listZohoVisaApplicationsCommand.safeParse({ leadIds: ids(MAX_LEAD_IDS) }).success, true);
    assert.equal(listZohoVisaApplicationsCommand.safeParse({ leadIds: ids(MAX_LEAD_IDS + 1) }).success, false);
  });

  it('rejects ids that are not numeric', () => {
    assert.equal(listZohoVisaApplicationsCommand.safeParse({ leadIds: '11,abc' }).success, false);
  });

  it('rejects unknown query keys, including paging', () => {
    assert.equal(listZohoVisaApplicationsCommand.safeParse({ leadIds: '11', page: '1' }).success, false);
  });
});

describe('listZohoVisaApplications', () => {
  it('reads the Visa_Applications module for the ids with the allow list', async () => {
    const { client, calls } = stubClient([]);

    await listZohoVisaApplications({ leadIds: ['1', '2'] }, client);

    assert.deepEqual(calls, [{ module: 'Visa_Applications', ids: ['1', '2'], fields: VISA_APPLICATION_FIELDS }]);
  });

  it('counts a lead Zoho does not have as requested but not found', async () => {
    const { client } = stubClient([record({ id: '1' })]);

    const page = await listZohoVisaApplications({ leadIds: ['1', '2', '3'] }, client);

    assert.equal(page.requested, 3);
    assert.equal(page.found, 1);
    assert.deepEqual(
      page.data.map(({ leadId }) => leadId),
      ['1']
    );
  });

  it('carries the Zoho id as both leadId and externalId', async () => {
    const { client } = stubClient([record({ id: '42' })]);

    const [item] = (await listZohoVisaApplications({ leadIds: ['42'] }, client)).data;

    assert.equal(item.leadId, '42');
    assert.equal(item.externalId, '42');
  });

  it('groups values by layout section under readable names, untouched', async () => {
    const { client } = stubClient([
      record({
        Stage_1_Name: 'SA - Ravi',
        ANZSCO_NOC: ['261313', '261312'],
        Fee_Paid: '545',
        Lodgement_Date: '2025-02-03',
        Date_of_filing_Stage_2: '2025-03-04',
        Test_Taken_Date: '2025-09-01',
        Medical: true,
        NO_OF_APPLICANTS: 2,
        HAP_Id: 'HAP-9',
        Service_Type: 'Skilled',
      }),
    ]);

    const [item] = (await listZohoVisaApplications({ leadIds: ['1000000000000000001'] }, client)).data;

    assert.equal(item.skillAssessment.name, 'SA - Ravi');
    assert.deepEqual(item.skillAssessment.anzsco, ['261313', '261312']);
    assert.equal(item.skillAssessment.governmentFee, '545');
    assert.equal(item.skillAssessment.dateOfFiling, '2025-02-03');
    assert.equal(item.eoi.dateOfFiling, '2025-03-04');
    assert.equal(item.eoi.filingDeadline, '2025-09-01');
    assert.equal(item.lodge.medical, true);
    assert.equal(item.lodge.numberOfApplicants, 2);
    assert.equal(item.medicals.hapId, 'HAP-9');
    assert.equal(item.other.serviceType, 'Skilled');
  });

  it('turns an empty field into null: nothing, blank text and no selection', async () => {
    const { client } = stubClient([record({ Assessing_Authority: '', ANZSCO_NOC: [], NOC_S: null })]);

    const [item] = (await listZohoVisaApplications({ leadIds: ['1000000000000000001'] }, client)).data;

    assert.equal(item.skillAssessment.assessingAuthority, null);
    assert.equal(item.skillAssessment.anzsco, null);
    assert.equal(item.skillAssessment.noc, null);
    assert.equal(item.skillAssessment.fileNo, null);
  });

  it('keeps a zero and a false, which are values and not empty', async () => {
    const { client } = stubClient([record({ Fee: 0, Medical: false })]);

    const [item] = (await listZohoVisaApplications({ leadIds: ['1000000000000000001'] }, client)).data;

    assert.equal(item.itaFiled.fee, 0);
    assert.equal(item.lodge.medical, false);
  });

  it('returns the three ROI rounds in order, each from its own Zoho fields', async () => {
    const { client } = stubClient([
      record({
        DATE: '2025-01-01',
        Points_PNP: 85,
        ROI_2_Date: '2025-02-02',
        ROI_2_States_Lodge: 'NSW',
        ROI_3_Date: '2025-03-03',
        Express_Entry_PNP_31: 'EE-3',
      }),
    ]);

    const [item] = (await listZohoVisaApplications({ leadIds: ['1000000000000000001'] }, client)).data;

    assert.deepEqual(
      item.roi.map(({ round }) => round),
      [1, 2, 3]
    );
    assert.equal(item.roi[0].date, '2025-01-01');
    assert.equal(item.roi[0].points, 85);
    assert.equal(item.roi[1].date, '2025-02-02');
    assert.equal(item.roi[1].statesLodge, 'NSW');
    assert.equal(item.roi[1].points, null);
    assert.equal(item.roi[2].date, '2025-03-03');
    assert.equal(item.roi[2].expressEntryNumber, 'EE-3');
  });

  it('reads each test\'s outcome date and validity from its own Zoho fields, following the layout labels', async () => {
    const { client } = stubClient([
      record({
        Test_Taken: 'PTE',
        Visa_Approved: '2025-04-01',
        PTE_Validity_Upt: '2027-04-01',
        PTE_Validity_Upto: '2099-01-01',
        IELTS_OutCome_Date: '2024-01-01',
        Last_Date_for_Submission_of_Documents: '2025-05-05',
      }),
    ]);

    const [item] = (await listZohoVisaApplications({ leadIds: ['1000000000000000001'] }, client)).data;

    assert.equal(item.language.testTaken, 'PTE');
    assert.equal(item.language.pte.outcomeDate, '2025-04-01');
    assert.equal(item.language.pte.validUpto, '2027-04-01');
    assert.equal(item.language.ielts.outcomeDate, '2024-01-01');
    assert.equal(item.language.ielts.validUpto, null);
    assert.equal(item.language.oet.outcomeDate, '2025-05-05');
    assert.equal(item.language.toefl.outcomeDate, null);
    assert.equal(item.language.celpip.validUpto, null);
  });

  it('never returns a field outside the allow list', async () => {
    const { client } = stubClient([record({ DMS_Portal_Account: 'secret', Email: 'a@b.com', Owner: { id: '1' } })]);

    const [item] = (await listZohoVisaApplications({ leadIds: ['1000000000000000001'] }, client)).data;

    assert.doesNotMatch(JSON.stringify(item), /secret|a@b\.com/);
  });
});

describe('visa application allow list', () => {
  const groups = [SKILL_ASSESSMENT, SA_OUTCOME, EOI, INVITATION, ITA_FILED, ITA_FINAL, LODGE, MEDICALS, VISA_GRANT, LANGUAGE, ...Object.values(LANGUAGE_TESTS), OTHER, ...ROI_ROUNDS];

  it('maps every Zoho field to one output name only', () => {
    const apiNames = groups.flatMap((group) => Object.values<string | null>(group)).filter((name): name is string => name !== null);

    assert.equal(new Set(apiNames).size, apiNames.length);
    assert.deepEqual([...VISA_APPLICATION_FIELDS].sort(), [...apiNames].sort());
  });

  it('does not ask for the portal account or any email field', () => {
    assert.ok(!VISA_APPLICATION_FIELDS.includes('DMS_Portal_Account'));
    assert.ok(!VISA_APPLICATION_FIELDS.some((name) => /email/i.test(name)));
  });
});
