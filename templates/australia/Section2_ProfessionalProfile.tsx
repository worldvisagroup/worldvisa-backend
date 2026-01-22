import React from 'react';
import type { ProfessionalProfileData } from '../types/report-types';
import { SectionHeader } from './shared/SectionHeader';

interface Props {
  data: ProfessionalProfileData;
}

export function Section2_ProfessionalProfile({ data }: Props) {
  return (
    <div className="section professional-profile page">
      <SectionHeader number="2" title="Your Professional Profile – Assessment Input" />

      {/* Core Skills & Occupation Mapping */}
      <div className="subsection">
        <h3>2.1 Core Skills & Occupation Mapping</h3>
        <p>{data.profileDescription}</p>

        <div style={{
          background: '#F9FAFB',
          border: '1pt solid #E5E7EB',
          borderRadius: '8pt',
          padding: '16pt',
          marginTop: '16pt'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12pt' }}>
            <div>
              <p style={{ fontSize: '10pt', color: '#6B7280', marginBottom: '4pt', fontWeight: '600' }}>
                Primary ANZSCO Code
              </p>
              <p style={{ fontSize: '13pt', fontWeight: '700', color: '#0066CC', marginBottom: '0' }}>
                {data.anzscoCode}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '10pt', color: '#6B7280', marginBottom: '4pt', fontWeight: '600' }}>
                Skill Level
              </p>
              <p style={{ fontSize: '13pt', fontWeight: '700', color: '#0066CC', marginBottom: '0' }}>
                {data.skillLevel}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ANZSCO Codes Detailed Breakdown */}
      {data.anzscoDetails && data.anzscoDetails.length > 0 && (
        <div className="subsection">
          <h3>2.2 ANZSCO Occupation Options for Your Profile</h3>
          <p style={{ marginBottom: '16pt', fontSize: '10pt', color: '#6B7280' }}>
            Your skills and experience qualify you for multiple ANZSCO occupation codes.
            Each code has specific requirements and opportunities:
          </p>

          {data.anzscoDetails.map((anzsco, index) => (
            <div
              key={index}
              style={{
                background: '#FFFFFF',
                border: '1pt solid #E5E7EB',
                borderLeft: '4pt solid #0066CC',
                borderRadius: '6pt',
                padding: '16pt',
                marginBottom: '16pt',
                pageBreakInside: 'avoid'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12pt' }}>
                <span style={{
                  background: '#0066CC',
                  color: '#FFFFFF',
                  padding: '4pt 12pt',
                  borderRadius: '4pt',
                  fontSize: '11pt',
                  fontWeight: '700',
                  marginRight: '12pt'
                }}>
                  {anzsco.code}
                </span>
                <strong style={{ fontSize: '14pt', color: '#1F2937' }}>
                  {anzsco.title}
                </strong>
              </div>

              <p style={{ fontSize: '10pt', color: '#4B5563', marginBottom: '12pt', lineHeight: '1.6' }}>
                {anzsco.description}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16pt' }}>
                {anzsco.keyResponsibilities && anzsco.keyResponsibilities.length > 0 && (
                  <div>
                    <p style={{ fontSize: '10pt', fontWeight: '600', color: '#1F2937', marginBottom: '8pt' }}>
                      Key Responsibilities:
                    </p>
                    <ul style={{ fontSize: '9pt', color: '#4B5563', marginLeft: '16pt', marginBottom: '0' }}>
                      {anzsco.keyResponsibilities.map((resp, idx) => (
                        <li key={idx} style={{ marginBottom: '4pt' }}>{resp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {anzsco.skillsRequired && anzsco.skillsRequired.length > 0 && (
                  <div>
                    <p style={{ fontSize: '10pt', fontWeight: '600', color: '#1F2937', marginBottom: '8pt' }}>
                      Skills Required:
                    </p>
                    <ul style={{ fontSize: '9pt', color: '#4B5563', marginLeft: '16pt', marginBottom: '0' }}>
                      {anzsco.skillsRequired.map((skill, idx) => (
                        <li key={idx} style={{ marginBottom: '4pt' }}>{skill}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skills Assessment Requirements */}
      {data.skillsAssessment && (
        <div className="subsection">
          <h3>2.3 Skills Assessment Process</h3>
          <div style={{
            background: '#EBF5FF',
            border: '1pt solid #BFDBFE',
            borderRadius: '8pt',
            padding: '16pt'
          }}>
            <div style={{ marginBottom: '16pt' }}>
              <p style={{ fontSize: '11pt', fontWeight: '600', color: '#1F2937', marginBottom: '4pt' }}>
                Assessing Authority:
              </p>
              <p style={{ fontSize: '13pt', fontWeight: '700', color: '#0066CC', marginBottom: '0' }}>
                {data.skillsAssessment.authority}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12pt', marginBottom: '16pt' }}>
              <div>
                <p style={{ fontSize: '10pt', color: '#6B7280', marginBottom: '4pt' }}>
                  Process:
                </p>
                <p style={{ fontSize: '11pt', color: '#1F2937', marginBottom: '0' }}>
                  {data.skillsAssessment.process}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '10pt', color: '#6B7280', marginBottom: '4pt' }}>
                  Timeline:
                </p>
                <p style={{ fontSize: '11pt', fontWeight: '600', color: '#1F2937', marginBottom: '0' }}>
                  {data.skillsAssessment.timeline}
                </p>
              </div>
            </div>

            <div>
              <p style={{ fontSize: '10pt', fontWeight: '600', color: '#1F2937', marginBottom: '8pt' }}>
                Requirements:
              </p>
              <ul className="checkmark-list">
                {data.skillsAssessment.requirements.map((req, index) => (
                  <li key={index} style={{ fontSize: '10pt', color: '#4B5563', marginBottom: '6pt' }}>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Additional Information */}
      {(data.occupationCeiling || data.labourMarketInfo) && (
        <div className="subsection">
          <h3>2.4 Occupation Demand & Availability</h3>

          {data.occupationCeiling && (
            <div style={{
              background: '#D1FAE5',
              border: '1pt solid #10B981',
              borderRadius: '6pt',
              padding: '12pt',
              marginBottom: '12pt'
            }}>
              <p style={{ marginBottom: '0', fontSize: '11pt' }}>
                <strong style={{ color: '#065F46' }}>✓ Occupation Ceiling Status:</strong>{' '}
                <span style={{ color: '#047857' }}>{data.occupationCeiling}</span>
              </p>
            </div>
          )}

          {data.labourMarketInfo && (
            <div style={{
              background: '#FFFBEB',
              border: '1pt solid #FCD34D',
              borderRadius: '6pt',
              padding: '12pt'
            }}>
              <p style={{ marginBottom: '0', fontSize: '11pt', lineHeight: '1.6' }}>
                <strong style={{ color: '#92400E' }}>Labour Market Insight:</strong>{' '}
                <span style={{ color: '#78350F' }}>{data.labourMarketInfo}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

