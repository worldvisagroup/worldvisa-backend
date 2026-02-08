import React from 'react';
import type { SkillDemandData } from '../types/report-types';
import { SectionHeader } from './shared/SectionHeader';

interface Props {
  data: SkillDemandData;
}

export function Section4_SkillDemand({ data }: Props) {
  const getDemandColor = (level: string): string => {
    const lower = level.toLowerCase();
    if (lower.includes('very high')) return '#059669';
    if (lower.includes('high')) return '#2563EB';
    return '#9CA3AF';
  };

  const getDemandBg = (level: string): string => {
    const lower = level.toLowerCase();
    if (lower.includes('very high')) return '#ECFDF5';
    if (lower.includes('high')) return '#EFF6FF';
    return '#F8F9FB';
  };

  return (
    <div className="section page">
      <SectionHeader number="4" title="Global Skill Demand Mapping - Where Your Skills Are in Demand" />

      {/* Skill Mapping Table */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          4.1 Core Skills to Occupation Codes
        </h3>
        <p style={{ fontSize: '12pt', color: '#4B5563', margin: '0 0 6pt 0' }}>
          <strong style={{ color: '#2563EB' }}>Primary Occupation Code:</strong> {data.primaryOccupationCode}
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
          <thead>
            <tr>
              <th style={{ background: '#F8F9FB', padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#111827', border: '1pt solid #E5E7EB', width: '30%' }}>
                Your Skill
              </th>
              <th style={{ background: '#F8F9FB', padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#111827', border: '1pt solid #E5E7EB', width: '40%' }}>
                ANZSCO Category
              </th>
              <th style={{ background: '#F8F9FB', padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#111827', border: '1pt solid #E5E7EB', width: '30%' }}>
                Demand Level
              </th>
            </tr>
          </thead>
          <tbody>
            {data.skillMappingTable.map((row, index) => (
              <tr key={index}>
                <td style={{ padding: '5pt 8pt', border: '1pt solid #E5E7EB', color: '#111827', fontWeight: 600, verticalAlign: 'top', background: index % 2 === 0 ? '#FFFFFF' : '#F8F9FB' }}>
                  {row.skill}
                </td>
                <td style={{ padding: '5pt 8pt', border: '1pt solid #E5E7EB', color: '#4B5563', verticalAlign: 'top', background: index % 2 === 0 ? '#FFFFFF' : '#F8F9FB' }}>
                  {row.anzscoCategory}
                </td>
                <td style={{ padding: '5pt 8pt', border: '1pt solid #E5E7EB', verticalAlign: 'top', background: index % 2 === 0 ? '#FFFFFF' : '#F8F9FB' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2pt 8pt',
                    fontSize: '10pt',
                    fontWeight: 600,
                    color: getDemandColor(row.demandLevel),
                    background: getDemandBg(row.demandLevel),
                    border: `1pt solid ${getDemandColor(row.demandLevel)}`,
                    borderRadius: '2pt'
                  }}>
                    {row.demandLevel}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Occupation Lists */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          4.2 Skilled Occupation Lists &amp; Your Placement
        </h3>
        {data.occupationLists.map((list, index) => (
          <div
            key={index}
            style={{
              borderLeft: '3pt solid #1B2A4A',
              padding: '6pt 10pt',
              marginBottom: '6pt',
              background: '#F8F9FB'
            }}
          >
            <p style={{ fontSize: '12pt', fontWeight: 600, color: '#111827', margin: '0 0 4pt 0' }}>
              {list.listName}
            </p>
            <ul style={{ fontSize: '12pt', color: '#4B5563', margin: 0, paddingLeft: '14pt' }}>
              {list.occupations.map((occ, occIndex) => (
                <li key={occIndex} style={{ marginBottom: '2pt', lineHeight: '1.4' }}>
                  <strong>{occ}</strong>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* State Priority Lists */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          4.3 State-Specific Priority Occupation Lists
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
          <thead>
            <tr>
              <th style={{ background: '#F8F9FB', padding: '5pt 8pt', textAlign: 'left', fontWeight: 600, color: '#111827', border: '1pt solid #E5E7EB', width: '30%' }}>
                State
              </th>
              <th style={{ background: '#F8F9FB', padding: '5pt 8pt', textAlign: 'left', fontWeight: 600, color: '#111827', border: '1pt solid #E5E7EB' }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {data.statePriorityLists.map((state, stateIndex) => (
              <tr key={stateIndex}>
                <td style={{ padding: '5pt 8pt', border: '1pt solid #E5E7EB', color: '#111827', fontWeight: 600, background: stateIndex % 2 === 0 ? '#FFFFFF' : '#F8F9FB' }}>
                  {state.state}
                </td>
                <td style={{ padding: '5pt 8pt', border: '1pt solid #E5E7EB', color: '#4B5563', background: stateIndex % 2 === 0 ? '#FFFFFF' : '#F8F9FB' }}>
                  {state.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Availability Note */}
      <div style={{ borderLeft: '3pt solid #1B2A4A', padding: '6pt 10pt', background: '#F8F9FB' }}>
        <p style={{ margin: 0, fontSize: '12pt', color: '#4B5563', lineHeight: '1.5' }}>
          <strong style={{ color: '#111827' }}>Availability:</strong> {data.availabilityNote}
        </p>
      </div>
    </div>
  );
}
