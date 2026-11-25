import { z } from 'zod';

export const MAX_LEAD_IDS = 100;
export const ZOHO_ID_PATTERN = /^\d{1,32}$/;

// `leadIds=1,2,3`: Zoho record ids are numeric strings. Duplicates are dropped so `requested` counts distinct ids.
export const leadIdsQuery = z
  .string()
  .transform((value) => [...new Set(value.split(',').map((id) => id.trim()).filter(Boolean))])
  .pipe(z.array(z.string().regex(ZOHO_ID_PATTERN, 'Zoho ids are numeric')).min(1).max(MAX_LEAD_IDS));

export interface ZohoPage<T> {
  data: T[];
  requested: number;
  found: number;
}
