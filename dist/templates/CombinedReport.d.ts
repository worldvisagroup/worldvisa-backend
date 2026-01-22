import React from 'react';
interface CombinedReportProps {
    countries: string[];
    reportData: Record<string, any>;
    userName: string;
}
export declare function CombinedReport({ countries, reportData, userName }: CombinedReportProps): React.JSX.Element;
export {};
