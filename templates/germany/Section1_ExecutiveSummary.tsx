import React from 'react';
import type { GermanyExecutiveSummaryData } from '../types/report-types';
import { SectionHeader } from '../shared/SectionHeader';
import { Table } from '../shared/Table';

interface Props {
  data: GermanyExecutiveSummaryData;
}

export function Section1_ExecutiveSummary({ data }: Props) {
  return (
    <div className="section executive-summary">
      <SectionHeader number="1" title="Executive Summary" />

      <div className="subsection" style={{ marginTop: '8pt' }}>
        <h3>1.1 Purpose of This Report</h3>
        <p>{data.purpose}</p>
      </div>

      <div className="subsection" style={{ marginTop: '8pt' }}>
        <h3>1.2 Snapshot of Your Global Mobility Options</h3>
        <p><strong>Your Key Advantages:</strong></p>
        <ul style={{ marginLeft: '20pt', marginBottom: '12pt' }}>
          {data.globalMobility.keyAdvantages.map((advantage, index) => (
            <li key={index} style={{ marginBottom: '6pt' }}>{advantage}</li>
          ))}
        </ul>
      </div>

      <div className="subsection" style={{ marginTop: '8pt' }}>
        <h3>1.3 Top 3 Recommended German Cities</h3>
        <Table
          columns={[
            { header: 'Rank', key: 'rank', align: 'center' },
            { header: 'City', key: 'city' },
            { header: 'Tech Hub', key: 'techHub' },
            { header: 'Job Demand', key: 'jobDemand' },
            { header: 'Salary Range', key: 'salaryRange' },
            { header: 'Recommendation', key: 'recommendation' },
          ]}
          data={data.topCities.map(city => ({
            rank: city.rank,
            city: city.city,
            techHub: city.techHub,
            jobDemand: city.jobDemand,
            salaryRange: city.salaryRange,
            recommendation: city.recommendation,
          }))}
        />
      </div>
    </div>
  );
}

