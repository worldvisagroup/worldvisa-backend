import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MAX_LEAD_IDS } from '../../../shared/lead-ids-query';
import type { ZohoReadClient, ZohoRecord } from '../../../shared/zoho-read-client';
import { SPOUSE_SKILL_ASSESSMENT_FIELDS } from '../../fields/spouse-skill-assessment-fields';
import { listZohoSpouseSkillAssessmentsCommand } from './list-zoho-spouse-skill-assessments.command';
import { listZohoSpouseSkillAssessments } from './list-zoho-spouse-skill-assessments.usecase';

const record = (overrides: Record<string, unknown> = {}): ZohoRecord => ({ id: '2000000000000000001', ...overrides });

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

describe('listZohoSpouseSkillAssessmentsCommand', () => {
  it('splits, trims and de-duplicates the ids', () => {
    const parsed = listZohoSpouseSkillAssessmentsCommand.parse({ leadIds: ' 11, 22 ,11,,33 ' });
    assert.deepEqual(parsed.leadIds, ['11', '22', '33']);
  });

  it('requires at least one id and accepts at most 100', () => {
    const ids = (count: number) => Array.from({ length: count }, (_, index) => String(index + 1)).join(',');
    assert.equal(listZohoSpouseSkillAssessmentsCommand.safeParse({}).success, false);
    assert.equal(listZohoSpouseSkillAssessmentsCommand.safeParse({ leadIds: ids(MAX_LEAD_IDS) }).success, true);
    assert.equal(listZohoSpouseSkillAssessmentsCommand.safeParse({ leadIds: ids(MAX_LEAD_IDS + 1) }).success, false);
  });

  it('rejects ids that are not numeric and unknown query keys', () => {
    assert.equal(listZohoSpouseSkillAssessmentsCommand.safeParse({ leadIds: '11,abc' }).success, false);
    assert.equal(listZohoSpouseSkillAssessmentsCommand.safeParse({ leadIds: '11', page: '1' }).success, false);
  });
});

describe('listZohoSpouseSkillAssessments', () => {
  it('reads the Spouse_Skill_Assessment module for the ids with the allow list', async () => {
    const { client, calls } = stubClient([]);

    await listZohoSpouseSkillAssessments({ leadIds: ['1', '2'] }, client);

    assert.deepEqual(calls, [{ module: 'Spouse_Skill_Assessment', ids: ['1', '2'], fields: SPOUSE_SKILL_ASSESSMENT_FIELDS }]);
  });

  it('asks Zoho for exactly the agreed fields and the main applicant lookup', () => {
    assert.deepEqual([...SPOUSE_SKILL_ASSESSMENT_FIELDS].sort(), [
      'Spouse_Date_of_OutCome',
      'Spouse_Education',
      'Spouse_Experience_Considered',
      'Spouse_ANZSCO',
      'Spouse_Out_Come_Validity',
      'Spouse_s_Skill_Assessing_Authority',
      'Visa_Applications',
    ].sort());
  });

  it('counts a lead Zoho does not have as requested but not found', async () => {
    const { client } = stubClient([record({ id: '1' })]);

    const page = await listZohoSpouseSkillAssessments({ leadIds: ['1', '2', '3'] }, client);

    assert.equal(page.requested, 3);
    assert.equal(page.found, 1);
    assert.deepEqual(
      page.data.map(({ leadId }) => leadId),
      ['1']
    );
  });

  it('carries the Zoho id as both leadId and externalId and the main applicant id from the lookup', async () => {
    const { client } = stubClient([record({ id: '42', Visa_Applications: { id: '7', name: 'Ravi' } })]);

    const [item] = (await listZohoSpouseSkillAssessments({ leadIds: ['42'] }, client)).data;

    assert.equal(item.leadId, '42');
    assert.equal(item.externalId, '42');
    assert.equal(item.mainLeadId, '7');
  });

  it('gives a null mainLeadId when the lookup is empty', async () => {
    const { client } = stubClient([record({ Visa_Applications: null })]);

    const [item] = (await listZohoSpouseSkillAssessments({ leadIds: ['1'] }, client)).data;

    assert.equal(item.mainLeadId, null);
  });

  it('maps the layout fields under readable names, untouched', async () => {
    const { client } = stubClient([
      record({
        Spouse_s_Skill_Assessing_Authority: ['ACS'],
        Spouse_ANZSCO: ['261313', '261312'],
        Spouse_Date_of_OutCome: '2025-02-03',
        Spouse_Out_Come_Validity: '2028-02-03',
        Spouse_Experience_Considered: '5 years',
        Spouse_Education: 'Bachelor',
      }),
    ]);

    const [item] = (await listZohoSpouseSkillAssessments({ leadIds: ['1'] }, client)).data;

    assert.deepEqual(item.skillAssessment, {
      assessingAuthority: ['ACS'],
      anzsco: ['261313', '261312'],
      outcomeDate: '2025-02-03',
      validUpto: '2028-02-03',
      experienceConsidered: '5 years',
      education: 'Bachelor',
    });
  });

  it('turns an empty field into null: nothing, blank text and no selection', async () => {
    const { client } = stubClient([record({ Spouse_ANZSCO: [], Spouse_Education: '', Spouse_Date_of_OutCome: null })]);

    const [item] = (await listZohoSpouseSkillAssessments({ leadIds: ['1'] }, client)).data;

    assert.equal(item.skillAssessment.anzsco, null);
    assert.equal(item.skillAssessment.education, null);
    assert.equal(item.skillAssessment.outcomeDate, null);
    assert.equal(item.skillAssessment.validUpto, null);
  });

  it('never returns a field outside the allow list', async () => {
    const { client } = stubClient([
      record({ DMS_Portal_Account: 'secret', Email: 'a@b.com', Phone: '999', Spouse_Language_Ability: 'Competent', Owner: { id: '1' } }),
    ]);

    const [item] = (await listZohoSpouseSkillAssessments({ leadIds: ['1'] }, client)).data;

    assert.doesNotMatch(JSON.stringify(item), /secret|a@b\.com|999|Competent/);
    assert.deepEqual(Object.keys(item).sort(), ['externalId', 'leadId', 'mainLeadId', 'skillAssessment']);
  });
});
