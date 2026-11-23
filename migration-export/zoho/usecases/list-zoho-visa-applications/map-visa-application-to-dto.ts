import type { LanguageDto, VisaApplicationResponseDto } from '../../dtos/visa-application-response.dto';
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
  VISA_GRANT,
} from '../../fields/visa-application-fields';
import { pickFields } from '../../pick-fields';
import type { ZohoRecord } from '../../../shared/zoho-read-client';

const mapLanguage = (record: ZohoRecord): LanguageDto => ({
  ...pickFields(record, LANGUAGE),
  ielts: pickFields(record, LANGUAGE_TESTS.ielts),
  pte: pickFields(record, LANGUAGE_TESTS.pte),
  toefl: pickFields(record, LANGUAGE_TESTS.toefl),
  celpip: pickFields(record, LANGUAGE_TESTS.celpip),
  oet: pickFields(record, LANGUAGE_TESTS.oet),
});

export const mapVisaApplicationToDto = (record: ZohoRecord): VisaApplicationResponseDto => ({
  leadId: record.id,
  externalId: record.id,
  skillAssessment: pickFields(record, SKILL_ASSESSMENT),
  saOutcome: pickFields(record, SA_OUTCOME),
  eoi: pickFields(record, EOI),
  roi: ROI_ROUNDS.map((round, index) => ({ round: (index + 1) as 1 | 2 | 3, ...pickFields(record, round) })),
  invitation: pickFields(record, INVITATION),
  itaFiled: pickFields(record, ITA_FILED),
  itaFinal: pickFields(record, ITA_FINAL),
  lodge: pickFields(record, LODGE),
  medicals: pickFields(record, MEDICALS),
  visaGrant: pickFields(record, VISA_GRANT),
  language: mapLanguage(record),
  other: pickFields(record, OTHER),
});
