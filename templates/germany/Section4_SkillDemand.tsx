import React from 'react';
import type { GermanySkillDemandData } from '../types/report-types';
import { SectionHeader } from '../shared/SectionHeader';
import { Table } from '../shared/Table';

interface Props {
  data: GermanySkillDemandData;
}

export function Section4_SkillDemand({ data }: Props) {
  return (
    <div
      className="section skill-demand"
      style={{ pageBreakBefore: 'always' }}
    >
      <SectionHeader number="4" title="Global Skill Demand Mapping" />

      <div className="subsection" style={{ marginTop: '8pt' }}>
        <h3>4.1 Mapping Your Core Skills to German Market</h3>
        <Table
          columns={[
            { header: 'Your Skill', key: 'skill' },
            { header: 'IT Market Demand', key: 'marketDemand' },
            { header: 'Salary Impact', key: 'salaryImpact' },
            { header: 'Shortage Status', key: 'shortageStatus' },
          ]}
          data={data.skillMapping.map(skill => ({
            skill: skill.skill,
            marketDemand: skill.marketDemand,
            salaryImpact: skill.salaryImpact,
            shortageStatus: skill.shortageStatus,
          }))}
        />
        <p style={{ marginTop: '12pt' }}>
          <strong>Verdict:</strong> Your skill set perfectly matches German IT shortage occupations,
          with <strong>exceptional advantage</strong> in visa/immigration tech domain.
        </p>
      </div>

      <div className="subsection" style={{ marginTop: '8pt' }}>
        <h3>4.2 Germany&apos;s Tech Skill Shortage</h3>
        <p><strong>{data.techShortage.description}</strong></p>
        <ul style={{ marginLeft: '20pt', marginBottom: '12pt' }}>
          {data.techShortage.marketFacts.map((fact, index) => (
            <li key={index} style={{ marginBottom: '6pt' }}>{fact}</li>
          ))}
        </ul>
        <p><strong>Conclusion:</strong> {data.techShortage.conclusion}</p>
      </div>

      <div className="subsection" style={{ marginTop: '8pt' }}>
        <h3>4.3 Demand Level by City</h3>
        <Table
          columns={[
            { header: 'City', key: 'city' },
            { header: 'Tech Market', key: 'techMarket' },
            { header: 'Job Opportunities', key: 'jobOpportunities' },
            { header: 'Salary Range', key: 'salaryRange' },
            { header: 'Type', key: 'type' },
          ]}
          data={data.demandByCity.map(city => ({
            city: city.city,
            techMarket: city.techMarket,
            jobOpportunities: city.jobOpportunities,
            salaryRange: city.salaryRange,
            type: city.type,
          }))}
        />
      </div>
    </div>
  );
}

