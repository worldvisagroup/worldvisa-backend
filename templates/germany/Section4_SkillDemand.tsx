import React from 'react';
import type { GermanySkillDemandData } from '../types/report-types';
import { SectionHeader } from '../shared/SectionHeader';

interface Props {
  data: GermanySkillDemandData;
}

export function Section4_SkillDemand({ data }: Props) {
  return (
    <div className="section page">
      <SectionHeader number="4" title="Global Skill Demand Mapping" />

      {/* 4.1 Skill Mapping */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '4pt' }}>
          4.1 Mapping Your Core Skills to German Market
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8F9FB' }}>
              <th style={{ padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' }}>Your Skill</th>
              <th style={{ padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' }}>IT Market Demand</th>
              <th style={{ padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' }}>Salary Impact</th>
              <th style={{ padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' }}>Shortage Status</th>
            </tr>
          </thead>
          <tbody>
            {data.skillMapping.map((skill, index) => (
              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                <td style={{ padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#111827', fontWeight: 600 }}>{skill.skill}</td>
                <td style={{ padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '1pt 6pt',
                    backgroundColor: skill.marketDemand.toLowerCase().includes('very high') ? '#ECFDF5' : skill.marketDemand.toLowerCase().includes('high') ? '#F0FDF4' : '#FFFBEB',
                    color: skill.marketDemand.toLowerCase().includes('very high') ? '#059669' : skill.marketDemand.toLowerCase().includes('high') ? '#059669' : '#92400E',
                    fontSize: '10pt',
                    fontWeight: 600,
                    borderRadius: '3pt'
                  }}>
                    {skill.marketDemand}
                  </span>
                </td>
                <td style={{ padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#4B5563' }}>{skill.salaryImpact}</td>
                <td style={{ padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#4B5563' }}>{skill.shortageStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4.2 Tech Shortage */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '4pt' }}>
          4.2 Germany&apos;s Tech Skill Shortage
        </h3>
        <p style={{ fontSize: '12pt', fontWeight: 600, color: '#111827', marginTop: 0, marginBottom: '4pt' }}>
          {data.techShortage.description}
        </p>
        <ul style={{ margin: 0, paddingLeft: '14pt', marginBottom: '6pt' }}>
          {data.techShortage.marketFacts.map((fact, index) => (
            <li key={index} style={{ fontSize: '12pt', color: '#4B5563', marginBottom: '3pt', lineHeight: 1.4 }}>{fact}</li>
          ))}
        </ul>
        <div style={{ borderLeft: '3pt solid #059669', backgroundColor: '#F0FDF4', padding: '6pt 10pt' }}>
          <p style={{ fontSize: '12pt', color: '#111827', margin: 0 }}>
            <strong>Conclusion:</strong> <span style={{ color: '#4B5563' }}>{data.techShortage.conclusion}</span>
          </p>
        </div>
      </div>

      {/* 4.3 Demand by City */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '4pt' }}>
          4.3 Demand Level by City
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8F9FB' }}>
              <th style={{ padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' }}>City</th>
              <th style={{ padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' }}>Tech Market</th>
              <th style={{ padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' }}>Job Opportunities</th>
              <th style={{ padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' }}>Salary Range</th>
              <th style={{ padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' }}>Type</th>
            </tr>
          </thead>
          <tbody>
            {data.demandByCity.map((city, index) => (
              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                <td style={{ padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#111827', fontWeight: 600 }}>{city.city}</td>
                <td style={{ padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#4B5563' }}>{city.techMarket}</td>
                <td style={{ padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#4B5563' }}>{city.jobOpportunities}</td>
                <td style={{ padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#4B5563' }}>{city.salaryRange}</td>
                <td style={{ padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#4B5563' }}>{city.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
