import { z } from 'zod';

export const MAX_PAGE_SIZE = 1000;
export const DEFAULT_PAGE_SIZE = 100;

export const pagingQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
};

export interface Paging {
  page: number;
  limit: number;
}

export interface Page<T> extends Paging {
  data: T[];
  total: number;
}

export const toSkip = ({ page, limit }: Paging): number => (page - 1) * limit;
