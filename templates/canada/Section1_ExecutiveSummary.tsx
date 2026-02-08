import React from 'react';
import type { CanadaExecutiveSummaryData } from '../types/report-types';
import { SectionHeader } from '../shared/SectionHeader';

interface Props {
  data: CanadaExecutiveSummaryData;
}

export function Section1_ExecutiveSummary({ data }: Props) {
  return (
    <div className="section page">
      <SectionHeader number="1" title="Executive Summary" />

      <div style={{ marginBottom: '8pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          1.1 Purpose of This Report
        </h3>
        <p style={{ fontSize: '12pt', color: '#4B5563', lineHeight: 1.5, margin: 0 }}>{data.purpose}</p>
      </div>

      <div style={{ marginBottom: '12pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          1.2 Why Canada
        </h3>
        <p style={{ fontSize: '12pt', color: '#4B5563', lineHeight: 1.5, margin: 0 }}>{data.whyCanada}</p>
      </div>

      <div style={{ marginBottom: '12pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          1.3 Top Recommended Canadian Provinces
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
          <thead>
            <tr>
              {['Rank', 'Province', 'Pathway', 'CRS Advantage', 'Job Demand', 'Recommendation'].map((h) => (
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
            {data.topProvinces.map((p: any, i: number) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#F8F9FB' : '#FFFFFF' }}>
                <td style={{ padding: '4pt 6pt', color: '#111827', textAlign: 'center', borderBottom: '1pt solid #E5E7EB' }}>{p.rank}</td>
                <td style={{ padding: '4pt 6pt', color: '#111827', fontWeight: 600, borderBottom: '1pt solid #E5E7EB' }}>{p.province}</td>
                <td style={{ padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' }}>{p.pathway}</td>
                <td style={{ padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' }}>{p.crsAdvantage}</td>
                <td style={{ padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' }}>{p.jobDemand}</td>
                <td style={{ padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' }}>{p.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: '6pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          1.4 High-Level Risk &amp; Reward Overview
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
          <thead>
            <tr>
              {['Factor', 'Risk Level', 'Reward Level', 'Mitigation'].map((h) => (
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
            {data.riskReward.map((r: any, i: number) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#F8F9FB' : '#FFFFFF' }}>
                <td style={{ padding: '4pt 6pt', color: '#111827', fontWeight: 600, borderBottom: '1pt solid #E5E7EB' }}>{r.factor}</td>
                <td style={{ padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' }}>{r.riskLevel}</td>
                <td style={{ padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' }}>{r.rewardLevel}</td>
                <td style={{ padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' }}>{r.mitigation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
