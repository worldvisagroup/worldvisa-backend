import type { CountryConfig } from './country-registry';
export interface TOCSection {
    section: string;
    title: string;
    page: string;
    country?: string;
}
export declare function generateCombinedTOC(countryConfigs: CountryConfig[], startPage?: number): TOCSection[];
/**
 * Generates TOC for a single country (backwards compatibility)
 */
export declare function generateSingleCountryTOC(countryCode: string, sections: Array<{
    id: string;
    title: string;
}>, startPage?: number): TOCSection[];
/**
 * Groups TOC sections by country for multi-country reports
 */
export declare function groupTOCByCountry(tocSections: TOCSection[]): Record<string, TOCSection[]>;
