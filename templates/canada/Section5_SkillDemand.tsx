import React from 'react';
import type { CanadaSkillDemandData } from '../types/report-types';
import { SectionHeader } from '../shared/SectionHeader';
import { Table } from '../shared/Table';

interface Props {
  data: CanadaSkillDemandData;
}

export function Section5_SkillDemand({ data }: Props) {
  return (
    <div className="section skill-demand">
      <SectionHeader number="5" title="Global Skill Demand Mapping – Where Your Skills Are in Demand" />

      <div className="subsection">
        <h3>5.1 Mapping Your Core Skills to Canadian NOC Codes</h3>
        <p><strong>Your Skill Stack → NOC Mapping:</strong></p>
        <Table
          columns={[
            { header: 'Your Skill', key: 'skill' },
            { header: 'NOC 21231', key: 'noc21231' },
            { header: 'NOC 21234', key: 'noc21234' },
            { header: 'Weight in Market', key: 'weightInMarket' },
          ]}
          data={data.skillMapping.map(row => ({
            skill: row.skill,
            noc21231: row.noc21231,
            noc21234: row.noc21234,
            weightInMarket: row.weightInMarket,
          }))}
        />
        <p style={{ marginTop: '12pt' }}>
          <strong>Verdict:</strong> Your skill set perfectly matches both NOC 21231 (Software Engineers) 
          and 21234 (Web Developers), with exceptional advantage in visa/immigration tech domain.
        </p>
      </div>

      <div className="subsection">
        <h3>5.2 Canada Skill Shortage Lists & Relevant Categories</h3>
        <div className="card">
          <p><strong>{data.shortageListInfo}</strong></p>
          
          <p><strong>Canadian Job Vacancy Data:</strong></p>
          <ul>
            {data.jobVacancyData.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <p style={{ marginTop: '12pt' }}>
            <strong>Conclusion:</strong> Software developers have the best-in-demand profile for Canadian immigration.
          </p>
        </div>
      </div>

      <div className="subsection">
        <h3>5.3 Demand Level by Province (High / Moderate / Emerging)</h3>
        <p><strong>DEMAND SCORECARD BY PROVINCE:</strong></p>
        <Table
          columns={[
            { header: 'Province', key: 'province' },
            { header: 'NOC 21231', key: 'noc21231' },
            { header: 'NOC 21234', key: 'noc21234' },
            { header: 'Overall Demand', key: 'overallDemand' },
            { header: 'Jobs (2025 est.)', key: 'jobs' },
            { header: 'Growth', key: 'growth' },
          ]}
          data={data.demandByProvince.map(row => ({
            province: row.province,
            noc21231: row.noc21231,
            noc21234: row.noc21234,
            overallDemand: row.overallDemand,
            jobs: row.jobs,
            growth: row.growth,
          }))}
        />

        <h4 style={{ marginTop: '20pt' }}>Provincial Context:</h4>
        {data.provinceContexts.map((context, index) => (
          <div key={index} className="card" style={{ marginBottom: '12pt' }}>
            <h4 style={{ color: '#0066CC', marginTop: 0 }}>
              {context.province} ({context.city}) – {context.techHubStatus}
            </h4>
            <p><strong>Companies:</strong> {context.companies.join(', ')}</p>
            <p><strong>Salary Range:</strong> {context.salaryRange}</p>
            <p><strong>Job Openings:</strong> {context.jobOpenings}</p>
            <p><strong>Visa Tech Employers:</strong> {context.visaTechEmployers}</p>
            {context.costOfLiving && (
              <p><strong>Cost of Living:</strong> {context.costOfLiving}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

