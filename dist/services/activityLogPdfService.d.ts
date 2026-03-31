import type { ActivityLogEntry, ActivityLogPdfParams, DayGroup } from '../types/visaApplication.types';
export declare function fetchLogoAsBase64(): Promise<string | null>;
export declare function groupByDay(logs: ActivityLogEntry[]): DayGroup[];
export declare function buildActivityLogHtml(params: ActivityLogPdfParams): string;
export declare function generateActivityLogPdf(html: string): Promise<Buffer>;
