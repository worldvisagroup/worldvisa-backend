import { z } from 'zod';

export const isoDateQuery = z
  .union([z.iso.datetime({ offset: true }), z.iso.date()])
  .transform((value) => new Date(value));
