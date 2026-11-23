import { z } from 'zod';
import { leadIdsQuery } from '../../../shared/lead-ids-query';

export const listZohoVisaApplicationsCommand = z.object({ leadIds: leadIdsQuery }).strict();

export type ListZohoVisaApplicationsCommand = z.infer<typeof listZohoVisaApplicationsCommand>;
