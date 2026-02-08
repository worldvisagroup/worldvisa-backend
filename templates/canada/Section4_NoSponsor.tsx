import React from 'react';
import type { NoSponsorData } from '../types/report-types';
import { SectionHeader } from '../shared/SectionHeader';

interface Props {
  data: NoSponsorData;
}

export function Section4_NoSponsor({ data }: Props) {
  return (
    <div className="section page">
      <SectionHeader number="4" title="You Can Move to WITHOUT a Sponsor / Employer" />

      {/* 4.1 Concept & Self-Sponsored Routes */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          4.1 Understanding Sponsor-Free / Self-Sponsored Routes
        </h3>
        <p style={{ fontSize: '12pt', color: '#4B5563', lineHeight: 1.5, margin: '0 0 6pt 0' }}>{data.concept}</p>

        <p style={{ fontSize: '12pt', fontWeight: 600, color: '#111827', margin: '0 0 4pt 0' }}>Self-Sponsored Routes in Canada:</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
          <thead>
            <tr>
              {['Route', 'Sponsor Required?', 'Job Offer Required?', 'Viability for You'].map((h) => (
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
            {data.selfSponsoredRoutes.map((route, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#F8F9FB' : '#FFFFFF' }}>
                <td style={{ padding: '4pt 6pt', color: '#111827', fontWeight: 600, borderBottom: '1pt solid #E5E7EB' }}>{route.route}</td>
                <td style={{ padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' }}>{route.sponsorRequired}</td>
                <td style={{ padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' }}>{route.jobOfferRequired}</td>
                <td style={{ padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' }}>{route.viability}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4.2 Matrix */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          4.2 Canada Matrix – No Employer Sponsorship Required
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
          <thead>
            <tr>
              {['Option', 'Type', 'Details'].map((h) => (
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
            {data.matrix.map((item, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#F8F9FB' : '#FFFFFF' }}>
                <td style={{ padding: '4pt 6pt', color: '#111827', fontWeight: 600, borderBottom: '1pt solid #E5E7EB' }}>{item.option}</td>
                <td style={{ padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' }}>{item.type}</td>
                <td style={{ padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' }}>{item.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4.3 Settlement Pathway */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          4.3 Long-Term Settlement &amp; Citizenship Pathways
        </h3>
        <p style={{ fontSize: '12pt', fontWeight: 600, color: '#111827', margin: '0 0 4pt 0' }}>PR to Citizenship Timeline:</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
          <thead>
            <tr>
              {['Stage', 'Duration', 'Status'].map((h) => (
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
            {data.settlementPathway.stages.map((stage, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#F8F9FB' : '#FFFFFF' }}>
                <td style={{ padding: '4pt 6pt', color: '#111827', fontWeight: 600, borderBottom: '1pt solid #E5E7EB' }}>{stage.stage}</td>
                <td style={{ padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' }}>{stage.duration}</td>
                <td style={{ padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' }}>{stage.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
