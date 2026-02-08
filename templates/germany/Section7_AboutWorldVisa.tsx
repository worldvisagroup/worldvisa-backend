import React from 'react';
import { SectionHeader } from '../shared/SectionHeader';

export function Section7_AboutWorldVisa() {
  return (
    <div className="section page">
      <SectionHeader number="7" title="About Germany PR & Work Visa with WorldVisa" />

      {/* Germany PR Visa Services */}
      <div style={{ marginBottom: '12pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          Germany PR Visa Services
        </h3>
        <div style={{ borderLeft: '3pt solid #1B2A4A', padding: '8pt 10pt', background: '#F8F9FB' }}>
          <p style={{ fontSize: '12pt', color: '#4B5563', marginBottom: '6pt', lineHeight: '1.5', marginTop: 0 }}>
            WorldVisa's Permanent Residency services for Germany provide comprehensive guidance for skilled professionals seeking to immigrate through EU Blue Card and Opportunity Card pathways. Our certified immigration advisors assist with:
          </p>
          <ul style={{ margin: 0, paddingLeft: '14pt', fontSize: '12pt', color: '#4B5563', lineHeight: '1.4' }}>
            <li style={{ marginBottom: '2pt' }}>Opportunity Card applications and points calculation</li>
            <li style={{ marginBottom: '2pt' }}>EU Blue Card applications for highly skilled professionals</li>
            <li style={{ marginBottom: '2pt' }}>Credential recognition and Anabin database verification</li>
            <li style={{ marginBottom: '2pt' }}>Language test preparation guidance (English B2/German A1)</li>
            <li style={{ marginBottom: '2pt' }}>Document preparation and submission</li>
            <li style={{ marginBottom: '2pt' }}>Application tracking and communication with German authorities</li>
            <li>Settlement support and integration assistance</li>
          </ul>
          <p style={{ fontSize: '12pt', color: '#059669', marginTop: '6pt', marginBottom: 0, fontWeight: 600, lineHeight: '1.5' }}>
            With a 95% success rate in German visa applications, WorldVisa has helped thousands of tech professionals successfully navigate Germany's immigration system.
          </p>
        </div>
      </div>

      {/* Germany Work Visa Services */}
      <div style={{ marginBottom: '6pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          Germany Work Visa Services
        </h3>
        <div style={{ borderLeft: '3pt solid #1B2A4A', padding: '8pt 10pt', background: '#F8F9FB' }}>
          <p style={{ fontSize: '12pt', color: '#4B5563', marginBottom: '6pt', lineHeight: '1.5', marginTop: 0 }}>
            WorldVisa offers comprehensive German Work Visa services for professionals seeking employment in Germany:
          </p>
          <ul style={{ margin: 0, paddingLeft: '14pt', fontSize: '12pt', color: '#4B5563', lineHeight: '1.4' }}>
            <li style={{ marginBottom: '2pt' }}>Skilled Worker Visa applications</li>
            <li style={{ marginBottom: '2pt' }}>EU Blue Card applications (fast-track for highly qualified)</li>
            <li style={{ marginBottom: '2pt' }}>Accelerated Skilled Worker Procedure (4-6 week processing)</li>
            <li style={{ marginBottom: '2pt' }}>ICT (Intra-Corporate Transfer) permits</li>
            <li>Job seeker visa guidance (Opportunity Card)</li>
          </ul>
          <p style={{ fontSize: '12pt', color: '#4B5563', marginTop: '6pt', marginBottom: 0, lineHeight: '1.5' }}>
            Our team coordinates with German employers, handles credential recognition requirements, and ensures compliance with all immigration regulations. Work visas can serve as a pathway to permanent residency through Germany's integration requirements.
          </p>
        </div>
      </div>
    </div>
  );
}
