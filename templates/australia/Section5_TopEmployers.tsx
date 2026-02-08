import React from 'react';
import type { TopEmployersData } from '../types/report-types';
import { SectionHeader } from './shared/SectionHeader';

interface Props {
  data: TopEmployersData;
}

export function Section5_TopEmployers({ data }: Props) {
  return (
    <div className="section page">
      <SectionHeader number="5" title="Top 20 Target Employers (by Sector, Australia)" />

      <p style={{ fontSize: '12pt', color: '#4B5563', marginBottom: '12pt', lineHeight: '1.5' }}>
        Based on your professional background, these companies represent the best opportunities
        for your skills and experience.
      </p>

      {data.tiers.map((tier, tierIndex) => (
        <div key={tierIndex} style={{ marginBottom: '12pt', pageBreakInside: 'avoid' }}>
          <div style={{ borderLeft: '3pt solid #1B2A4A', padding: '6pt 10pt', marginBottom: '6pt', background: '#F8F9FB' }}>
            <div style={{ fontSize: '12pt', fontWeight: 700, color: '#111827' }}>{tier.tierName}</div>
            <div style={{ fontSize: '10pt', color: '#9CA3AF', marginTop: '2pt' }}>{tier.tierDescription}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6pt' }}>
            {tier.companies.map((company, companyIndex) => (
              <div key={companyIndex} style={{ padding: '6pt 8pt', border: '0.5pt solid #E5E7EB', borderRadius: '3pt', background: '#FFFFFF', pageBreakInside: 'avoid' }}>
                <span style={{ fontWeight: 600, color: '#1F2937', fontSize: '12pt', display: 'block', marginBottom: '2pt' }}>
                  {company.name}
                </span>
                <span style={{ fontSize: '10pt', color: '#6B7280', background: '#F3F4F6', padding: '1pt 5pt', borderRadius: '2pt', display: 'inline-block', marginBottom: '3pt' }}>
                  {company.location}
                </span>
                <div style={{ fontSize: '12pt', color: '#4B5563', marginTop: '2pt', lineHeight: '1.3' }}>
                  {company.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Why These Companies */}
      <div style={{ marginTop: '8pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          Why These Companies?
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
          <tbody>
            {[
              { label: 'Actively Hiring', value: data.whyTheseCompanies.activelyHiring },
              { label: 'Sponsor Migrants', value: data.whyTheseCompanies.sponsorMigrants },
              { label: 'Growth Trajectory', value: data.whyTheseCompanies.growthTrajectory },
              { label: 'Your Fit', value: data.whyTheseCompanies.yourFit },
              { label: 'Learning Opportunity', value: data.whyTheseCompanies.learningOpportunity },
            ].map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#F8F9FB' : '#FFFFFF' }}>
                <td style={{ padding: '5pt 8pt', fontWeight: 600, color: '#111827', borderBottom: '0.5pt solid #E5E7EB', width: '25%', verticalAlign: 'top' }}>
                  {row.label}
                </td>
                <td style={{ padding: '5pt 8pt', color: '#4B5563', borderBottom: '0.5pt solid #E5E7EB', lineHeight: '1.4' }}>
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
