import type { SpouseSkillAssessmentResponseDto } from '../../dtos/spouse-skill-assessment-response.dto';
import { SPOUSE_SKILL_ASSESSMENT_FIELDS } from '../../fields/spouse-skill-assessment-fields';
import type { ZohoPage } from '../../../shared/lead-ids-query';
import { ZOHO_MODULE_BY_RECORD_TYPE } from '../../../shared/record-type';
import { zohoReadClient, type ZohoReadClient } from '../../../shared/zoho-read-client';
import type { ListZohoSpouseSkillAssessmentsCommand } from './list-zoho-spouse-skill-assessments.command';
import { mapSpouseSkillAssessmentToDto } from './map-spouse-skill-assessment-to-dto';

export const listZohoSpouseSkillAssessments = async (
  { leadIds }: ListZohoSpouseSkillAssessmentsCommand,
  client: ZohoReadClient = zohoReadClient
): Promise<ZohoPage<SpouseSkillAssessmentResponseDto>> => {
  const records = await client.getRecords(ZOHO_MODULE_BY_RECORD_TYPE.spouse_skill_assessment, leadIds, SPOUSE_SKILL_ASSESSMENT_FIELDS);
  const data = records.map(mapSpouseSkillAssessmentToDto);
  return { data, requested: leadIds.length, found: data.length };
};
