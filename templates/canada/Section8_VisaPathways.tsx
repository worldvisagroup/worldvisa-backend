import React from 'react';
import type { CanadaVisaPathwaysData } from '../types/report-types';
import { SectionHeader } from '../shared/SectionHeader';
import { Table } from '../shared/Table';

interface Props {
  data: CanadaVisaPathwaysData;
}

export function Section8_VisaPathways({ data }: Props) {
  return (
    <div className="section visa-pathways">
      <SectionHeader number="8" title="Visa Pathways & Migration Strategy (Per Shortlisted Province)" />

      <div className="subsection">
        <h3>8.1 Primary Visa Routes (PR / Work / Hybrid) – Overview</h3>
        <p><strong>VISA ROUTES IN CANADA (COMPARISON):</strong></p>
        <Table
          columns={[
            { header: 'Route', key: 'route' },
            { header: 'Type', key: 'type' },
            { header: 'Processing Time', key: 'processingTime' },
            { header: 'Job Offer', key: 'jobOffer' },
            { header: 'PR Timeline', key: 'prTimeline' },
            { header: 'Cost', key: 'cost' },
            { header: 'Recommendation', key: 'recommendation' },
          ]}
          data={data.overview.map(row => ({
            route: row.route,
            type: row.type,
            processingTime: row.processingTime,
            jobOffer: row.jobOffer,
            prTimeline: row.prTimeline,
            cost: row.cost,
            recommendation: row.recommendation,
          }))}
        />
      </div>

      <div className="subsection">
        <h3>8.2 Eligibility Snapshot – Age, Education, Experience, Language</h3>
        <p><strong>YOUR ELIGIBILITY FOR CANADIAN IMMIGRATION:</strong></p>
        <Table
          columns={[
            { header: 'Criterion', key: 'criterion' },
            { header: 'Requirement', key: 'requirement' },
            { header: 'Your Profile', key: 'yourProfile' },
            { header: 'Status', key: 'status' },
          ]}
          data={data.eligibilitySnapshot.map(row => ({
            criterion: row.criterion,
            requirement: row.requirement,
            yourProfile: row.yourProfile,
            status: row.status,
          }))}
        />
        <p style={{ marginTop: '12pt' }}>
          <strong>OVERALL:</strong> You are in exceptional position for Canadian immigration. 
          All boxes ticked except language test (easily achievable).
        </p>
      </div>

      <div className="subsection">
        <h3>8.3 CRS/Scoring Comparisons (Where Applicable)</h3>
        <p><strong>YOUR COMPREHENSIVE RANKING SYSTEM (CRS) SCORE BREAKDOWN:</strong></p>
        
        {/* Core Human Capital Factors */}
        <div style={{
          background: 'linear-gradient(135deg, #EBF5FF 0%, #DBEAFE 100%)',
          border: '2pt solid #0066CC',
          borderRadius: '8pt',
          padding: '16pt',
          marginBottom: '12pt'
        }}>
          <h4 style={{
            fontSize: '12pt',
            fontWeight: '700',
            color: '#0066CC',
            marginTop: '0',
            marginBottom: '12pt'
          }}>
            CORE HUMAN CAPITAL FACTORS (Max 500 points)
          </h4>
          
          <div style={{ display: 'grid', gap: '8pt' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#1F2937' }}>✓ Age (21 years, 18–35 range)</span>
              <span style={{ fontWeight: '700', color: '#10B981' }}>+110 points</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#1F2937' }}>✓ Education (Bachelor&apos;s degree)</span>
              <span style={{ fontWeight: '700', color: '#10B981' }}>+133 points</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#1F2937' }}>✓ Language Proficiency (Estimated CLB 8)</span>
              <span style={{ fontWeight: '700', color: '#10B981' }}>+103 points</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#1F2937' }}>✓ Work Experience (4 years)</span>
              <span style={{ fontWeight: '700', color: '#10B981' }}>+80 points</span>
            </div>
            <div style={{
              borderTop: '2pt solid #0066CC',
              marginTop: '8pt',
              paddingTop: '8pt',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: '700', color: '#0066CC' }}>SUBTOTAL</span>
              <span style={{ fontWeight: '700', fontSize: '14pt', color: '#0066CC' }}>426 points</span>
            </div>
          </div>
        </div>

        {/* Additional Factors */}
        <div style={{
          background: '#F9FAFB',
          border: '1pt solid #E5E7EB',
          borderRadius: '8pt',
          padding: '16pt',
          marginBottom: '12pt'
        }}>
          <h4 style={{
            fontSize: '11pt',
            fontWeight: '700',
            color: '#374151',
            marginTop: '0',
            marginBottom: '12pt'
          }}>
            ADDITIONAL FACTORS
          </h4>
          <div style={{ display: 'grid', gap: '6pt' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>Spouse/Partner (not applicable)</span>
              <span style={{ fontWeight: '600', color: '#6B7280' }}>+0 points</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>Arranged Employment (if applicable)</span>
              <span style={{ fontWeight: '600', color: '#F59E0B' }}>+200 points</span>
            </div>
          </div>
        </div>

        {/* Skill Transferability */}
        <div style={{
          background: '#F9FAFB',
          border: '1pt solid #E5E7EB',
          borderRadius: '8pt',
          padding: '16pt',
          marginBottom: '12pt'
        }}>
          <h4 style={{
            fontSize: '11pt',
            fontWeight: '700',
            color: '#374151',
            marginTop: '0',
            marginBottom: '12pt'
          }}>
            SKILL TRANSFERABILITY FACTORS (Max 100 points)
          </h4>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6B7280' }}>Education + Work Experience</span>
            <span style={{ fontWeight: '600', color: '#10B981' }}>+50 points</span>
          </div>
        </div>

        {/* Game Changers */}
        <div style={{
          background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
          border: '2pt solid #F59E0B',
          borderRadius: '8pt',
          padding: '16pt',
          marginBottom: '16pt'
        }}>
          <h4 style={{
            fontSize: '12pt',
            fontWeight: '700',
            color: '#92400E',
            marginTop: '0',
            marginBottom: '12pt',
            display: 'flex',
            alignItems: 'center',
            gap: '8pt'
          }}>
            <span style={{ fontSize: '16pt' }}>🎯</span> GAME CHANGERS (MULTIPLIERS)
          </h4>
          <div style={{ display: 'grid', gap: '8pt' }}>
            <div style={{
              background: 'rgba(255,255,255,0.7)',
              padding: '8pt',
              borderRadius: '4pt',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: '600', color: '#92400E' }}>Option A - Provincial Nomination (PNP)</span>
              <span style={{ fontWeight: '700', fontSize: '14pt', color: '#D97706' }}>+600 points 🌟</span>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.7)',
              padding: '8pt',
              borderRadius: '4pt',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: '600', color: '#92400E' }}>Option B - Job Offer from CA employer</span>
              <span style={{ fontWeight: '700', fontSize: '14pt', color: '#D97706' }}>+200 points</span>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.7)',
              padding: '8pt',
              borderRadius: '4pt',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: '600', color: '#92400E' }}>Option C - French Language Skills</span>
              <span style={{ fontWeight: '700', fontSize: '14pt', color: '#D97706' }}>+50 points</span>
            </div>
          </div>
        </div>

        <p><strong>TOTAL CRS SCENARIOS:</strong></p>
        <Table
          columns={[
            { header: 'Scenario', key: 'scenario' },
            { header: 'Points', key: 'points' },
            { header: 'Competitive?', key: 'competitive' },
          ]}
          data={data.crsScoring.scenarios.map(scenario => ({
            scenario: scenario.scenario,
            points: scenario.points,
            competitive: scenario.competitive,
          }))}
        />

        <p style={{ marginTop: '12pt' }}><strong>STRATEGY TO IMPROVE YOUR CRS SCORE:</strong></p>
        <p>Current Situation: CRS ~426 points (borderline for Express Entry alone)</p>
        
        <p><strong>Improvement Actions (Pick 1–2):</strong></p>
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>CRS Boost</th>
            </tr>
          </thead>
          <tbody>
            {data.crsScoring.improvements.map((improvement, index) => (
              <tr key={index}>
                <td>{improvement.action}</td>
                <td>{improvement.boost}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="card" style={{ marginTop: '12pt' }}>
          <p><strong>BEST STRATEGY:</strong></p>
          <p>{data.crsScoring.bestStrategy}</p>
        </div>
      </div>

      <div className="subsection">
        <h3>8.4 PR vs Temporary vs Work Permit Routes</h3>
        <p><strong>CANADIAN VISA STATUS COMPARISON:</strong></p>
        <Table
          columns={[
            { header: 'Status', key: 'status' },
            { header: 'Processing', key: 'processing' },
            { header: 'Duration', key: 'duration' },
            { header: 'Work Permit', key: 'workPermit' },
            { header: 'Change Jobs', key: 'changeJobs' },
            { header: 'PR Pathway', key: 'prPathway' },
            { header: 'Recommendation', key: 'recommendation' },
          ]}
          data={data.statusComparison.map(row => ({
            status: row.status,
            processing: row.processing,
            duration: row.duration,
            workPermit: row.workPermit,
            changeJobs: row.changeJobs,
            prPathway: row.prPathway,
            recommendation: row.recommendation,
          }))}
        />
      </div>
    </div>
  );
}

