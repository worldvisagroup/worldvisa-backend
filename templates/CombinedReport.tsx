import React from 'react';
import { pdfStyles } from './shared/styles';
import { CoverPage } from './shared/CoverPage';
import { TableOfContents } from './shared/TableOfContents';
import { CountryIntroPage } from './shared/CountryIntroPage';
import { ThankYouPage } from './shared/ThankYouPage';
import { getCountriesConfig } from './utils/country-registry';
import { generateCombinedTOC } from './utils/toc-generator';

interface CombinedReportProps {
  countries: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reportData: Record<string, any>;
  userName: string;
}


export function CombinedReport({ countries, reportData, userName }: CombinedReportProps) {
  // Get configurations for selected countries
  const countryConfigs = getCountriesConfig(countries);

  // Validate we have valid countries
  if (countryConfigs.length === 0) {
    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <title>Error - No Valid Countries</title>
        </head>
        <body>
          <div style={{ padding: '40pt', textAlign: 'center' }}>
            <h1>Error: No valid countries selected</h1>
            <p>Selected: {countries.join(', ')}</p>
          </div>
        </body>
      </html>
    );
  }

  // Generate dynamic TOC
  const tocSections = generateCombinedTOC(countryConfigs);

  // Get first country's data for cover/thank you (or use first available)
  const firstCountryData = reportData[countryConfigs[0]?.dataKey];

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>WorldVisa Multi-Country Report - {userName}</title>
        <style dangerouslySetInnerHTML={{ __html: pdfStyles }} />
      </head>
      <body>
        {/* COVER PAGE - Shared */}
        <CoverPage
          data={firstCountryData?.coverPage || { title: 'Global Immigration Report', subtitle: 'Multi-Country Assessment' }}
          meta={{
            userName,
            generatedDate: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            reportVersion: '2.0',
            country: countryConfigs.map(c => c.name).join(' & ')
          }}
          countries={countryConfigs.map(c => c.name)}
        />

        {/* TABLE OF CONTENTS - Dynamic */}
        <TableOfContents
          sections={tocSections}
          countries={countryConfigs.map(c => c.name)}
        />

        <div className="page-break" />

        {/* DYNAMIC COUNTRY SECTIONS - Loop through each selected country */}
        {countryConfigs.map((countryConfig, countryIndex) => {
          const countryData = reportData[countryConfig.dataKey];

          if (!countryData) {
            // Skip if no data for this country
            console.warn(`No data found for country: ${countryConfig.name}`);
            return null;
          }

          return (
            <React.Fragment key={countryConfig.code}>
              {/* Country Intro Page */}
              <CountryIntroPage
                countryName={countryConfig.name}
                flagImagePath={countryConfig.flagPath}
                usps={countryConfig.usps}
                colors={countryConfig.colors}
              />
              <div className="page-break" />

              {/* Render all sections for this country */}
              <div>
                {countryConfig.sections.map((section, sectionIndex) => {
                  const SectionComponent = section.component;
                  const sectionData = countryData[section.dataKey];

                  // Render component with data if available (dynamic sections),
                  // or without data prop if static (static sections like AboutWorldVisa, Timeline)
                  return (
                    <React.Fragment key={`${countryConfig.code}-${section.id}`}>
                      {sectionData ? (
                        <SectionComponent data={sectionData} />
                      ) : (
                        <SectionComponent />
                      )}

                      {/* Add spacing between sections (not page breaks within country) */}
                      {sectionIndex < countryConfig.sections.length - 1 && (
                        <div />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Page break after country (except last country) */}
              {countryIndex < countryConfigs.length - 1 && (
                <div className="page-break" />
              )}
            </React.Fragment>
          );
        })}

        <div className="page-break" />

        {/* THANK YOU PAGE - Shared */}
        <ThankYouPage />
      </body>
    </html>
  );
}

