import React from 'react';
import type { GermanyVisaCategoriesData } from '../types/report-types';
import { SectionHeader } from '../shared/SectionHeader';

interface Props {
  data: GermanyVisaCategoriesData;
}

export function Section3_VisaCategories({ data }: Props) {
  return (
    <div className="section visa-categories">
      <SectionHeader number="3" title="German Visa Categories & Pathways" />

      <div className="subsection" style={{ marginTop: '8pt' }}>
        <h3>3.1 Concept Overview</h3>
        <p>{data.conceptOverview}</p>
      </div>

      <div className="subsection" style={{ marginTop: '8pt' }}>
        <h3>3.2 PRIMARY PATHWAY: {data.opportunityCard.title}</h3>
        
        <div style={{
          background: 'linear-gradient(135deg, #EBF5FF 0%, #DBEAFE 100%)',
          border: '2pt solid #0066CC',
          borderRadius: '8pt',
          padding: '16pt',
          marginBottom: '16pt'
        }}>
          <p><strong>What It Is:</strong></p>
          <p>{data.opportunityCard.description}</p>

          <p style={{ marginTop: '12pt' }}><strong>Advantages:</strong></p>
          <ul style={{ marginLeft: '20pt', marginBottom: '12pt' }}>
            {data.opportunityCard.advantages.map((advantage, index) => (
              <li key={index} style={{ marginBottom: '6pt' }}>{advantage}</li>
            ))}
          </ul>

          <p style={{ marginTop: '12pt' }}>
            <strong>Success Probability:</strong> {data.opportunityCard.successProbability}
          </p>
        </div>
      </div>

      <div className="subsection" style={{ marginTop: '8pt' }}>
        <h3>3.3 SECONDARY PATHWAY: {data.euBlueCard.title}</h3>
        
        <div style={{
          background: '#F9FAFB',
          border: '2pt solid #10B981',
          borderRadius: '8pt',
          padding: '16pt',
          marginBottom: '0'
        }}>
          <p><strong>What It Is:</strong></p>
          <p>{data.euBlueCard.description}</p>

          <p style={{ marginTop: '12pt' }}><strong>Advantages:</strong></p>
          <ul style={{ marginLeft: '20pt', marginBottom: '12pt' }}>
            {data.euBlueCard.advantages.map((advantage, index) => (
              <li key={index} style={{ marginBottom: '6pt' }}>{advantage}</li>
            ))}
          </ul>

          <p style={{ marginTop: '12pt' }}>
            <strong>Success Probability:</strong> {data.euBlueCard.successProbability}
          </p>
        </div>
      </div>
    </div>
  );
}

