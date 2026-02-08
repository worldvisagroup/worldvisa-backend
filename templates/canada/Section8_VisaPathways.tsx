import React from 'react';
import type { CanadaVisaPathwaysData } from '../types/report-types';
import { SectionHeader } from '../shared/SectionHeader';

interface Props {
  data: CanadaVisaPathwaysData;
}

const thStyle: React.CSSProperties = {
  padding: '5pt 6pt',
  textAlign: 'left',
  fontWeight: 700,
  fontSize: '12pt',
  color: '#FFFFFF',
  background: '#1B2A4A',
  borderBottom: '1pt solid #E5E7EB',
};

const tdStyle: React.CSSProperties = {
  padding: '4pt 6pt',
  color: '#4B5563',
  borderBottom: '0.5pt solid #E5E7EB',
  lineHeight: '1.4',
  fontSize: '12pt',
};

export function Section8_VisaPathways({ data }: Props) {
  return (
    <div className="section page">
      <SectionHeader number="8" title="Visa Pathways & Migration Strategy (Per Shortlisted Province)" />

      {/* 8.1 Visa Routes Overview */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          8.1 Primary Visa Routes -- Overview
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
          <thead>
            <tr>
              <th style={thStyle}>Route</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Processing Time</th>
              <th style={thStyle}>Job Offer</th>
              <th style={thStyle}>PR Timeline</th>
              <th style={thStyle}>Cost</th>
              <th style={thStyle}>Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {data.overview.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#F8F9FB' }}>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#111827' }}>{row.route}</td>
                <td style={tdStyle}>{row.type}</td>
                <td style={tdStyle}>{row.processingTime}</td>
                <td style={tdStyle}>{row.jobOffer}</td>
                <td style={tdStyle}>{row.prTimeline}</td>
                <td style={tdStyle}>{row.cost}</td>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#059669' }}>{row.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 8.2 Eligibility Snapshot */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          8.2 Eligibility Snapshot
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
          <thead>
            <tr>
              <th style={thStyle}>Criterion</th>
              <th style={thStyle}>Requirement</th>
              <th style={thStyle}>Your Profile</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.eligibilitySnapshot.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#F8F9FB' }}>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#111827' }}>{row.criterion}</td>
                <td style={tdStyle}>{row.requirement}</td>
                <td style={tdStyle}>{row.yourProfile}</td>
                <td style={{
                  ...tdStyle,
                  fontWeight: 600,
                  color: row.status?.toLowerCase().includes('pass') || row.status?.toLowerCase().includes('met') || row.status?.toLowerCase().includes('yes')
                    ? '#059669'
                    : row.status?.toLowerCase().includes('fail') || row.status?.toLowerCase().includes('no')
                      ? '#DC2626'
                      : '#D97706',
                }}>
                  {row.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 8.3 CRS Scoring */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          8.3 CRS / Scoring Comparisons
        </h3>

        {/* CRS Breakdown text */}
        {data.crsScoring.breakdown && (
          <div style={{
            borderLeft: '3pt solid #1B2A4A',
            padding: '6pt 10pt',
            marginBottom: '8pt',
            background: '#F8F9FB',
            fontSize: '12pt',
            color: '#4B5563',
            lineHeight: '1.5',
          }}>
            {data.crsScoring.breakdown}
          </div>
        )}

        {/* CRS Scenarios */}
        {data.crsScoring.scenarios.length > 0 && (
          <div style={{ marginBottom: '8pt' }}>
            <div style={{ fontSize: '12pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '3pt' }}>
              Total CRS Scenarios
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Scenario</th>
                  <th style={thStyle}>Points</th>
                  <th style={thStyle}>Competitive?</th>
                </tr>
              </thead>
              <tbody>
                {data.crsScoring.scenarios.map((scenario, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#F8F9FB' }}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#111827' }}>{scenario.scenario}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#2563EB' }}>{scenario.points}</td>
                    <td style={{
                      ...tdStyle,
                      fontWeight: 600,
                      color: scenario.competitive?.toLowerCase().includes('yes') || scenario.competitive?.toLowerCase().includes('high')
                        ? '#059669'
                        : '#D97706',
                    }}>
                      {scenario.competitive}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CRS Improvements */}
        {data.crsScoring.improvements.length > 0 && (
          <div style={{ marginBottom: '8pt' }}>
            <div style={{ fontSize: '12pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '3pt' }}>
              Strategy to Improve CRS Score
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Action</th>
                  <th style={{ ...thStyle, width: '25%' }}>CRS Boost</th>
                </tr>
              </thead>
              <tbody>
                {data.crsScoring.improvements.map((improvement, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#F8F9FB' }}>
                    <td style={{ ...tdStyle, color: '#111827' }}>{improvement.action}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#059669' }}>{improvement.boost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Best Strategy */}
        {data.crsScoring.bestStrategy && (
          <div style={{
            borderLeft: '3pt solid #1B2A4A',
            padding: '6pt 10pt',
            background: '#F8F9FB',
            marginBottom: '8pt',
          }}>
            <div style={{ fontSize: '12pt', fontWeight: 700, color: '#111827', marginBottom: '2pt' }}>
              Best Strategy
            </div>
            <div style={{ fontSize: '12pt', color: '#4B5563', lineHeight: '1.5' }}>
              {data.crsScoring.bestStrategy}
            </div>
          </div>
        )}
      </div>

      {/* 8.4 Status Comparison */}
      {data.statusComparison.length > 0 && (
        <div style={{ marginBottom: '20pt' }}>
          <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
            8.4 PR vs Temporary vs Work Permit Routes
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
            <thead>
              <tr>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Processing</th>
                <th style={thStyle}>Duration</th>
                <th style={thStyle}>Work Permit</th>
                <th style={thStyle}>Change Jobs</th>
                <th style={thStyle}>PR Pathway</th>
                <th style={thStyle}>Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {data.statusComparison.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#F8F9FB' }}>
                  <td style={{ ...tdStyle, fontWeight: 600, color: '#111827' }}>{row.status}</td>
                  <td style={tdStyle}>{row.processing}</td>
                  <td style={tdStyle}>{row.duration}</td>
                  <td style={tdStyle}>{row.workPermit}</td>
                  <td style={tdStyle}>{row.changeJobs}</td>
                  <td style={tdStyle}>{row.prPathway}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: '#059669' }}>{row.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
