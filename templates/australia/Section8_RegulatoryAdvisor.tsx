import React from 'react';
import type { RegulatoryAdvisorData } from '../types/report-types';
import { SectionHeader } from './shared/SectionHeader';

const STATIC_REGULATORY_ADVISOR_DATA: RegulatoryAdvisorData = {
  sectionTitle: "Why Use a Regulated Advisor (MARA)",
  maraNumber: "MARA 1800119",
  agentCredentials: [
    "Graduate Diploma in Australian Migration Law",
    "Member of Migration Institute of Australia (MIA)",
    "21+ years experience in skilled migration"
  ],
  successRate: "98% application approval rate",
  yearsOfExperience: "15+ years",
  whatIsMara: {
    heading: "What is MARA?",
    items: [
      "MARA: Migration Agents Registration Authority (Australia's regulatory body)",
      "RCIC: Regulated Canadian Immigration Consultant (for Canada; not applicable here)",
      "For Australia: MARA-registered migration agents are mandatory for most visa services"
    ]
  },
  whyRegulatedAgentsMatter: {
    heading: "Why Regulated Agents Matter",
    reasons: [
      { title: "Legal Authority", description: "Only MARA-registered agents can legally represent you in Australian visa applications" },
      { title: "Accountability", description: "MARA enforces code of conduct; complaints go to MARA (recourse if poor service)" },
      { title: "Professional Standards", description: "Agents must have insurance, professional indemnity, ongoing training" },
      { title: "Error Prevention", description: "Professional agents catch errors that could lead to visa rejection" },
      { title: "Knowledge", description: "Agents stay current on policy changes, processing times, state requirements" },
      { title: "Communication", description: "Agents handle all immigration correspondence; you don't have to decode official jargon" },
      { title: "Peace of Mind", description: "Professional guidance reduces risk and stress" }
    ]
  },
  whatMaraAgentDoes: {
    heading: "What a MARA Agent Does",
    services: [
      "Reviews your eligibility for visa pathways",
      "Advises which visa (189 vs 190 vs 491) best suits your profile",
      "Guides skills assessment (prepares documents, project reports)",
      "Prepares Expression of Interest (EOI) for SkillSelect",
      "Coordinates state sponsorship applications (if needed)",
      "Prepares comprehensive visa application documents",
      "Submits visa application on your behalf",
      "Tracks application progress",
      "Communicates with immigration when they request additional info",
      "Advises on character/health clearance requirements",
      "Available for questions throughout process"
    ]
  }
};

export function Section8_RegulatoryAdvisor() {
  const data = STATIC_REGULATORY_ADVISOR_DATA;

  return (
    <div className="section page">
      <SectionHeader number="8" title={data.sectionTitle} />

      {/* Credentials Summary */}
      <div style={{ borderLeft: '3pt solid #1B2A4A', padding: '8pt 10pt', marginBottom: '20pt', background: '#F8F9FB' }}>
        <div style={{ display: 'flex', gap: '16pt', alignItems: 'center', flexWrap: 'wrap' }}>
          {data.maraNumber && (
            <div>
              <div style={{ fontSize: '10pt', color: '#9CA3AF', textTransform: 'uppercase' }}>MARA Number</div>
              <div style={{ fontSize: '12pt', fontWeight: 700, color: '#111827' }}>{data.maraNumber}</div>
            </div>
          )}
          {data.successRate && (
            <div>
              <div style={{ fontSize: '10pt', color: '#9CA3AF', textTransform: 'uppercase' }}>Success Rate</div>
              <div style={{ fontSize: '12pt', fontWeight: 700, color: '#059669' }}>{data.successRate}</div>
            </div>
          )}
        </div>
        {data.agentCredentials && data.agentCredentials.length > 0 && (
          <div style={{ marginTop: '6pt', paddingTop: '6pt', borderTop: '0.5pt solid #E5E7EB' }}>
            <div style={{ fontSize: '10pt', fontWeight: 600, color: '#111827', marginBottom: '3pt' }}>Professional Credentials:</div>
            {data.agentCredentials.map((cred, idx) => (
              <div key={idx} style={{ fontSize: '12pt', color: '#4B5563', marginBottom: '1pt' }}>
                <span dangerouslySetInnerHTML={{ __html: '&#10003;' }} style={{ color: '#059669', marginRight: '4pt' }} /> {cred}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* What is MARA */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          {data.whatIsMara.heading}
        </h3>
        <ul style={{ margin: 0, paddingLeft: '14pt' }}>
          {data.whatIsMara.items.map((item, idx) => (
            <li key={idx} style={{ fontSize: '12pt', color: '#4B5563', marginBottom: '3pt', lineHeight: '1.4' }}>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Why Regulated Agents Matter */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          {data.whyRegulatedAgentsMatter.heading}
        </h3>
        {data.whyRegulatedAgentsMatter.reasons.map((reason, index) => (
          <div key={index} style={{ marginBottom: '4pt', fontSize: '12pt', lineHeight: '1.4' }}>
            <strong style={{ color: '#111827' }}>{reason.title}:</strong>{' '}
            <span style={{ color: '#4B5563' }}>{reason.description}</span>
          </div>
        ))}
      </div>

      {/* What a MARA Agent Does */}
      <div style={{ marginBottom: '16pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          {data.whatMaraAgentDoes.heading}
        </h3>
        <div style={{ borderLeft: '3pt solid #1B2A4A', padding: '6pt 10pt', background: '#F8F9FB' }}>
          <ul style={{ margin: 0, paddingLeft: '14pt', columns: 2, columnGap: '16pt' }}>
            {data.whatMaraAgentDoes.services.map((service, idx) => (
              <li key={idx} style={{ fontSize: '12pt', color: '#4B5563', marginBottom: '3pt', lineHeight: '1.4' }}>
                {service}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
