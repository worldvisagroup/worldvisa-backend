import type { SpouseSkillAssessmentResponseDto } from '../../dtos/spouse-skill-assessment-response.dto';
import { MAIN_APPLICATION_LOOKUP, SPOUSE_SKILL_ASSESSMENT } from '../../fields/spouse-skill-assessment-fields';
import { lookupId, pickFields } from '../../pick-fields';
import type { ZohoRecord } from '../../../shared/zoho-read-client';

export const mapSpouseSkillAssessmentToDto = (record: ZohoRecord): SpouseSkillAssessmentResponseDto => ({
  leadId: record.id,
  externalId: record.id,
  mainLeadId: lookupId(record[MAIN_APPLICATION_LOOKUP]),
  skillAssessment: pickFields(record, SPOUSE_SKILL_ASSESSMENT),
});
