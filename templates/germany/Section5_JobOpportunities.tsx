import React from 'react';
import type { GermanyJobOpportunitiesData } from '../types/report-types';
import { SectionHeader } from '../shared/SectionHeader';

interface Props {
  data: GermanyJobOpportunitiesData;
}

export function Section5_JobOpportunities({ data }: Props) {
  const cityEntries = Object.entries(data.cities);
  const totalCities = cityEntries.length;

  return (
    <div className="section page">
      <SectionHeader number="5" title="Job Opportunities by Role & City" />

      {cityEntries.map(([cityKey, city], cityIndex) => {
        const sectionNumber = cityIndex + 1;

        return (
          <div key={cityKey} style={{ marginBottom: '20pt', pageBreakInside: 'avoid' }}>
            <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
              5.{sectionNumber} {city.name}
            </h3>

            {/* Job Titles */}
            <div style={{ marginBottom: '6pt' }}>
              <div style={{ fontSize: '12pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '3pt' }}>
                Typical Job Titles
              </div>
              <ul style={{ margin: 0, paddingLeft: '14pt' }}>
                {city.jobTitles.map((title, index) => (
                  <li key={index} style={{ fontSize: '12pt', color: '#4B5563', marginBottom: '2pt', lineHeight: '1.4' }}>
                    {title}
                  </li>
                ))}
              </ul>
            </div>

            {/* Specialized Roles */}
            {city.specializedRoles && city.specializedRoles.length > 0 && (
              <div style={{ marginBottom: '6pt' }}>
                <div style={{ fontSize: '12pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '3pt' }}>
                  Specialized Roles
                </div>
                <ul style={{ margin: 0, paddingLeft: '14pt' }}>
                  {city.specializedRoles.map((role, index) => (
                    <li key={index} style={{ fontSize: '12pt', color: '#4B5563', marginBottom: '2pt', lineHeight: '1.4' }}>
                      {role}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Target Companies */}
            <div style={{ marginBottom: '6pt' }}>
              <div style={{ fontSize: '12pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '3pt' }}>
                Target Companies
              </div>
              <ul style={{ margin: 0, paddingLeft: '14pt' }}>
                {city.targetCompanies.map((company, index) => (
                  <li key={index} style={{ fontSize: '12pt', color: '#4B5563', marginBottom: '2pt', lineHeight: '1.4' }}>
                    {company}
                  </li>
                ))}
              </ul>
            </div>

            {/* Advantage callout */}
            {city.advantage && (
              <div style={{
                borderLeft: '3pt solid #1B2A4A',
                padding: '6pt 10pt',
                background: '#F8F9FB',
                marginBottom: '4pt',
              }}>
                <p style={{ fontSize: '12pt', color: '#4B5563', margin: 0, lineHeight: '1.4' }}>
                  <strong style={{ color: '#111827' }}>Advantage:</strong> {city.advantage}
                </p>
              </div>
            )}
          </div>
        );
      })}

      {/* Key Industries Table */}
      <div style={{ marginTop: '8pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          5.{totalCities + 1} Key Industries Hiring for Your Skill Set
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
          <thead>
            <tr style={{ background: '#F8F9FB' }}>
              <th style={{ padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' }}>Industry</th>
              <th style={{ padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' }}>Demand</th>
              <th style={{ padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' }}>Growth</th>
              <th style={{ padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' }}>Example Companies</th>
              <th style={{ padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' }}>Your Fit</th>
            </tr>
          </thead>
          <tbody>
            {data.keyIndustries.map((industry, index) => (
              <tr key={index} style={{ background: index % 2 === 0 ? '#FFFFFF' : '#F8F9FB' }}>
                <td style={{ padding: '5pt 8pt', fontWeight: 600, color: '#111827', borderBottom: '0.5pt solid #E5E7EB', verticalAlign: 'top' }}>
                  {industry.industry}
                </td>
                <td style={{ padding: '5pt 8pt', color: '#4B5563', borderBottom: '0.5pt solid #E5E7EB', verticalAlign: 'top' }}>
                  {industry.demand}
                </td>
                <td style={{ padding: '5pt 8pt', color: '#4B5563', borderBottom: '0.5pt solid #E5E7EB', verticalAlign: 'top' }}>
                  {industry.growth}
                </td>
                <td style={{ padding: '5pt 8pt', color: '#4B5563', borderBottom: '0.5pt solid #E5E7EB', verticalAlign: 'top' }}>
                  {industry.exampleCompanies}
                </td>
                <td style={{ padding: '5pt 8pt', color: '#4B5563', borderBottom: '0.5pt solid #E5E7EB', verticalAlign: 'top' }}>
                  {industry.yourFit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
