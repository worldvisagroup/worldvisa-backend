import React from 'react';
import type { TopEmployersData } from '../types/report-types';
import { SectionHeader } from './shared/SectionHeader';

interface Props {
  data: TopEmployersData;
}

export function Section5_TopEmployers({ data }: Props) {
  return (
    <div className="section top-employers page">
      <SectionHeader number="5" title="Top 20 Target Employers (by Sector, Australia)" />

      <p style={{ fontSize: '11pt', color: '#6B7280', marginBottom: '24pt', lineHeight: '1.6' }}>
        Based on your profile as a Full Stack Developer, these companies represent the best opportunities
        for your skills and experience. They are organized by tier based on fit with your background.
      </p>

      {data.tiers.map((tier, tierIndex) => (
        <div key={tierIndex} className="company-tier">
          {/* Tier Header */}
          <div className="company-tier-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10pt' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32pt',
                height: '32pt',
                background: '#FFFFFF',
                color: '#0066CC',
                borderRadius: '50%',
                fontSize: '16pt',
                fontWeight: '700'
              }}>
                {tierIndex + 1}
              </span>
              <div style={{ flex: 1 }}>
                <div className="company-tier-title">{tier.tierName}</div>
                <div className="company-tier-description">{tier.tierDescription}</div>
              </div>
            </div>
          </div>

          {/* Company Cards in Grid */}
          <ul className="company-list">
            {tier.companies.map((company, companyIndex) => (
              <li key={companyIndex} className="company-item">
                <div>
                  {/* Company Number & Name */}
                  <span style={{
                    display: 'inline-block',
                    width: '24pt',
                    height: '24pt',
                    background: '#0066CC',
                    color: '#FFFFFF',
                    borderRadius: '50%',
                    textAlign: 'center',
                    lineHeight: '24pt',
                    fontSize: '10pt',
                    fontWeight: '700',
                    marginRight: '8pt',
                    verticalAlign: 'middle'
                  }}>
                    {tierIndex * 8 + companyIndex + 1}
                  </span>
                  <span className="company-name">{company.name}</span>
                </div>

                {/* Location Badge */}
                <span className="company-location">
                  📍 {company.location}
                </span>

                {/* Description */}
                <div className="company-description">
                  {company.description}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Why These Companies Section */}
      <div style={{ marginTop: '28pt' }}>
        <div style={{
          background: 'linear-gradient(135deg, #EBF5FF 0%, #DBEAFE 100%)',
          border: '2pt solid #BFDBFE',
          borderRadius: '10pt',
          padding: '20pt'
        }}>
          <h4 style={{
            fontSize: '14pt',
            color: '#0066CC',
            marginTop: '0',
            marginBottom: '16pt',
            display: 'flex',
            alignItems: 'center',
            gap: '8pt'
          }}>
            <span style={{ fontSize: '18pt' }}>💡</span>
            Why These Companies?
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14pt' }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '6pt',
              padding: '12pt',
              border: '1pt solid #E5E7EB'
            }}>
              <p style={{ fontSize: '10pt', fontWeight: '600', color: '#1F2937', marginBottom: '6pt' }}>
                ✓ Actively Hiring
              </p>
              <p style={{ fontSize: '9pt', color: '#4B5563', marginBottom: '0', lineHeight: '1.5' }}>
                {data.whyTheseCompanies.activelyHiring}
              </p>
            </div>

            <div style={{
              background: '#FFFFFF',
              borderRadius: '6pt',
              padding: '12pt',
              border: '1pt solid #E5E7EB'
            }}>
              <p style={{ fontSize: '10pt', fontWeight: '600', color: '#1F2937', marginBottom: '6pt' }}>
                ✓ Sponsor Migrants
              </p>
              <p style={{ fontSize: '9pt', color: '#4B5563', marginBottom: '0', lineHeight: '1.5' }}>
                {data.whyTheseCompanies.sponsorMigrants}
              </p>
            </div>

            <div style={{
              background: '#FFFFFF',
              borderRadius: '6pt',
              padding: '12pt',
              border: '1pt solid #E5E7EB'
            }}>
              <p style={{ fontSize: '10pt', fontWeight: '600', color: '#1F2937', marginBottom: '6pt' }}>
                ✓ Growth Trajectory
              </p>
              <p style={{ fontSize: '9pt', color: '#4B5563', marginBottom: '0', lineHeight: '1.5' }}>
                {data.whyTheseCompanies.growthTrajectory}
              </p>
            </div>

            <div style={{
              background: '#FFFFFF',
              borderRadius: '6pt',
              padding: '12pt',
              border: '1pt solid #E5E7EB'
            }}>
              <p style={{ fontSize: '10pt', fontWeight: '600', color: '#1F2937', marginBottom: '6pt' }}>
                ✓ Your Fit
              </p>
              <p style={{ fontSize: '9pt', color: '#4B5563', marginBottom: '0', lineHeight: '1.5' }}>
                {data.whyTheseCompanies.yourFit}
              </p>
            </div>
          </div>

          <div style={{
            marginTop: '14pt',
            background: '#FFFBEB',
            borderRadius: '6pt',
            padding: '12pt',
            border: '1pt solid #FCD34D'
          }}>
            <p style={{ fontSize: '10pt', marginBottom: '0', lineHeight: '1.6' }}>
              <strong style={{ color: '#92400E' }}>🎓 Learning Opportunity:</strong>{' '}
              <span style={{ color: '#78350F' }}>{data.whyTheseCompanies.learningOpportunity}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

