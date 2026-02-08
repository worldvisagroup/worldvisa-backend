import React from 'react';
import type { GermanyExecutiveSummaryData } from '../types/report-types';
import { SectionHeader } from '../shared/SectionHeader';

interface Props {
  data: GermanyExecutiveSummaryData;
}

export function Section1_ExecutiveSummary({ data }: Props) {
  return (
    <div className="section page">
      <SectionHeader number="1" title="Executive Summary" />

      {/* 1.1 Purpose */}
      <div style={{ marginBottom: '12pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '4pt' }}>
          1.1 Purpose of This Report
        </h3>
        <p style={{ fontSize: '12pt', color: '#4B5563', lineHeight: 1.5, marginTop: 0 }}>
          {data.purpose}
        </p>
      </div>

      {/* 1.2 Key Advantages */}
      <div style={{ marginBottom: '12pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '4pt' }}>
          1.2 Snapshot of Your Global Mobility Options
        </h3>
        <p style={{ fontSize: '12pt', fontWeight: 600, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          Your Key Advantages:
        </p>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {data.globalMobility.keyAdvantages.map((advantage, index) => (
            <li key={index} style={{ fontSize: '12pt', color: '#4B5563', marginBottom: '3pt', paddingLeft: '14pt', position: 'relative' as const }}>
              <span style={{ position: 'absolute' as const, left: 0, color: '#059669', fontWeight: 700 }}>&#10003;</span>
              {advantage}
            </li>
          ))}
        </ul>
      </div>

      {/* 1.3 Top Cities Table */}
      <div style={{ marginBottom: '8pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '4pt' }}>
          1.3 Top Recommended German Cities
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8F9FB' }}>
              <th style={{ padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' }}>Rank</th>
              <th style={{ padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' }}>City</th>
              <th style={{ padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' }}>Tech Hub</th>
              <th style={{ padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' }}>Job Demand</th>
              <th style={{ padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' }}>Salary Range</th>
              <th style={{ padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' }}>Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {data.topCities.map((city, index) => (
              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                <td style={{ padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#374151', textAlign: 'center' }}>{city.rank}</td>
                <td style={{ padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#111827', fontWeight: 600 }}>{city.city}</td>
                <td style={{ padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#374151' }}>{city.techHub}</td>
                <td style={{ padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#374151' }}>{city.jobDemand}</td>
                <td style={{ padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#374151' }}>{city.salaryRange}</td>
                <td style={{ padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#4B5563' }}>{city.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
