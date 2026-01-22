import React from 'react';
import type { NoSponsorData } from '../types/report-types';
import { SectionHeader } from '../shared/SectionHeader';
import { Table } from '../shared/Table';

interface Props {
  data: NoSponsorData;
}

export function Section4_NoSponsor({ data }: Props) {
  return (
    <div className="section no-sponsor">
      <SectionHeader number="4" title="You Can Move to WITHOUT a Sponsor / Employer" />

      <div className="subsection">
        <h3>4.1 Understanding Sponsor-Free / Self-Sponsored Routes</h3>
        <p>{data.concept}</p>

        <h4>Self-Sponsored Routes in Canada:</h4>
        <Table
          columns={[
            { header: 'Route', key: 'route' },
            { header: 'Sponsor Required?', key: 'sponsorRequired' },
            { header: 'Job Offer Required?', key: 'jobOfferRequired' },
            { header: 'Viability for You', key: 'viability' },
          ]}
          data={data.selfSponsoredRoutes.map(route => ({
            route: route.route,
            sponsorRequired: route.sponsorRequired,
            jobOfferRequired: route.jobOfferRequired,
            viability: route.viability,
          }))}
        />
      </div>

      <div className="subsection">
        <h3>4.2 Canada Matrix – No Employer Sponsorship Required</h3>
        {data.matrix.map((item, index) => (
          <div key={index} className="card" style={{ marginBottom: '12pt' }}>
            <h4 style={{ color: '#0066CC', marginTop: 0 }}>{item.option}</h4>
            <p><strong>Type:</strong> {item.type}</p>
            <p>{item.details}</p>
          </div>
        ))}
      </div>

      <div className="subsection">
        <h3>4.3 Long-Term Settlement & Citizenship Pathways</h3>
        <p><strong>PR to Citizenship Timeline:</strong></p>
        <Table
          columns={[
            { header: 'Stage', key: 'stage' },
            { header: 'Duration', key: 'duration' },
            { header: 'Status', key: 'status' },
          ]}
          data={data.settlementPathway.stages.map(stage => ({
            stage: stage.stage,
            duration: stage.duration,
            status: stage.status,
          }))}
        />
      </div>
    </div>
  );
}

