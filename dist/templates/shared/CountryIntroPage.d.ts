import React from 'react';
interface CountryIntroPageProps {
    countryName: string;
    flagImagePath: string;
    usps: string[];
    colors: {
        primary: string;
        gradient: string;
    };
}
export declare function CountryIntroPage({ countryName, flagImagePath, usps, colors }: CountryIntroPageProps): React.JSX.Element;
export {};
