import React from 'react';
import type { CanadaSkillDemandData } from '../types/report-types';
import { SectionHeader } from '../shared/SectionHeader';
import { renderTextWithLinks } from '../shared/renderTextWithLinks';

interface Props {
  data: CanadaSkillDemandData;
}

export function Section5_SkillDemand({ data }: Props) {
  return (
    <div className="section page">
      <SectionHeader number="5" title="Global Skill Demand Mapping – Where Your Skills Are in Demand" />

      {/* 5.1 Skill Mapping */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          5.1 Mapping Your Core Skills to Canadian NOC Codes
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
          <thead>
            <tr>
              {['Your Skill', 'NOC 21231', 'NOC 21234', 'Weight in Market'].map((h) => (
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
            {data.skillMapping.map((row: any, i: number) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#F8F9FB' : '#FFFFFF' }}>
                <td style={{ padding: '4pt 6pt', color: '#111827', fontWeight: 600, borderBottom: '1pt solid #E5E7EB' }}>{renderTextWithLinks(row.skill)}</td>
                <td style={{ padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' }}>{renderTextWithLinks(row.noc21231)}</td>
                <td style={{ padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' }}>{renderTextWithLinks(row.noc21234)}</td>
                <td style={{ padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' }}>{renderTextWithLinks(row.weightInMarket)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 5.2 Shortage Lists */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          5.2 Canada Skill Shortage Lists &amp; Relevant Categories
        </h3>
        <div style={{ borderLeft: '3pt solid #1B2A4A', padding: '6pt 10pt', backgroundColor: '#F8F9FB', marginBottom: '6pt' }}>
          <p style={{ fontSize: '12pt', fontWeight: 600, color: '#111827', margin: '0 0 4pt 0' }}>{renderTextWithLinks(data.shortageListInfo)}</p>
          <p style={{ fontSize: '12pt', fontWeight: 600, color: '#111827', margin: '0 0 2pt 0' }}>Canadian Job Vacancy Data:</p>
          <ul style={{ margin: '0', paddingLeft: '14pt', fontSize: '12pt', color: '#4B5563', lineHeight: 1.5 }}>
            {data.jobVacancyData.map((item: any, index: number) => (
              <li key={index} style={{ marginBottom: '1pt' }}>{renderTextWithLinks(item)}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* 5.3 Demand by Province */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          5.3 Demand Level by Province
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt', marginBottom: '8pt' }}>
          <thead>
            <tr>
              {['Province', 'NOC 21231', 'NOC 21234', 'Overall Demand', 'Jobs (est.)', 'Growth'].map((h) => (
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
            {data.demandByProvince.map((row: any, i: number) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#F8F9FB' : '#FFFFFF' }}>
                <td style={{ padding: '4pt 6pt', color: '#111827', fontWeight: 600, borderBottom: '1pt solid #E5E7EB' }}>{renderTextWithLinks(row.province)}</td>
                <td style={{ padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' }}>{renderTextWithLinks(row.noc21231)}</td>
                <td style={{ padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' }}>{renderTextWithLinks(row.noc21234)}</td>
                <td style={{ padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' }}>{renderTextWithLinks(row.overallDemand)}</td>
                <td style={{ padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' }}>{renderTextWithLinks(row.jobs)}</td>
                <td style={{ padding: '4pt 6pt', color: '#059669', fontWeight: 600, borderBottom: '1pt solid #E5E7EB' }}>{renderTextWithLinks(row.growth)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Province Contexts */}
        <p style={{ fontSize: '12pt', fontWeight: 600, color: '#111827', margin: '0 0 4pt 0' }}>Provincial Context:</p>
        {data.provinceContexts.map((ctx: any, index: number) => (
          <div
            key={index}
            style={{
              borderLeft: '3pt solid #1B2A4A',
              padding: '6pt 10pt',
              marginBottom: '6pt',
              backgroundColor: '#F8F9FB',
            }}
          >
            <div style={{ fontSize: '12pt', fontWeight: 700, color: '#1B2A4A', marginBottom: '3pt' }}>
              {renderTextWithLinks(ctx.province)} ({renderTextWithLinks(ctx.city)}) – {renderTextWithLinks(ctx.techHubStatus)}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4pt 16pt', fontSize: '12pt', color: '#4B5563' }}>
              <span><span style={{ fontWeight: 600, color: '#111827' }}>Companies:</span> {renderTextWithLinks(ctx.companies.join(', '))}</span>
              <span><span style={{ fontWeight: 600, color: '#111827' }}>Salary:</span> {renderTextWithLinks(ctx.salaryRange)}</span>
              <span><span style={{ fontWeight: 600, color: '#111827' }}>Openings:</span> {renderTextWithLinks(ctx.jobOpenings)}</span>
              <span><span style={{ fontWeight: 600, color: '#111827' }}>Visa Employers:</span> {renderTextWithLinks(ctx.visaTechEmployers)}</span>
              {ctx.costOfLiving && (
                <span><span style={{ fontWeight: 600, color: '#111827' }}>Cost of Living:</span> {renderTextWithLinks(ctx.costOfLiving)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
