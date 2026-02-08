import React from 'react';
import type { GermanyVisaCategoriesData } from '../types/report-types';
import { SectionHeader } from '../shared/SectionHeader';

interface Props {
  data: GermanyVisaCategoriesData;
}

export function Section3_VisaCategories({ data }: Props) {
  return (
    <div className="section page">
      <SectionHeader number="3" title="German Visa Categories &amp; Pathways" />

      {/* 3.1 Concept Overview */}
      <div style={{ marginBottom: '12pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '4pt' }}>
          3.1 Concept Overview
        </h3>
        <p style={{ fontSize: '12pt', color: '#4B5563', lineHeight: 1.5, marginTop: 0 }}>
          {data.conceptOverview}
        </p>
      </div>

      {/* 3.2 Opportunity Card */}
      <div style={{ marginBottom: '12pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '4pt' }}>
          3.2 Primary Pathway: {data.opportunityCard.title}
        </h3>
        <div style={{ borderLeft: '3pt solid #1B2A4A', backgroundColor: '#F8F9FB', padding: '8pt 10pt 8pt 12pt' }}>
          <p style={{ fontSize: '12pt', fontWeight: 600, color: '#111827', marginBottom: '3pt', marginTop: 0 }}>
            What It Is:
          </p>
          <p style={{ fontSize: '12pt', color: '#4B5563', lineHeight: 1.5, marginTop: 0, marginBottom: '6pt' }}>
            {data.opportunityCard.description}
          </p>

          <p style={{ fontSize: '12pt', fontWeight: 600, color: '#111827', marginBottom: '3pt' }}>
            Advantages:
          </p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, marginBottom: '6pt' }}>
            {data.opportunityCard.advantages.map((advantage, index) => (
              <li key={index} style={{ fontSize: '12pt', color: '#4B5563', marginBottom: '2pt', paddingLeft: '14pt', position: 'relative' as const }}>
                <span style={{ position: 'absolute' as const, left: 0, color: '#059669', fontWeight: 700 }}>&#10003;</span>
                {advantage}
              </li>
            ))}
          </ul>

          <p style={{ fontSize: '12pt', margin: 0 }}>
            <strong style={{ color: '#111827' }}>Success Probability: </strong>
            <span style={{
              display: 'inline-block',
              padding: '1pt 8pt',
              backgroundColor: '#ECFDF5',
              color: '#059669',
              fontSize: '10pt',
              fontWeight: 600,
              borderRadius: '3pt'
            }}>
              {data.opportunityCard.successProbability}
            </span>
          </p>
        </div>
      </div>

      {/* 3.3 EU Blue Card */}
      <div style={{ marginBottom: '8pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '4pt' }}>
          3.3 Secondary Pathway: {data.euBlueCard.title}
        </h3>
        <div style={{ borderLeft: '3pt solid #2563EB', backgroundColor: '#F8F9FB', padding: '8pt 10pt 8pt 12pt' }}>
          <p style={{ fontSize: '12pt', fontWeight: 600, color: '#111827', marginBottom: '3pt', marginTop: 0 }}>
            What It Is:
          </p>
          <p style={{ fontSize: '12pt', color: '#4B5563', lineHeight: 1.5, marginTop: 0, marginBottom: '6pt' }}>
            {data.euBlueCard.description}
          </p>

          <p style={{ fontSize: '12pt', fontWeight: 600, color: '#111827', marginBottom: '3pt' }}>
            Advantages:
          </p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, marginBottom: '6pt' }}>
            {data.euBlueCard.advantages.map((advantage, index) => (
              <li key={index} style={{ fontSize: '12pt', color: '#4B5563', marginBottom: '2pt', paddingLeft: '14pt', position: 'relative' as const }}>
                <span style={{ position: 'absolute' as const, left: 0, color: '#059669', fontWeight: 700 }}>&#10003;</span>
                {advantage}
              </li>
            ))}
          </ul>

          <p style={{ fontSize: '12pt', margin: 0 }}>
            <strong style={{ color: '#111827' }}>Success Probability: </strong>
            <span style={{
              display: 'inline-block',
              padding: '1pt 8pt',
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              fontSize: '10pt',
              fontWeight: 600,
              borderRadius: '3pt'
            }}>
              {data.euBlueCard.successProbability}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
