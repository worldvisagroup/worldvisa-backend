import React from 'react';
import type { CanadaExecutiveSummaryData } from '../types/report-types';
import { SectionHeader } from '../shared/SectionHeader';
import { Table } from '../shared/Table';

interface Props {
  data: CanadaExecutiveSummaryData;
}

export function Section1_ExecutiveSummary({ data }: Props) {
  return (
    <div className="section executive-summary">
      <SectionHeader number="1" title="Executive Summary" />

      <div className="subsection">
        <h3>1.1 Purpose of This Report</h3>
        <p>{data.purpose}</p>
      </div>

      <div className="subsection">
        <h3>1.2 Why Canada</h3>
        <p>{data.whyCanada}</p>
      </div>

      <div className="subsection" style={{ marginTop: '8pt' }}>
        <h3 style={{ marginBottom: '10pt' }}>1.3 Top 3 Recommended Canadian Provinces (Without Job Offer / Sponsor)</h3>
        <Table
          columns={[
            { header: 'Rank', key: 'rank', align: 'center' },
            { header: 'Province', key: 'province' },
            { header: 'Pathway', key: 'pathway' },
            { header: 'CRS Advantage', key: 'crsAdvantage' },
            { header: 'Job Demand', key: 'jobDemand' },
            { header: 'Cost of Living', key: 'costOfLiving' },
            { header: 'Recommendation', key: 'recommendation' },
          ]}
          data={data.topProvinces.map(province => ({
            rank: province.rank,
            province: province.province,
            pathway: province.pathway,
            crsAdvantage: province.crsAdvantage,
            jobDemand: province.jobDemand,
            costOfLiving: province.costOfLiving,
            recommendation: province.recommendation,
          }))}
        />
      </div>

      <div className="subsection">
        <h3>1.4 High-Level Risk & Reward Overview</h3>
        <Table
          columns={[
            { header: 'Factor', key: 'factor' },
            { header: 'Risk Level', key: 'riskLevel' },
            { header: 'Reward Level', key: 'rewardLevel' },
            { header: 'Mitigation', key: 'mitigation' },
          ]}
          data={data.riskReward.map(row => ({
            factor: row.factor,
            riskLevel: row.riskLevel,
            rewardLevel: row.rewardLevel,
            mitigation: row.mitigation,
          }))}
        />
      </div>
    </div>
  );
}

