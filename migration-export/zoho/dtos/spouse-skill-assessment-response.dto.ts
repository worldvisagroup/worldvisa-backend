import type { SPOUSE_SKILL_ASSESSMENT } from '../fields/spouse-skill-assessment-fields';
import type { Picked } from '../pick-fields';

export interface SpouseSkillAssessmentResponseDto {
  leadId: string;
  externalId: string;
  mainLeadId: string | null;
  skillAssessment: Picked<typeof SPOUSE_SKILL_ASSESSMENT>;
}
