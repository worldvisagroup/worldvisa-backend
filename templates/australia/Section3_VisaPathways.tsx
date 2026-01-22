import React from 'react';
import type { VisaPathwaysData } from '../types/report-types';
import { SectionHeader } from './shared/SectionHeader';

interface Props {
  data: VisaPathwaysData;
}

export function Section3_VisaPathways({ data }: Props) {
  return (
    <div className="section visa-pathways page">
      <SectionHeader number="3" title="You Can Move to Without a Job Offer" />

      {/* Concept Overview */}
      <div className="subsection">
        <h3>3.1 Concept Overview – &apos;Job-Offer-Free&apos; Migration Pathways</h3>
        <div style={{
          background: 'linear-gradient(135deg, #EBF5FF 0%, #DBEAFE 100%)',
          border: '1pt solid #BFDBFE',
          borderRadius: '8pt',
          padding: '16pt',
          marginBottom: '20pt'
        }}>
          <p style={{ marginBottom: '0', fontSize: '11pt', lineHeight: '1.5' }}>
            {data.conceptOverview}
          </p>
        </div>
      </div>

      {/* Visa Pathways */}
      <div className="subsection">
        <h3>3.2 Australia-Specific Visa Routes (No Job Offer Required)</h3>
        <p style={{ fontSize: '10pt', color: '#6B7280', marginBottom: '4pt' }}>
          Below are the three main skilled migration pathways available to you. Each has distinct requirements and advantages:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column'}}>
          {data.pathways.map((pathway, index) => (
            <div
              key={index}
              style={{
                background: '#FFFFFF',
                border: '2pt solid #E5E7EB',
                borderRadius: '10pt',
                padding: '16pt',
                marginTop: index === 0 ? '0' : '40pt',
                marginBottom: '0',
                pageBreakInside: 'avoid'
              }}
            >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '12pt',
              paddingBottom: '12pt',
              borderBottom: '2pt solid #E5E7EB'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32pt',
                height: '32pt',
                background: '#0066CC',
                color: '#FFFFFF',
                borderRadius: '50%',
                fontSize: '16pt',
                fontWeight: '700',
                marginRight: '12pt',
                flexShrink: 0
              }}>
                {String.fromCharCode(65 + index)}
              </div>

              <div style={{ flex: 1 }}>
                <h4 style={{
                  fontSize: '15pt',
                  fontWeight: '700',
                  color: '#1F2937',
                  marginBottom: '4pt',
                  marginTop: '0'
                }}>
                  {pathway.name}
                </h4>
                <div style={{ display: 'flex', gap: '8pt', alignItems: 'center' }}>
                  <span style={{
                    background: '#DBEAFE',
                    color: '#1E40AF',
                    padding: '3pt 10pt',
                    borderRadius: '12pt',
                    fontSize: '9pt',
                    fontWeight: '600'
                  }}>
                    Subclass {pathway.subclass}
                  </span>
                  <span style={{
                    background: '#D1FAE5',
                    color: '#065F46',
                    padding: '3pt 10pt',
                    borderRadius: '12pt',
                    fontSize: '9pt',
                    fontWeight: '600'
                  }}>
                    Permanent Residency
                  </span>
                </div>
              </div>
            </div>

            {/* Requirements Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12pt',
              marginBottom: '12pt',
              alignItems: 'stretch'
            }}>
              <div style={{
                background: '#F9FAFB',
                padding: '10pt',
                borderRadius: '6pt',
                border: '1pt solid #E5E7EB'
              }}>
                <p style={{ fontSize: '9pt', color: '#6B7280', marginBottom: '4pt', fontWeight: '600' }}>
                  Points Requirement
                </p>
                <p style={{ fontSize: '12pt', fontWeight: '700', color: '#0066CC', marginBottom: '0' }}>
                  {pathway.pointsRequirement}
                </p>
              </div>

              <div style={{
                background: '#F9FAFB',
                padding: '10pt',
                borderRadius: '6pt',
                border: '1pt solid #E5E7EB'
              }}>
                <p style={{ fontSize: '9pt', color: '#6B7280', marginBottom: '4pt', fontWeight: '600' }}>
                  Age Requirement
                </p>
                <p style={{ fontSize: '12pt', fontWeight: '700', color: '#0066CC', marginBottom: '0' }}>
                  {pathway.ageRequirement}
                </p>
              </div>

              <div style={{
                background: '#F9FAFB',
                padding: '10pt',
                borderRadius: '6pt',
                border: '1pt solid #E5E7EB'
              }}>
                <p style={{ fontSize: '9pt', color: '#6B7280', marginBottom: '4pt', fontWeight: '600' }}>
                  Employer Sponsorship
                </p>
                <p style={{ fontSize: '12pt', fontWeight: '700', color: '#0066CC', marginBottom: '0' }}>
                  {pathway.employerSponsorship}
                </p>
              </div>

              <div style={{
                background: '#F9FAFB',
                padding: '10pt',
                borderRadius: '6pt',
                border: '1pt solid #E5E7EB'
              }}>
                <p style={{ fontSize: '9pt', color: '#6B7280', marginBottom: '4pt', fontWeight: '600' }}>
                  State Sponsorship
                </p>
                <p style={{ fontSize: '12pt', fontWeight: '700', color: '#0066CC', marginBottom: '0' }}>
                  {pathway.stateSponsorship}
                </p>
              </div>
            </div>

            {/* Key Requirements */}
            {pathway.keyRequirements && pathway.keyRequirements.length > 0 && (
              <div style={{ marginBottom: '12pt' }}>
                <p style={{ fontSize: '10pt', fontWeight: '600', color: '#1F2937', marginBottom: '6pt' }}>
                  ✓ Key Requirements:
                </p>
                <ul style={{
                  fontSize: '10pt',
                  color: '#4B5563',
                  marginLeft: '20pt',
                  marginBottom: '0',
                  lineHeight: '1.6'
                }}>
                  {pathway.keyRequirements.map((req, reqIndex) => (
                    <li key={reqIndex} style={{ marginBottom: '4pt' }}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Key States */}
            {pathway.keyStates && pathway.keyStates.length > 0 && (
              <div style={{ marginBottom: '12pt' }}>
                <p style={{ fontSize: '10pt', fontWeight: '600', color: '#1F2937', marginBottom: '6pt' }}>
                  Key States Actively Nominating:
                </p>
                <ul style={{ fontSize: '10pt', color: '#4B5563', marginLeft: '20pt', marginBottom: '0' }}>
                  {pathway.keyStates.map((state, stateIndex) => (
                    <li key={stateIndex} style={{ marginBottom: '4pt' }}>{state}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Additional Info for 491 */}
            {pathway.duration && (
              <div style={{
                background: '#FEF3C7',
                border: '1pt solid #FCD34D',
                borderRadius: '6pt',
                padding: '10pt',
                marginBottom: '12pt'
              }}>
                <p style={{ fontSize: '10pt', marginBottom: '4pt' }}>
                  <strong>Duration:</strong> {pathway.duration}
                </p>
                {pathway.prPathway && (
                  <p style={{ fontSize: '10pt', marginBottom: '0' }}>
                    <strong>PR Pathway:</strong> {pathway.prPathway}
                  </p>
                )}
              </div>
            )}

            {/* Processing Time & Pathway */}
            <div style={{ marginBottom: '12pt' }}>
              <div style={{ marginBottom: '8pt' }}>
                <p style={{ fontSize: '9pt', color: '#6B7280', marginBottom: '4pt' }}>
                  Processing Time:
                </p>
                <p style={{ fontSize: '11pt', fontWeight: '600', color: '#1F2937', marginBottom: '0' }}>
                  {pathway.processingTime}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '9pt', color: '#6B7280', marginBottom: '4pt' }}>
                  Application Pathway:
                </p>
                <p style={{ fontSize: '11pt', fontWeight: '600', color: '#1F2937', marginBottom: '0' }}>
                  {pathway.pathway}
                </p>
              </div>
            </div>

            {/* Why Suitable */}
            <div style={{
              background: '#EBF5FF',
              borderLeft: '4pt solid #0066CC',
              borderRadius: '6pt',
              padding: '12pt'
            }}>
              <p style={{ fontSize: '10pt', marginBottom: '0', lineHeight: '1.6' }}>
                <strong style={{ color: '#0066CC' }}>Why Suitable for You:</strong>{' '}
                <span style={{ color: '#1F2937' }}>{pathway.whySuitable}</span>
              </p>
            </div>
          </div>
          ))}
        </div>
      </div>
    </div>
  );
}

