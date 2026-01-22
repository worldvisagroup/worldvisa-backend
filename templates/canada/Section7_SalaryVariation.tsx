import React from 'react';
import type { CanadaSalaryVariationData } from '../types/report-types';
import { SectionHeader } from '../shared/SectionHeader';
import { Table } from '../shared/Table';

interface Props {
  data: CanadaSalaryVariationData;
}

export function Section7_SalaryVariation({ data }: Props) {
  return (
    <div className="section salary-variation">
      <SectionHeader number="7" title="City-wise Salary Variation (Toronto vs Vancouver vs Montreal)" />

      <div className="subsection">
        <h3>SALARY COMPARISON: TORONTO vs VANCOUVER vs MONTREAL</h3>
        {data.cities.map((city, index) => (
          <div key={index}>
            <Table
              columns={[
                { header: 'Factor', key: 'factor' },
                { header: 'Toronto', key: 'toronto' },
                { header: 'Vancouver', key: 'vancouver' },
                { header: 'Montreal', key: 'montreal' },
                { header: 'Winner for You', key: 'winner' },
              ]}
              data={city.factors.map(factor => ({
                factor: factor.factor,
                toronto: factor.toronto,
                vancouver: factor.vancouver,
                montreal: factor.montreal,
                winner: factor.winner,
              }))}
            />
          </div>
        ))}
      </div>

      <div className="subsection">
        <h3>RECOMMENDATION SUMMARY</h3>
        <Table
          columns={[
            { header: 'Priority', key: 'priority' },
            { header: 'Toronto (Ontario)', key: 'toronto' },
            { header: 'Vancouver (BC)', key: 'vancouver' },
            { header: 'Montreal (Quebec)', key: 'montreal' },
          ]}
          data={data.recommendation.priorities.map(priority => ({
            priority: priority.priority,
            toronto: priority.toronto,
            vancouver: priority.vancouver,
            montreal: priority.montreal,
          }))}
        />
      </div>
    </div>
  );
}

