import type {
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
} from '../fields/visa-application-fields';
import type { Picked } from '../pick-fields';

export type RoiRoundDto = Picked<(typeof ROI_ROUNDS)[number]> & { round: 1 | 2 | 3 };

export type LanguageDto = Picked<typeof LANGUAGE> & {
  [Test in keyof typeof LANGUAGE_TESTS]: Picked<(typeof LANGUAGE_TESTS)[Test]>;
};

export interface VisaApplicationResponseDto {
  leadId: string;
  externalId: string;
  skillAssessment: Picked<typeof SKILL_ASSESSMENT>;
  saOutcome: Picked<typeof SA_OUTCOME>;
  eoi: Picked<typeof EOI>;
  roi: RoiRoundDto[];
  invitation: Picked<typeof INVITATION>;
  itaFiled: Picked<typeof ITA_FILED>;
  itaFinal: Picked<typeof ITA_FINAL>;
  lodge: Picked<typeof LODGE>;
  medicals: Picked<typeof MEDICALS>;
  visaGrant: Picked<typeof VISA_GRANT>;
  language: LanguageDto;
  other: Picked<typeof OTHER>;
}
