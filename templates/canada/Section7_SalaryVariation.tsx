import React from 'react';
import type { CanadaSalaryVariationData } from '../types/report-types';
import { SectionHeader } from '../shared/SectionHeader';

interface Props {
  data: CanadaSalaryVariationData;
}

const thStyle: React.CSSProperties = {
  padding: '5pt 6pt',
  textAlign: 'left',
  fontWeight: 700,
  fontSize: '10pt',
  color: '#FFFFFF',
  background: '#1B2A4A',
  borderBottom: '1pt solid #E5E7EB',
};

const tdStyle: React.CSSProperties = {
  padding: '4pt 6pt',
  color: '#4B5563',
  borderBottom: '0.5pt solid #E5E7EB',
  lineHeight: '1.4',
};

export function Section7_SalaryVariation({ data }: Props) {
  return (
    <div className="section page">
      <SectionHeader number="7" title="City-wise Salary Variation (Toronto vs Vancouver vs Montreal)" />

      {/* Salary Comparison Table */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          Salary Comparison
        </h3>

        {data.cities.map((city, index) => (
          <div key={index} style={{ marginBottom: '8pt' }}>
            {data.cities.length > 1 && (
              <div style={{ fontSize: '12pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '3pt' }}>
                {city.city}
              </div>
            )}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Factor</th>
                  <th style={thStyle}>Toronto</th>
                  <th style={thStyle}>Vancouver</th>
                  <th style={thStyle}>Montreal</th>
                  <th style={thStyle}>Winner for You</th>
                </tr>
              </thead>
              <tbody>
                {city.factors.map((factor, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#F8F9FB' }}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#111827' }}>
                      {factor.factor}
                    </td>
                    <td style={tdStyle}>{factor.toronto}</td>
                    <td style={tdStyle}>{factor.vancouver}</td>
                    <td style={tdStyle}>{factor.montreal}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#059669' }}>
                      {factor.winner}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Recommendation Summary */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          Recommendation Summary
        </h3>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
          <thead>
            <tr>
              <th style={thStyle}>Priority</th>
              <th style={thStyle}>Toronto (Ontario)</th>
              <th style={thStyle}>Vancouver (BC)</th>
              <th style={thStyle}>Montreal (Quebec)</th>
            </tr>
          </thead>
          <tbody>
            {data.recommendation.priorities.map((priority, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#F8F9FB' }}>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#111827' }}>
                  {priority.priority}
                </td>
                <td style={tdStyle}>{priority.toronto}</td>
                <td style={tdStyle}>{priority.vancouver}</td>
                <td style={tdStyle}>{priority.montreal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
