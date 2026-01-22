import React from 'react';
import type { SkillDemandData } from '../types/report-types';
import { SectionHeader } from './shared/SectionHeader';
import { Table } from './shared/Table';

interface Props {
  data: SkillDemandData;
}

export function Section4_SkillDemand({ data }: Props) {
  const getDemandClass = (level: string): string => {
    if (level.toLowerCase().includes('very high')) return 'demand-very-high';
    if (level.toLowerCase().includes('high')) return 'demand-high';
    return 'demand-medium';
  };

  return (
    <div className="section page">
      <SectionHeader number="4" title="Global Skill Demand Mapping – Where Your Skills Are in Demand" />

      <div className="subsection">
        <h3>4.1 Mapping Your Core Skills to Global Occupation Codes</h3>
        <div style={{
          background: '#EBF5FF',
          border: '1pt solid #BFDBFE',
          borderRadius: '6pt',
          padding: '12pt',
          marginBottom: '16pt'
        }}>
          <p style={{ marginBottom: '0', fontSize: '11pt' }}>
            <strong style={{ color: '#0066CC' }}>Your Primary Occupation Code:</strong>{' '}
            <span style={{ color: '#1F2937' }}>{data.primaryOccupationCode}</span>
          </p>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
          <thead>
            <tr>
              <th style={{
                background: 'linear-gradient(135deg, #EBF5FF 0%, #DBEAFE 100%)',
                padding: '12pt',
                textAlign: 'left',
                fontWeight: '600',
                color: '#1F2937',
                border: '1pt solid #E5E7EB',
                width: '30%'
              }}>
                Your Skill
              </th>
              <th style={{
                background: 'linear-gradient(135deg, #EBF5FF 0%, #DBEAFE 100%)',
                padding: '12pt',
                textAlign: 'left',
                fontWeight: '600',
                color: '#1F2937',
                border: '1pt solid #E5E7EB',
                width: '40%'
              }}>
                ANZSCO Category
              </th>
              <th style={{
                background: 'linear-gradient(135deg, #EBF5FF 0%, #DBEAFE 100%)',
                padding: '12pt',
                textAlign: 'left',
                fontWeight: '600',
                color: '#1F2937',
                border: '1pt solid #E5E7EB',
                width: '30%'
              }}>
                Demand Level (Australia)
              </th>
            </tr>
          </thead>
          <tbody>
            {data.skillMappingTable.map((row, index) => (
              <tr key={index}>
                <td style={{
                  padding: '10pt 12pt',
                  border: '1pt solid #E5E7EB',
                  background: index % 2 === 0 ? '#F9FAFB' : '#FFFFFF',
                  verticalAlign: 'top'
                }}>
                  <strong style={{ color: '#1F2937' }}>{row.skill}</strong>
                </td>
                <td style={{
                  padding: '10pt 12pt',
                  border: '1pt solid #E5E7EB',
                  background: index % 2 === 0 ? '#F9FAFB' : '#FFFFFF',
                  verticalAlign: 'top',
                  color: '#4B5563'
                }}>
                  {row.anzscoCategory}
                </td>
                <td style={{
                  padding: '10pt 12pt',
                  border: '1pt solid #E5E7EB',
                  background: index % 2 === 0 ? '#F9FAFB' : '#FFFFFF',
                  verticalAlign: 'top'
                }}>
                  <span className={`demand-indicator ${getDemandClass(row.demandLevel)}`}>
                    {row.demandLevel}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="subsection">
        <h3>4.2 Australia&apos;s Skilled Occupation Lists & Your Placement</h3>

        <div style={{
          background: '#D1FAE5',
          border: '1pt solid #10B981',
          borderRadius: '8pt',
          padding: '14pt',
          marginBottom: '20pt'
        }}>
          <p style={{ marginBottom: '0', fontSize: '11pt', lineHeight: '1.6' }}>
            <strong style={{ color: '#065F46' }}>✓ Good News:</strong>{' '}
            <span style={{ color: '#047857' }}>Your occupation is on multiple Australian skilled migration lists, ensuring consistent visa processing opportunities.</span>
          </p>
        </div>

        {data.occupationLists.map((list, index) => (
          <div
            key={index}
            style={{
              background: '#F9FAFB',
              border: '1pt solid #E5E7EB',
              borderLeft: '4pt solid #0066CC',
              borderRadius: '6pt',
              padding: '14pt',
              marginBottom: '14pt'
            }}
          >
            <p style={{ fontSize: '12pt', fontWeight: '600', color: '#1F2937', marginBottom: '10pt' }}>
              {list.listName}
            </p>
            <ul style={{
              fontSize: '10pt',
              color: '#4B5563',
              marginLeft: '20pt',
              marginBottom: '0'
            }}>
              {list.occupations.map((occ, occIndex) => (
                <li key={occIndex} style={{ marginBottom: '6pt' }}>
                  <strong>{occ}</strong>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <h4 style={{ fontSize: '12pt', marginTop: '20pt', marginBottom: '12pt' }}>
          State-Specific Priority Occupation Lists
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '10pt' }}>
          {data.statePriorityLists.map((state, stateIndex) => (
            <div
              key={stateIndex}
              style={{
                background: '#FFFFFF',
                border: '1pt solid #E5E7EB',
                borderRadius: '6pt',
                padding: '12pt',
                display: 'flex',
                alignItems: 'center',
                gap: '10pt'
              }}
            >
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24pt',
                height: '24pt',
                background: '#10B981',
                color: '#FFFFFF',
                borderRadius: '50%',
                fontSize: '12pt',
                fontWeight: '700',
                flexShrink: 0
              }}>
                ✓
              </span>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '11pt', color: '#1F2937' }}>{state.state}:</strong>{' '}
                <span style={{ fontSize: '10pt', color: '#4B5563' }}>{state.status}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '16pt',
          background: '#FFFBEB',
          border: '1pt solid #FCD34D',
          borderRadius: '6pt',
          padding: '12pt'
        }}>
          <p style={{ marginBottom: '0', fontSize: '10pt', color: '#78350F' }}>
            <strong>Availability:</strong> {data.availabilityNote}
          </p>
        </div>
      </div>
    </div>
  );
}

