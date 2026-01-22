import React from 'react';
import type { CoverPageData, ReportMeta } from '../types/report-types';
interface CoverPageProps {
    data: CoverPageData;
    meta: ReportMeta;
    countries?: string[];
}
export declare function CoverPage({ data, meta, countries }: CoverPageProps): React.JSX.Element;
export {};
