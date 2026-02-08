import React from 'react';
import type { ProfessionalProfileData } from '../types/report-types';
import { SectionHeader } from './shared/SectionHeader';

interface Props {
  data: ProfessionalProfileData;
}

export function Section2_ProfessionalProfile({ data }: Props) {
  return (
    <div className="section page">
      <SectionHeader number="2" title="Your Professional Profile - Assessment Input" />

      {/* Profile Description */}
      <div style={{ marginBottom: '12pt' }}>
        <p style={{ fontSize: '12pt', color: '#4B5563', lineHeight: '1.6', margin: 0 }}>
          {data.profileDescription}
        </p>
      </div>

      {/* Basic Profile Info Table */}
      <div style={{ marginBottom: '12pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          2.1 Occupation Mapping
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
          <tbody>
            <tr>
              <td style={{ padding: '6pt 8pt', border: '1pt solid #E5E7EB', background: '#F8F9FB', fontWeight: 600, color: '#111827', width: '40%' }}>
                Primary Occupation
              </td>
              <td style={{ padding: '6pt 8pt', border: '1pt solid #E5E7EB', color: '#4B5563' }}>
                {data.primaryOccupation}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6pt 8pt', border: '1pt solid #E5E7EB', background: '#F8F9FB', fontWeight: 600, color: '#111827' }}>
                ANZSCO Code
              </td>
              <td style={{ padding: '6pt 8pt', border: '1pt solid #E5E7EB', color: '#2563EB', fontWeight: 600 }}>
                {data.anzscoCode}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6pt 8pt', border: '1pt solid #E5E7EB', background: '#F8F9FB', fontWeight: 600, color: '#111827' }}>
                Unit Group
              </td>
              <td style={{ padding: '6pt 8pt', border: '1pt solid #E5E7EB', color: '#4B5563' }}>
                {data.unitGroup}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6pt 8pt', border: '1pt solid #E5E7EB', background: '#F8F9FB', fontWeight: 600, color: '#111827' }}>
                Alternative Codes
              </td>
              <td style={{ padding: '6pt 8pt', border: '1pt solid #E5E7EB', color: '#4B5563' }}>
                {data.alternativeCodes}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6pt 8pt', border: '1pt solid #E5E7EB', background: '#F8F9FB', fontWeight: 600, color: '#111827' }}>
                Skill Level
              </td>
              <td style={{ padding: '6pt 8pt', border: '1pt solid #E5E7EB', color: '#059669', fontWeight: 600 }}>
                {data.skillLevel}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ANZSCO Details */}
      {data.anzscoDetails && data.anzscoDetails.length > 0 && (
        <div style={{ marginBottom: '12pt' }}>
          <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
            2.2 ANZSCO Occupation Options
          </h3>
          {data.anzscoDetails.map((anzsco, index) => (
            <div
              key={index}
              style={{
                borderLeft: '3pt solid #1B2A4A',
                padding: '8pt 10pt',
                marginBottom: '8pt',
                background: '#F8F9FB',
                pageBreakInside: 'avoid'
              }}
            >
              <div style={{ marginBottom: '4pt' }}>
                <span style={{ fontSize: '12pt', fontWeight: 700, color: '#2563EB', marginRight: '8pt' }}>
                  {anzsco.code}
                </span>
                <span style={{ fontSize: '12pt', fontWeight: 600, color: '#111827' }}>
                  {anzsco.title}
                </span>
              </div>
              <p style={{ fontSize: '12pt', color: '#4B5563', margin: '0 0 6pt 0', lineHeight: '1.5' }}>
                {anzsco.description}
              </p>

              <div style={{ display: 'flex', gap: '16pt' }}>
                {anzsco.keyResponsibilities && anzsco.keyResponsibilities.length > 0 && (
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '12pt', fontWeight: 600, color: '#111827', margin: '0 0 4pt 0' }}>
                      Key Responsibilities:
                    </p>
                    <ul style={{ fontSize: '12pt', color: '#4B5563', margin: 0, paddingLeft: '14pt' }}>
                      {anzsco.keyResponsibilities.map((resp, idx) => (
                        <li key={idx} style={{ marginBottom: '2pt', lineHeight: '1.4' }}>{resp}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {anzsco.skillsRequired && anzsco.skillsRequired.length > 0 && (
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '12pt', fontWeight: 600, color: '#111827', margin: '0 0 4pt 0' }}>
                      Skills Required:
                    </p>
                    <ul style={{ fontSize: '12pt', color: '#4B5563', margin: 0, paddingLeft: '14pt' }}>
                      {anzsco.skillsRequired.map((skill, idx) => (
                        <li key={idx} style={{ marginBottom: '2pt', lineHeight: '1.4' }}>{skill}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skills Assessment */}
      {data.skillsAssessment && (
        <div style={{ marginBottom: '12pt' }}>
          <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
            2.3 Skills Assessment Process
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt', marginBottom: '6pt' }}>
            <tbody>
              <tr>
                <td style={{ padding: '6pt 8pt', border: '1pt solid #E5E7EB', background: '#F8F9FB', fontWeight: 600, color: '#111827', width: '40%' }}>
                  Assessing Authority
                </td>
                <td style={{ padding: '6pt 8pt', border: '1pt solid #E5E7EB', color: '#2563EB', fontWeight: 600 }}>
                  {data.skillsAssessment.authority}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '6pt 8pt', border: '1pt solid #E5E7EB', background: '#F8F9FB', fontWeight: 600, color: '#111827' }}>
                  Process
                </td>
                <td style={{ padding: '6pt 8pt', border: '1pt solid #E5E7EB', color: '#4B5563' }}>
                  {data.skillsAssessment.process}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '6pt 8pt', border: '1pt solid #E5E7EB', background: '#F8F9FB', fontWeight: 600, color: '#111827' }}>
                  Timeline
                </td>
                <td style={{ padding: '6pt 8pt', border: '1pt solid #E5E7EB', color: '#111827', fontWeight: 600 }}>
                  {data.skillsAssessment.timeline}
                </td>
              </tr>
            </tbody>
          </table>
          <p style={{ fontSize: '12pt', fontWeight: 600, color: '#111827', margin: '0 0 4pt 0' }}>
            Requirements:
          </p>
          <ul style={{ margin: 0, paddingLeft: '16pt', listStyle: 'none' }}>
            {data.skillsAssessment.requirements.map((req, index) => (
              <li key={index} style={{ fontSize: '12pt', color: '#4B5563', marginBottom: '3pt', lineHeight: '1.5' }}>
                <span dangerouslySetInnerHTML={{ __html: '&#10003;' }} style={{ color: '#059669', marginRight: '6pt', fontWeight: 700 }} />
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Occupation Ceiling & Labour Market */}
      {(data.occupationCeiling || data.labourMarketInfo) && (
        <div style={{ marginBottom: '12pt' }}>
          <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
            2.4 Occupation Demand &amp; Availability
          </h3>

          {data.occupationCeiling && (
            <p style={{ fontSize: '12pt', color: '#4B5563', lineHeight: '1.6', margin: '0 0 6pt 0' }}>
              <strong style={{ color: '#059669' }}>Occupation Ceiling Status:</strong> {data.occupationCeiling}
            </p>
          )}

          {data.labourMarketInfo && (
            <div style={{ borderLeft: '3pt solid #1B2A4A', paddingLeft: '10pt', background: '#F8F9FB', padding: '8pt 10pt' }}>
              <p style={{ margin: 0, fontSize: '12pt', color: '#4B5563', lineHeight: '1.6' }}>
                <strong style={{ color: '#111827' }}>Labour Market Insight:</strong> {data.labourMarketInfo}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
