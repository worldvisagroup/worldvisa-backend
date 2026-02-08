import React from 'react';
import type { SalaryVariationData } from '../types/report-types';
import { SectionHeader } from './shared/SectionHeader';

interface Props {
  data: SalaryVariationData;
}

export function Section6_SalaryVariation({ data }: Props) {
  return (
    <div className="section page">
      <SectionHeader number="6" title="City-wise Salary Variation (Capitals vs Tier-2)" />

      <p style={{ fontSize: '12pt', color: '#4B5563', marginBottom: '12pt', lineHeight: '1.5' }}>
        {data.roleName
          ? `Salary variation for ${data.roleName} across Australian cities, including take-home estimates and living costs.`
          : 'Salary ranges across Australian cities, including take-home estimates and living costs.'}
      </p>

      {data.cities.map((city, index) => (
        <div
          key={index}
          style={{
            borderLeft: '3pt solid #1B2A4A',
            padding: '8pt 10pt',
            marginBottom: '12pt',
            background: '#FFFFFF',
            border: '0.5pt solid #E5E7EB',
            borderLeftWidth: '3pt',
            borderLeftColor: '#1B2A4A',
            borderRadius: '3pt',
            pageBreakInside: 'avoid'
          }}
        >
          {/* City Header */}
          <div style={{ marginBottom: '6pt', paddingBottom: '4pt', borderBottom: '0.5pt solid #E5E7EB' }}>
            <span style={{ fontSize: '12pt', fontWeight: 700, color: '#111827' }}>{city.cityName}</span>
            {(city.techHub || city.nicheOpportunity) && (
              <span style={{ fontSize: '10pt', color: '#6B7280', marginLeft: '8pt' }}>
                {city.techHub || city.nicheOpportunity}
              </span>
            )}
          </div>

          {/* Salary Info - 2 column */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8pt', marginBottom: '6pt', padding: '6pt 8pt', background: '#FAFAFA', borderRadius: '3pt' }}>
            <div>
              <div style={{ fontSize: '10pt', fontWeight: 600, color: '#6B7280', marginBottom: '2pt' }}>
                {city.midLevelRoleName || 'Mid-level'}
              </div>
              <div style={{ fontSize: '12pt', fontWeight: 700, color: '#1B2A4A' }}>
                {city.midLevelRange}
              </div>
              {city.premium && (
                <span style={{ fontSize: '10pt', fontWeight: 600, color: '#1E40AF', background: '#EFF6FF', border: '0.5pt solid #BFDBFE', padding: '1pt 4pt', borderRadius: '2pt', display: 'inline-block', marginTop: '2pt' }}>
                  {city.premium}
                </span>
              )}
            </div>
            <div>
              <div style={{ fontSize: '10pt', fontWeight: 600, color: '#6B7280', marginBottom: '2pt' }}>
                {city.seniorLevelRoleName || 'Senior'}
              </div>
              <div style={{ fontSize: '12pt', fontWeight: 700, color: '#1B2A4A' }}>
                {city.seniorLevelRange}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4pt 12pt', marginBottom: '4pt' }}>
            {[
              { label: 'Tax Rate', value: city.taxRate || 'N/A' },
              { label: 'Take-home', value: city.takeHomeSalary || 'N/A', accent: true },
              { label: 'Housing Cost', value: city.housingCost || 'N/A' },
              { label: 'Cost of Living', value: city.costOfLiving },
              ...(city.qualityOfLife ? [{ label: 'Quality of Life', value: city.qualityOfLife }] : []),
            ].map((item, i) => (
              <div key={i} style={{ fontSize: '12pt' }}>
                <span style={{ color: '#6B7280' }}>{item.label}: </span>
                <span style={{ fontWeight: 600, color: 'accent' in item && item.accent ? '#1B2A4A' : '#1F2937' }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Notes */}
          {(city.additionalNotes || city.yourAdvantage) && (
            <div style={{ marginTop: '4pt', padding: '4pt 8pt', background: '#F0F4F8', borderLeft: '2pt solid #1B2A4A', borderRadius: '0 3pt 3pt 0' }}>
              <p style={{ fontSize: '12pt', color: '#374151', margin: 0, lineHeight: '1.4' }}>
                {city.additionalNotes || city.yourAdvantage}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
