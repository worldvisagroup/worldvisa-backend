import React from 'react';
import type { GermanyCompensationData } from '../types/report-types';
import { SectionHeader } from '../shared/SectionHeader';
import { Table } from '../shared/Table';

interface Props {
  data: GermanyCompensationData;
}

export function Section6_Compensation({ data }: Props) {
  return (
    <div className="section compensation">
      <SectionHeader number="6" title="Compensation Benchmarking" />

      <div className="subsection" style={{ marginTop: '8pt' }}>
        <h3>6.1 Salary Ranges by City & Role Level</h3>
        <Table
          columns={[
            { header: 'Level', key: 'level' },
            { header: 'Location', key: 'location' },
            { header: 'EUR (Annual)', key: 'eurAnnual' },
            { header: 'INR Equivalent', key: 'inrEquivalent' },
          ]}
          data={data.salaryRanges.map(salary => ({
            level: salary.level,
            location: salary.location,
            eurAnnual: salary.eurAnnual,
            inrEquivalent: salary.inrEquivalent,
          }))}
        />
      </div>

      <div className="subsection" style={{ marginTop: '8pt' }}>
        <h3>6.2 City-wise Salary Comparison</h3>
        <Table
          columns={[
            { header: 'Factor', key: 'factor' },
            { header: 'Berlin', key: 'berlin' },
            { header: 'Munich', key: 'munich' },
            { header: 'Frankfurt', key: 'frankfurt' },
            { header: 'Winner', key: 'winner' },
          ]}
          data={data.cityComparison.map(comparison => ({
            factor: comparison.factor,
            berlin: comparison.berlin,
            munich: comparison.munich,
            frankfurt: comparison.frankfurt,
            winner: comparison.winner,
          }))}
        />
      </div>
    </div>
  );
}

