import React from 'react';
import type { TimelineData } from '../types/report-types';
import { SectionHeader } from './shared/SectionHeader';

const STATIC_TIMELINE_DATA: TimelineData = {
  pathwayName: "End-to-End Timeline per Country (Application to Landing)",
  phases: [
    {
      phaseName: "Month 0-1: Initial Preparation",
      duration: "Around 1 month",
      steps: [
        "Appear for an English language test (IELTS or PTE)",
        "Collect essential personal, educational, and work-related documents",
        "Consult and engage a registered migration professional if required"
      ]
    },
    {
      phaseName: "Month 1-2: Skills Assessment",
      duration: "6-8 weeks",
      steps: [
        "Submit skills assessment application with the relevant assessing authority",
        "Provide additional documents if requested",
        "Receive the skills assessment outcome"
      ]
    },
    {
      phaseName: "Month 2-3: Expression of Interest (EOI)",
      duration: "Up to 1 month",
      steps: [
        "Create and submit an Expression of Interest (EOI) through SkillSelect",
        "Identify suitable Australian states or territories based on eligibility",
        "Update and optimise the EOI to align with state requirements"
      ]
    },
    {
      phaseName: "Month 3-6: State Nomination Stage",
      duration: "Approximately 3-4 months",
      steps: [
        "EOI is reviewed by the selected state or territory",
        "Additional information or documents may be requested",
        "Receive invitation to apply for state nomination",
        "Submit the state nomination application",
        "State assesses the application and issues nomination approval"
      ]
    },
    {
      phaseName: "Month 6-7: Visa Application Submission",
      duration: "2-3 weeks",
      steps: [
        "Receive state nomination confirmation",
        "Apply for the Subclass 190 visa within the given timeframe",
        "Prepare and submit the complete visa application"
      ]
    },
    {
      phaseName: "Month 7-12: Visa Processing & Grant",
      duration: "3-4 months",
      steps: [
        "Application undergoes initial assessment",
        "Background, employment, and character checks are conducted",
        "Complete medical examinations and police clearance",
        "Visa decision and grant notification"
      ]
    }
  ],
  totalTimeline: "Approximately 12-18 months",
  optimisticTimeline: "As early as 10 months",
  pessimisticTimeline: "Up to 20 months, depending on case complexity and processing times"
};

export function Section7_Timeline() {
  const data = STATIC_TIMELINE_DATA;

  return (
    <div className="section page">
      <SectionHeader number="7" title="End-to-End Timeline (Application to Landing)" />

      <div className="timeline">
        {data.phases.map((phase, index) => (
          <div key={index} className="timeline-phase">
            <div className="timeline-phase-name">{phase.phaseName}</div>
            <div className="timeline-phase-duration">{phase.duration}</div>
            <ul className="timeline-steps">
              {phase.steps.map((step, stepIndex) => (
                <li key={stepIndex}>{step}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Timeline Summary */}
      <div style={{ marginTop: '10pt', border: '0.5pt solid #E5E7EB', borderRadius: '4pt', padding: '10pt' }}>
        <h4 style={{ fontSize: '12pt', fontWeight: 700, color: '#111827', marginBottom: '8pt', marginTop: 0, textAlign: 'center' }}>
          Estimated Total Processing Time
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8pt' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10pt', textTransform: 'uppercase', color: '#059669', fontWeight: 700, letterSpacing: '0.04em' }}>Fastest Case</div>
            <div style={{ fontSize: '12pt', fontWeight: 700, color: '#111827', marginTop: '2pt' }}>{data.optimisticTimeline}</div>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '0.5pt solid #E5E7EB', borderRight: '0.5pt solid #E5E7EB' }}>
            <div style={{ fontSize: '10pt', textTransform: 'uppercase', color: '#1B2A4A', fontWeight: 700, letterSpacing: '0.04em' }}>Typical Timeline</div>
            <div style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginTop: '2pt' }}>{data.totalTimeline}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10pt', textTransform: 'uppercase', color: '#D97706', fontWeight: 700, letterSpacing: '0.04em' }}>Complex Cases</div>
            <div style={{ fontSize: '12pt', fontWeight: 700, color: '#111827', marginTop: '2pt' }}>{data.pessimisticTimeline}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
