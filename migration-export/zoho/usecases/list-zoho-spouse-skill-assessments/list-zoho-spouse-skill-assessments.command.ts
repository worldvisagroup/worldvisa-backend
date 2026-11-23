import { z } from 'zod';
import { leadIdsQuery } from '../../../shared/lead-ids-query';

export const listZohoSpouseSkillAssessmentsCommand = z.object({ leadIds: leadIdsQuery }).strict();

export type ListZohoSpouseSkillAssessmentsCommand = z.infer<typeof listZohoSpouseSkillAssessmentsCommand>;
