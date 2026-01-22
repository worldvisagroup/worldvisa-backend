import React from 'react';
import type { CanadaTopEmployersData } from '../types/report-types';
import { SectionHeader } from '../shared/SectionHeader';
import { Table } from '../shared/Table';

interface Props {
  data: CanadaTopEmployersData;
}

export function Section6_TopEmployers({ data }: Props) {
  return (
    <div className="section top-employers">
      <SectionHeader number="6" title="Top 20 Target Employers (by Province & Sector)" />

      {data.provinces.map((provinceData, index) => (
        <div key={index} className="subsection">
          <h3>{provinceData.province} / {provinceData.city} – TOP {provinceData.employers.length} TARGET EMPLOYERS</h3>
          <Table
            columns={[
              { header: 'Rank', key: 'rank', align: 'center' },
              { header: 'Company', key: 'company' },
              { header: 'Industry', key: 'industry' },
              { header: 'Salary (CAD)', key: 'salary' },
              { header: 'Visa Sponsorship', key: 'visaSponsorship' },
              { header: 'Why Hire You', key: 'whyHireYou' },
            ]}
            data={provinceData.employers.map(employer => ({
              rank: employer.rank,
              company: employer.company,
              industry: employer.industry,
              salary: employer.salary,
              visaSponsorship: employer.visaSponsorship,
              whyHireYou: employer.whyHireYou,
            }))}
          />
        </div>
      ))}
    </div>
  );
}

