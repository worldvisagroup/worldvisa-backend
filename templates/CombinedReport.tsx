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
  const countryConfigs = getCountriesConfig(countries);

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

  const tocSections = generateCombinedTOC(countryConfigs);

  const firstCountryData = reportData[countryConfigs[0]?.dataKey];

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>WorldVisa Multi-Country Report - {userName}</title>
        <style dangerouslySetInnerHTML={{ __html: pdfStyles }} />
      </head>
      <body>
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

        <TableOfContents
          sections={tocSections}
          countries={countryConfigs.map(c => c.name)}
        />

        <div className="page-break" />

        {countryConfigs.map((countryConfig, countryIndex) => {
          const countryData = reportData[countryConfig.dataKey];

          if (!countryData) {
            console.warn(`No data found for country: ${countryConfig.name}`);
            return null;
          }

          return (
            <React.Fragment key={countryConfig.code}>
              <CountryIntroPage
                countryName={countryConfig.name}
                flagImagePath={countryConfig.flagPath}
                usps={countryConfig.usps}
                colors={countryConfig.colors}
              />

              <div>
                {countryConfig.sections.map((section, sectionIndex) => {
                  const SectionComponent = section.component;
                  const sectionData = countryData[section.dataKey];

                  return (
                    <React.Fragment key={`${countryConfig.code}-${section.id}`}>
                      {sectionData ? (
                        <SectionComponent data={sectionData} />
                      ) : (
                        <SectionComponent />
                      )}

                      {sectionIndex < countryConfig.sections.length - 1 && (
                        <div />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {countryIndex < countryConfigs.length - 1 && (
                <div className="page-break" />
              )}
            </React.Fragment>
          );
        })}

        <div className="page-break" />

        <ThankYouPage />
      </body>
    </html>
  );
}

