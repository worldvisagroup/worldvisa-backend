import React from 'react';
import type { VisaPathwaysData } from '../types/report-types';
import { SectionHeader } from './shared/SectionHeader';

interface Props {
  data: VisaPathwaysData;
}

export function Section3_VisaPathways({ data }: Props) {
  return (
    <div className="section page">
      <SectionHeader number="3" title="Your Key Australian Skilled Migration Pathways" />

      {/* Concept Overview */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          3.1 Concept Overview
        </h3>
        <p style={{ fontSize: '12pt', color: '#4B5563', lineHeight: '1.6', margin: 0 }}>
          {data.conceptOverview}
        </p>
      </div>

      {/* Visa Pathways */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          3.2 Visa Routes
        </h3>

        {data.pathways.map((pathway, index) => (
          <div
            key={index}
            style={{
              borderLeft: '3pt solid #1B2A4A',
              padding: '8pt 10pt',
              marginBottom: '12pt',
              background: '#F8F9FB',
              pageBreakInside: 'avoid'
            }}
          >
            {/* Pathway Header */}
            <div style={{ marginBottom: '6pt' }}>
              <span style={{ fontSize: '12pt', fontWeight: 700, color: '#111827' }}>
                {pathway.name}
              </span>
              <span style={{ fontSize: '12pt', color: '#2563EB', fontWeight: 600, marginLeft: '8pt' }}>
                {pathway.subclass}
              </span>
            </div>

            {/* Key Info Grid - 2 columns */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt', marginBottom: '6pt' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', fontWeight: 600, color: '#111827', width: '25%' }}>
                    Points Requirement
                  </td>
                  <td style={{ padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', color: '#4B5563', width: '25%' }}>
                    {pathway.pointsRequirement}
                  </td>
                  <td style={{ padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', fontWeight: 600, color: '#111827', width: '25%' }}>
                    Age Requirement
                  </td>
                  <td style={{ padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', color: '#4B5563', width: '25%' }}>
                    {pathway.ageRequirement}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', fontWeight: 600, color: '#111827' }}>
                    Employer Sponsorship
                  </td>
                  <td style={{ padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', color: '#4B5563' }}>
                    {pathway.employerSponsorship}
                  </td>
                  <td style={{ padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', fontWeight: 600, color: '#111827' }}>
                    State Sponsorship
                  </td>
                  <td style={{ padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', color: '#4B5563' }}>
                    {pathway.stateSponsorship}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', fontWeight: 600, color: '#111827' }}>
                    Processing Time
                  </td>
                  <td style={{ padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', color: '#4B5563' }}>
                    {pathway.processingTime}
                  </td>
                  <td style={{ padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', fontWeight: 600, color: '#111827' }}>
                    Pathway
                  </td>
                  <td style={{ padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', color: '#4B5563' }}>
                    {pathway.pathway}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Duration & PR Pathway for 491 */}
            {pathway.duration && (
              <p style={{ fontSize: '12pt', color: '#4B5563', margin: '0 0 4pt 0', lineHeight: '1.5' }}>
                <strong style={{ color: '#111827' }}>Duration:</strong> {pathway.duration}
                {pathway.prPathway && (
                  <span> | <strong style={{ color: '#111827' }}>PR Pathway:</strong> {pathway.prPathway}</span>
                )}
              </p>
            )}

            {/* Key Requirements */}
            {pathway.keyRequirements && pathway.keyRequirements.length > 0 && (
              <div style={{ marginBottom: '4pt' }}>
                <p style={{ fontSize: '12pt', fontWeight: 600, color: '#111827', margin: '0 0 3pt 0' }}>
                  Key Requirements:
                </p>
                <ul style={{ fontSize: '12pt', color: '#4B5563', margin: 0, paddingLeft: '14pt', lineHeight: '1.5' }}>
                  {pathway.keyRequirements.map((req, reqIndex) => (
                    <li key={reqIndex} style={{ marginBottom: '2pt' }}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Key States */}
            {pathway.keyStates && pathway.keyStates.length > 0 && (
              <div style={{ marginBottom: '4pt' }}>
                <p style={{ fontSize: '12pt', fontWeight: 600, color: '#111827', margin: '0 0 3pt 0' }}>
                  Key States Actively Nominating:
                </p>
                <ul style={{ fontSize: '12pt', color: '#4B5563', margin: 0, paddingLeft: '14pt' }}>
                  {pathway.keyStates.map((state, stateIndex) => (
                    <li key={stateIndex} style={{ marginBottom: '2pt' }}>{state}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Key Advantage */}
            {pathway.keyAdvantage && (
              <p style={{ fontSize: '12pt', color: '#059669', margin: '0 0 4pt 0', lineHeight: '1.5' }}>
                <strong>Key Advantage:</strong> {pathway.keyAdvantage}
              </p>
            )}

            {/* Additional Info */}
            {pathway.additionalInfo && (
              <p style={{ fontSize: '12pt', color: '#9CA3AF', margin: '0 0 4pt 0', lineHeight: '1.5', fontStyle: 'italic' }}>
                {pathway.additionalInfo}
              </p>
            )}

            {/* Why Suitable */}
            <div style={{ borderLeft: '2pt solid #059669', paddingLeft: '8pt', marginTop: '4pt' }}>
              <p style={{ fontSize: '12pt', margin: 0, lineHeight: '1.5' }}>
                <strong style={{ color: '#059669' }}>Why Suitable for You:</strong>{' '}
                <span style={{ color: '#4B5563' }}>{pathway.whySuitable}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
