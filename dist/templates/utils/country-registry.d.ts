import React from "react";
export interface CountryConfig {
    code: string;
    name: string;
    flagPath: string;
    colors: {
        primary: string;
        gradient: string;
    };
    usps: string[];
    sections: Array<{
        id: string;
        title: string;
        component: React.ComponentType<any>;
        dataKey: string;
    }>;
    dataKey: string;
}
export declare const COUNTRY_REGISTRY: Record<string, CountryConfig>;
export declare function getCountryConfig(countryCode: string): CountryConfig | undefined;
export declare function getCountriesConfig(countryCodes: string[]): CountryConfig[];
export declare function getAllCountryCodes(): string[];
export declare function getCountryByName(name: string): CountryConfig | undefined;
