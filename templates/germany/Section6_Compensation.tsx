import React from 'react';
import type { GermanyCompensationData } from '../types/report-types';
import { SectionHeader } from '../shared/SectionHeader';

interface Props {
  data: GermanyCompensationData;
}

export function Section6_Compensation({ data }: Props) {
  const thStyle: React.CSSProperties = {
    padding: '5pt 6pt',
    textAlign: 'left',
    fontWeight: 700,
    fontSize: '10pt',
    color: '#FFFFFF',
    background: '#1B2A4A',
    border: '0.5pt solid #E5E7EB',
  };

  const tdStyle: React.CSSProperties = {
    padding: '5pt 6pt',
    fontSize: '12pt',
    color: '#4B5563',
    border: '0.5pt solid #E5E7EB',
  };

  return (
    <div className="section page">
      <SectionHeader number="6" title="Compensation Benchmarking" />

      {/* Salary Ranges by City & Role Level */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          Salary Ranges by City & Role Level
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '0.5pt solid #E5E7EB' }}>
          <thead>
            <tr>
              <th style={thStyle}>Level</th>
              <th style={thStyle}>Location</th>
              <th style={thStyle}>EUR (Annual)</th>
              <th style={thStyle}>INR Equivalent</th>
            </tr>
          </thead>
          <tbody>
            {data.salaryRanges.map((salary, index) => (
              <tr key={index} style={{ background: index % 2 === 0 ? '#F8F9FB' : '#FFFFFF' }}>
                <td style={tdStyle}>{salary.level}</td>
                <td style={tdStyle}>{salary.location}</td>
                <td style={tdStyle}>{salary.eurAnnual}</td>
                <td style={tdStyle}>{salary.inrEquivalent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* City-wise Salary Comparison */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          City-wise Salary Comparison
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '0.5pt solid #E5E7EB' }}>
          <thead>
            <tr>
              <th style={thStyle}>Factor</th>
              <th style={thStyle}>Berlin</th>
              <th style={thStyle}>Munich</th>
              <th style={thStyle}>Frankfurt</th>
              <th style={thStyle}>Winner</th>
            </tr>
          </thead>
          <tbody>
            {data.cityComparison.map((comparison, index) => (
              <tr key={index} style={{ background: index % 2 === 0 ? '#F8F9FB' : '#FFFFFF' }}>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#111827' }}>{comparison.factor}</td>
                <td style={tdStyle}>{comparison.berlin}</td>
                <td style={tdStyle}>{comparison.munich}</td>
                <td style={tdStyle}>{comparison.frankfurt}</td>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#059669' }}>{comparison.winner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
