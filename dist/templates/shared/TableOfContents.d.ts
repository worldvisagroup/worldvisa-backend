import React from 'react';
interface TOCSection {
    section: string;
    title: string;
    page: string;
    country?: string;
}
interface TableOfContentsProps {
    sections?: TOCSection[];
    countries?: string[];
}
export declare function TableOfContents({ sections, countries }: TableOfContentsProps): React.JSX.Element;
export {};
