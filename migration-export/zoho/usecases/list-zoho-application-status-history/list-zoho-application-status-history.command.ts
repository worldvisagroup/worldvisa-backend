import { z } from 'zod';
import { leadIdsQuery } from '../../../shared/lead-ids-query';

export const listZohoApplicationStatusHistoryCommand = z.object({ leadIds: leadIdsQuery }).strict();

export type ListZohoApplicationStatusHistoryCommand = z.infer<typeof listZohoApplicationStatusHistoryCommand>;
