import React from 'react';
import type { CanadaProfessionalProfileData } from '../types/report-types';
import { SectionHeader } from '../shared/SectionHeader';

interface Props {
  data: CanadaProfessionalProfileData;
}

export function Section2_ProfessionalProfile({ data }: Props) {
  return (
    <div className="section page">
      <SectionHeader number="2" title="Your Professional Profile" />

      {/* 2.1 NOC Codes */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          2.1 Core Skills &amp; Occupation Mapping (to NOC)
        </h3>
        <p style={{ fontSize: '12pt', color: '#4B5563', lineHeight: 1.5, margin: '0 0 6pt 0' }}>
          Your profile maps to the following Canadian NOC codes:
        </p>

        {data.nocCodes.map((noc: any, index: number) => (
          <div
            key={index}
            style={{
              borderLeft: '3pt solid #1B2A4A',
              padding: '6pt 10pt',
              marginBottom: '8pt',
              backgroundColor: '#F8F9FB',
            }}
          >
            <div style={{ fontSize: '12pt', fontWeight: 700, color: '#1B2A4A', marginBottom: '3pt' }}>
              {noc.type}: {noc.code} – {noc.title}
            </div>
            <p style={{ fontSize: '12pt', color: '#4B5563', lineHeight: 1.5, margin: '0 0 4pt 0' }}>
              <span style={{ fontWeight: 600, color: '#111827' }}>Definition:</span> {noc.definition}
            </p>

            {noc.alignment.length > 0 && (
              <div style={{ marginBottom: '4pt' }}>
                <span style={{ fontSize: '12pt', fontWeight: 600, color: '#111827' }}>Your Alignment:</span>
                <ul style={{ margin: '2pt 0 0 0', paddingLeft: '14pt', fontSize: '12pt', color: '#4B5563', lineHeight: 1.5 }}>
                  {noc.alignment.map((item: any, idx: number) => (
                    <li key={idx} style={{ marginBottom: '1pt' }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {noc.credentialMatch.length > 0 && (
              <div>
                <span style={{ fontSize: '12pt', fontWeight: 600, color: '#111827' }}>Credential Match:</span>
                <ul style={{ margin: '2pt 0 0 0', paddingLeft: '14pt', fontSize: '12pt', color: '#4B5563', lineHeight: 1.5 }}>
                  {noc.credentialMatch.map((item: any, idx: number) => (
                    <li key={idx} style={{ marginBottom: '1pt' }}>
                      <span dangerouslySetInnerHTML={{ __html: '&#10003;' }} /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 2.2 Experience Metrics */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          2.2 Years of Experience &amp; Seniority Level
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '5pt 6pt', backgroundColor: '#1B2A4A', color: '#FFFFFF', fontWeight: 600, fontSize: '10pt' }}>Metric</th>
              <th style={{ textAlign: 'left', padding: '5pt 6pt', backgroundColor: '#1B2A4A', color: '#FFFFFF', fontWeight: 600, fontSize: '10pt' }}>Value</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Total Years', value: data.experienceMetrics.totalYears },
              { label: 'Current Role', value: data.experienceMetrics.currentRole },
              { label: 'Seniority Level', value: data.experienceMetrics.seniorityLevel },
              { label: 'Age', value: data.experienceMetrics.age },
              { label: 'Age Advantage (CRS)', value: data.experienceMetrics.ageAdvantage },
            ].map((row: any, i: number) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#F8F9FB' : '#FFFFFF' }}>
                <td style={{ padding: '4pt 6pt', fontWeight: 600, color: '#111827', borderBottom: '1pt solid #E5E7EB' }}>{row.label}</td>
                <td style={{ padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' }}>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ borderLeft: '3pt solid #1B2A4A', padding: '6pt 10pt', marginTop: '8pt', backgroundColor: '#F8F9FB' }}>
          <p style={{ fontSize: '12pt', margin: 0 }}>
            <span style={{ fontWeight: 600, color: '#111827' }}>CRS Scoring Advantage:</span>{' '}
            <span style={{ color: '#4B5563' }}>{data.experienceMetrics.crsAdvantage}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
