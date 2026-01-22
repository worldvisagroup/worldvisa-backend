import React from 'react';
import type { ExecutiveSummaryData } from '../types/report-types';
import { SectionHeader } from './shared/SectionHeader';

interface Props {
  data: ExecutiveSummaryData;
}

export function Section1_ExecutiveSummary({ data }: Props) {
  return (
    <div className="section executive-summary page">
      <SectionHeader number="1" title="Executive Summary" />

      {/* Purpose */}
      <div className="subsection">
        <h3>1.1 Purpose of This Report</h3>
        <p>{data.purpose}</p>
      </div>

      {/* Why Australia Section */}
      {data.whyAustralia && data.whyAustralia.length > 0 && (
        <div className="subsection">
          <h3>1.2 Why Australia?</h3>
          <ul className="checkmark-list">
            {data.whyAustralia.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Key Highlights */}
      {data.keyHighlights && data.keyHighlights.length > 0 && (
        <div className="subsection">
          <h3>1.3 Key Highlights</h3>
          <div style={{
            background: '#EBF5FF',
            padding: '16pt',
            borderRadius: '8pt',
            borderLeft: '4pt solid #0066CC'
          }}>
            <ul style={{ marginLeft: '20pt', marginBottom: '0' }}>
              {data.keyHighlights.map((highlight, index) => (
                <li key={index} style={{ marginBottom: '8pt', color: '#1F2937' }}>
                  <strong>{highlight}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Profile Strengths */}
      {data.profileStrengths && data.profileStrengths.length > 0 && (
        <div className="subsection">
          <h3>1.4 Your Profile Strengths</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12pt' }}>
            {data.profileStrengths.map((strength, index) => (
              <div
                key={index}
                style={{
                  background: '#F9FAFB',
                  border: '1pt solid #E5E7EB',
                  borderRadius: '6pt',
                  padding: '16pt',
                  display: 'flex',
                  alignItems: 'flex-start'
                }}
              >
                <span style={{ color: '#10B981', fontSize: '16pt', marginRight: '12pt', flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: '10pt', color: '#4B5563', lineHeight: '1.5' }}>
                  {strength}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market Trends */}
      {data.marketTrends && (
        <div className="subsection">
          <h3 style={{ marginBottom: '10pt' }}>1.5 Australian Tech Market Trends</h3>
          <div style={{
            background: '#FFFBEB',
            border: '1pt solid #FCD34D',
            borderRadius: '8pt',
            padding: '16pt',
          }}>
            <p style={{ marginBottom: '0', fontSize: '11pt', lineHeight: '1.6' }}>
              📈 <strong>Market Insight:</strong> {data.marketTrends}
            </p>
          </div>
        </div>
      )}

      {/* Top Visa Pathways */}
      <div className="subsection">
        <h3>1.6 Top Visa Pathways for Australia (Without Job Offer)</h3>
        <p style={{ marginBottom: '16pt', color: '#6B7280', fontSize: '10pt' }}>
          These are the primary skilled migration pathways available to you based on your profile:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '16pt' }}>
          {data.topVisaPathways.map((pathway, index) => (
            <div
              key={index}
              style={{
                background: 'linear-gradient(135deg, #F9FAFB 0%, #FFFFFF 100%)',
                border: '1pt solid #E5E7EB',
                borderLeft: '4pt solid #0066CC',
                borderRadius: '6pt',
                padding: '16pt',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12pt',
                pageBreakInside: 'avoid',
                breakInside: 'avoid'
              }}
            >
              {/* Number badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36pt',
                height: '36pt',
                background: '#0066CC',
                color: '#FFFFFF',
                borderRadius: '50%',
                fontSize: '16pt',
                fontWeight: '700',
                flexShrink: 0
              }}>
                {index + 1}
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12pt' }}>
                  <strong style={{ fontSize: '13pt', color: '#1F2937' }}>
                    {pathway.name}
                  </strong>
                  <span style={{
                    marginLeft: '12pt',
                    background: '#DBEAFE',
                    color: '#1E40AF',
                    padding: '3pt 10pt',
                    borderRadius: '12pt',
                    fontSize: '9pt',
                    fontWeight: '600'
                  }}>
                    Subclass {pathway.subclass}
                  </span>
                </div>
                <p style={{
                  marginBottom: '0',
                  fontSize: '11pt',
                  color: '#4B5563',
                  lineHeight: '1.6'
                }}>
                  {pathway.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

