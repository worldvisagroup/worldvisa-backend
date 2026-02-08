import React from 'react';
import type { ExecutiveSummaryData } from '../types/report-types';
import { SectionHeader } from './shared/SectionHeader';

interface Props {
  data: ExecutiveSummaryData;
}

export function Section1_ExecutiveSummary({ data }: Props) {
  return (
    <div className="section page">
      <SectionHeader number="1" title="Executive Summary" />

      <div style={{ marginBottom: '20pt' }}>
        <p style={{ fontSize: '12pt', color: '#4B5563', lineHeight: '1.6', margin: 0 }}>
          {data.purpose}
        </p>
      </div>

      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          1.1 Top Visa Pathways
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
          <thead>
            <tr>
              <th style={{ background: '#F8F9FB', padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#111827', border: '1pt solid #E5E7EB' }}>
                Pathway
              </th>
              <th style={{ background: '#F8F9FB', padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#111827', border: '1pt solid #E5E7EB', width: '80pt' }}>
                Subclass
              </th>
              <th style={{ background: '#F8F9FB', padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#111827', border: '1pt solid #E5E7EB' }}>
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {data.topVisaPathways.map((pathway, index) => (
              <tr key={index}>
                <td style={{ padding: '6pt 8pt', border: '1pt solid #E5E7EB', color: '#111827', fontWeight: 600, verticalAlign: 'top', background: index % 2 === 0 ? '#FFFFFF' : '#F8F9FB' }}>
                  {pathway.name}
                </td>
                <td style={{ padding: '6pt 8pt', border: '1pt solid #E5E7EB', color: '#2563EB', fontWeight: 600, verticalAlign: 'top', background: index % 2 === 0 ? '#FFFFFF' : '#F8F9FB' }}>
                  {pathway.subclass}
                </td>
                <td style={{ padding: '6pt 8pt', border: '1pt solid #E5E7EB', color: '#4B5563', verticalAlign: 'top', lineHeight: '1.5', background: index % 2 === 0 ? '#FFFFFF' : '#F8F9FB' }}>
                  {pathway.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Why Australia */}
      {data.whyAustralia && data.whyAustralia.length > 0 && (
        <div style={{ marginBottom: '20pt' }}>
          <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
            1.2 Why Australia?
          </h3>
          <ul style={{ margin: 0, paddingLeft: '16pt', listStyle: 'none' }}>
            {data.whyAustralia.map((reason, index) => (
              <li key={index} style={{ fontSize: '12pt', color: '#4B5563', marginBottom: '4pt', lineHeight: '1.5' }}>
                <span dangerouslySetInnerHTML={{ __html: '&#10003;' }} style={{ color: '#059669', marginRight: '6pt', fontWeight: 700 }} />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Key Highlights */}
      {data.keyHighlights && data.keyHighlights.length > 0 && (
        <div style={{ marginBottom: '20pt' }}>
          <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
            1.3 Key Highlights
          </h3>
          <div style={{ borderLeft: '3pt solid #1B2A4A', paddingLeft: '10pt', background: '#F8F9FB', padding: '8pt 10pt' }}>
            <ul style={{ margin: 0, paddingLeft: '14pt' }}>
              {data.keyHighlights.map((highlight, index) => (
                <li key={index} style={{ fontSize: '12pt', color: '#111827', marginBottom: '4pt', lineHeight: '1.5', fontWeight: 600 }}>
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Profile Strengths */}
      {data.profileStrengths && data.profileStrengths.length > 0 && (
        <div style={{ marginBottom: '20pt' }}>
          <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
            1.4 Profile Strengths
          </h3>
          <ul style={{ margin: 0, paddingLeft: '16pt', listStyle: 'none' }}>
            {data.profileStrengths.map((strength, index) => (
              <li key={index} style={{ fontSize: '12pt', color: '#4B5563', marginBottom: '4pt', lineHeight: '1.5' }}>
                <span dangerouslySetInnerHTML={{ __html: '&#10003;' }} style={{ color: '#059669', marginRight: '6pt', fontWeight: 700 }} />
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Market Trends */}
      {data.marketTrends && (
        <div style={{ marginBottom: '20pt' }}>
          <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
            1.5 Market Trends
          </h3>
          <div style={{ borderLeft: '3pt solid #1B2A4A', paddingLeft: '10pt', background: '#F8F9FB', padding: '8pt 10pt' }}>
            <p style={{ margin: 0, fontSize: '12pt', color: '#4B5563', lineHeight: '1.6' }}>
              <strong style={{ color: '#111827' }}>Market Insight:</strong> {data.marketTrends}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
