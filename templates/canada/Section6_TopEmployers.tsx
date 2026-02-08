import React from 'react';
import type { CanadaTopEmployersData } from '../types/report-types';
import { SectionHeader } from '../shared/SectionHeader';

interface Props {
  data: CanadaTopEmployersData;
}

export function Section6_TopEmployers({ data }: Props) {
  return (
    <div className="section page">
      <SectionHeader number="6" title="Top Target Employers (by Province & Sector)" />

      {data.provinces.map((provinceData, index) => (
        <div key={index} style={{ marginBottom: '20pt', pageBreakInside: 'avoid' }}>
          <div style={{
            borderLeft: '3pt solid #1B2A4A',
            padding: '5pt 10pt',
            marginBottom: '6pt',
            background: '#F8F9FB',
          }}>
            <div style={{ fontSize: '12pt', fontWeight: 700, color: '#111827' }}>
              {provinceData.province} / {provinceData.city}
            </div>
            <div style={{ fontSize: '10pt', color: '#9CA3AF', marginTop: '1pt' }}>
              Top {provinceData.employers.length} Target Employers
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt', marginBottom: '4pt' }}>
            <thead>
              <tr>
                {['Rank', 'Company', 'Industry', 'Salary (CAD)', 'Visa Sponsorship'].map((h, i) => (
                  <th key={i} style={{
                    padding: '5pt 6pt',
                    textAlign: i === 0 ? 'center' : 'left',
                    fontWeight: 700,
                    fontSize: '10pt',
                    color: '#FFFFFF',
                    background: '#1B2A4A',
                    borderBottom: '1pt solid #E5E7EB',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {provinceData.employers.map((employer, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#F8F9FB' }}>
                  <td style={{
                    padding: '4pt 6pt',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#1B2A4A',
                    borderBottom: '0.5pt solid #E5E7EB',
                  }}>
                    {employer.rank}
                  </td>
                  <td style={{
                    padding: '4pt 6pt',
                    fontWeight: 600,
                    color: '#111827',
                    borderBottom: '0.5pt solid #E5E7EB',
                  }}>
                    {employer.company}
                  </td>
                  <td style={{
                    padding: '4pt 6pt',
                    color: '#4B5563',
                    borderBottom: '0.5pt solid #E5E7EB',
                  }}>
                    {employer.industry}
                  </td>
                  <td style={{
                    padding: '4pt 6pt',
                    color: '#4B5563',
                    borderBottom: '0.5pt solid #E5E7EB',
                  }}>
                    {employer.salary}
                  </td>
                  <td style={{
                    padding: '4pt 6pt',
                    color: employer.visaSponsorship?.toLowerCase().includes('yes') ? '#059669' : '#4B5563',
                    fontWeight: employer.visaSponsorship?.toLowerCase().includes('yes') ? 600 : 400,
                    borderBottom: '0.5pt solid #E5E7EB',
                  }}>
                    {employer.visaSponsorship}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Why Hire You - compact row below the table */}
          {provinceData.employers.some(e => e.whyHireYou) && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt', marginBottom: '6pt' }}>
              <tbody>
                {provinceData.employers.map((employer, i) => (
                  employer.whyHireYou ? (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#F8F9FB' }}>
                      <td style={{
                        padding: '3pt 6pt',
                        fontWeight: 600,
                        color: '#111827',
                        borderBottom: '0.5pt solid #E5E7EB',
                        width: '20%',
                        verticalAlign: 'top',
                      }}>
                        {employer.company}
                      </td>
                      <td style={{
                        padding: '3pt 6pt',
                        color: '#4B5563',
                        borderBottom: '0.5pt solid #E5E7EB',
                        lineHeight: '1.4',
                      }}>
                        {employer.whyHireYou}
                      </td>
                    </tr>
                  ) : null
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}
