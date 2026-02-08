import React from 'react';
import type { NoJobOfferData } from '../types/report-types';
import { SectionHeader } from '../shared/SectionHeader';

interface Props {
  data: NoJobOfferData;
}

export function Section3_NoJobOffer({ data }: Props) {
  return (
    <div className="section page">
      <SectionHeader number="3" title="You Can Move to WITHOUT a Job Offer" />

      {/* 3.1 Concept Overview */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          3.1 Concept Overview – &quot;Job-Offer-Free&quot; Migration Pathways
        </h3>
        <p style={{ fontSize: '12pt', color: '#4B5563', lineHeight: 1.5, margin: 0 }}>{data.conceptOverview}</p>
      </div>

      {/* 3.2 Visa Categories */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          3.2 Canadian Visa Categories &amp; Conditions
        </h3>

        {data.visaCategories.map((category, index) => (
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
              {category.type === 'Primary' ? 'PRIMARY PATHWAY' : 'SECONDARY PATHWAY'}: {category.name}
            </div>
            <p style={{ fontSize: '12pt', color: '#4B5563', lineHeight: 1.5, margin: '0 0 4pt 0' }}>
              <span style={{ fontWeight: 600, color: '#111827' }}>What It Is:</span> {category.description}
            </p>

            {/* CRS Breakdown */}
            {category.estimatedCRS && (
              <div style={{ marginBottom: '6pt' }}>
                <p style={{ fontSize: '12pt', fontWeight: 600, color: '#111827', margin: '0 0 3pt 0' }}>
                  Your Estimated CRS Score (Without Job Offer):
                </p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
                  <tbody>
                    {[
                      { label: 'Age (18-35)', value: `+${category.estimatedCRS.age} points` },
                      { label: 'Education (Bachelor\'s)', value: `+${category.estimatedCRS.education} points` },
                      { label: 'Language (CLB 8, estimated)', value: `+${category.estimatedCRS.language} points` },
                      { label: 'Work Experience (4 years)', value: `+${category.estimatedCRS.workExperience} points` },
                      { label: 'Spouse/Partner', value: `+${category.estimatedCRS.spouse} points` },
                    ].map((row, i) => (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#F8F9FB' }}>
                        <td style={{ padding: '3pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' }}>{row.label}</td>
                        <td style={{ padding: '3pt 6pt', color: '#059669', fontWeight: 600, textAlign: 'right', borderBottom: '1pt solid #E5E7EB' }}>{row.value}</td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: '#1B2A4A' }}>
                      <td style={{ padding: '4pt 6pt', color: '#FFFFFF', fontWeight: 700 }}>SUBTOTAL</td>
                      <td style={{ padding: '4pt 6pt', color: '#FFFFFF', fontWeight: 700, textAlign: 'right' }}>~{category.estimatedCRS.subtotal} points</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {category.cutOffScores && (
              <p style={{ fontSize: '12pt', color: '#4B5563', margin: '0 0 4pt 0' }}>
                <span style={{ fontWeight: 600, color: '#111827' }}>Current Cut-Off Scores:</span> {category.cutOffScores}
              </p>
            )}

            {/* Improvements */}
            {category.improvements && category.improvements.length > 0 && (
              <div style={{ marginBottom: '4pt' }}>
                <p style={{ fontSize: '12pt', fontWeight: 600, color: '#111827', margin: '0 0 2pt 0' }}>How to Improve Your CRS Score:</p>
                <ul style={{ margin: '0', paddingLeft: '14pt', fontSize: '12pt', color: '#4B5563', lineHeight: 1.5 }}>
                  {category.improvements.map((imp, idx) => (
                    <li key={idx} style={{ marginBottom: '1pt' }}>
                      <span style={{ fontWeight: 600, color: '#111827' }}>{imp.action}:</span> {imp.boost}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* PNP Options */}
            {category.options && category.options.length > 0 && (
              <div>
                <p style={{ fontSize: '12pt', fontWeight: 600, color: '#111827', margin: '4pt 0 3pt 0' }}>Top Provincial Programs for You:</p>
                {category.options.map((option, optIdx) => (
                  <div
                    key={optIdx}
                    style={{
                      borderLeft: '2pt solid #2563EB',
                      padding: '5pt 8pt',
                      marginBottom: '6pt',
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <div style={{ fontSize: '12pt', fontWeight: 700, color: '#2563EB', marginBottom: '2pt' }}>
                      OPTION {optIdx + 1}: {option.name}
                    </div>
                    <p style={{ fontSize: '12pt', color: '#4B5563', margin: '0 0 2pt 0' }}>
                      <span style={{ fontWeight: 600 }}>Province:</span> {option.province}
                    </p>

                    <p style={{ fontSize: '12pt', fontWeight: 600, color: '#111827', margin: '2pt 0 1pt 0' }}>Key Details:</p>
                    <ul style={{ margin: '0', paddingLeft: '14pt', fontSize: '12pt', color: '#4B5563', lineHeight: 1.4 }}>
                      {option.details.map((d, dIdx) => (
                        <li key={dIdx} style={{ marginBottom: '1pt' }}>{d}</li>
                      ))}
                    </ul>

                    <p style={{ fontSize: '12pt', color: '#4B5563', margin: '2pt 0' }}>
                      <span style={{ fontWeight: 600, color: '#111827' }}>CRS Bonus:</span> {option.crsBonus}
                    </p>

                    {option.advantages.length > 0 && (
                      <>
                        <p style={{ fontSize: '12pt', fontWeight: 600, color: '#111827', margin: '2pt 0 1pt 0' }}>Advantages:</p>
                        <ul style={{ margin: '0', paddingLeft: '14pt', fontSize: '12pt', color: '#4B5563', lineHeight: 1.4 }}>
                          {option.advantages.map((a, aIdx) => (
                            <li key={aIdx} style={{ marginBottom: '1pt' }}>{a}</li>
                          ))}
                        </ul>
                      </>
                    )}

                    {option.process.length > 0 && (
                      <>
                        <p style={{ fontSize: '12pt', fontWeight: 600, color: '#111827', margin: '2pt 0 1pt 0' }}>Process:</p>
                        <ol style={{ margin: '0', paddingLeft: '16pt', fontSize: '12pt', color: '#4B5563', lineHeight: 1.4 }}>
                          {option.process.map((s, sIdx) => (
                            <li key={sIdx} style={{ marginBottom: '1pt' }}>{s}</li>
                          ))}
                        </ol>
                      </>
                    )}

                    <p style={{ fontSize: '12pt', color: '#4B5563', margin: '2pt 0 0 0' }}>
                      <span style={{ fontWeight: 600, color: '#111827' }}>Timeline:</span> {option.timeline}
                    </p>

                    {option.disadvantages && option.disadvantages.length > 0 && (
                      <>
                        <p style={{ fontSize: '12pt', fontWeight: 600, color: '#111827', margin: '2pt 0 1pt 0' }}>Disadvantages:</p>
                        <ul style={{ margin: '0', paddingLeft: '14pt', fontSize: '12pt', color: '#4B5563', lineHeight: 1.4 }}>
                          {option.disadvantages.map((d, dIdx) => (
                            <li key={dIdx} style={{ marginBottom: '1pt' }}>{d}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 3.3 Comparative Summary */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          3.3 Comparative Summary – Ease, Timelines, Long-Term PR Options
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
          <thead>
            <tr>
              {['Pathway', 'Timeline', 'Ease', 'Job Offer Required', 'Cost', 'Long-Term PR', 'Recommendation'].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: 'left',
                    padding: '5pt 6pt',
                    backgroundColor: '#1B2A4A',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '10pt',
                    borderBottom: '1pt solid #E5E7EB',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.comparativeSummary.map((row, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#F8F9FB' : '#FFFFFF' }}>
                <td style={{ padding: '4pt 6pt', color: '#111827', fontWeight: 600, borderBottom: '1pt solid #E5E7EB' }}>{row.pathway}</td>
                <td style={{ padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' }}>{row.timeline}</td>
                <td style={{ padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' }}>{row.ease}</td>
                <td style={{ padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' }}>{row.jobOfferRequired}</td>
                <td style={{ padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' }}>{row.cost}</td>
                <td style={{ padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' }}>{row.longTermPR}</td>
                <td style={{ padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' }}>{row.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
