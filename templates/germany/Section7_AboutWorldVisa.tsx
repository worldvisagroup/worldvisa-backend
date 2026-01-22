import React from 'react';
import { SectionHeader } from '../shared/SectionHeader';

export function Section7_AboutWorldVisa() {
  return (
    <div className="section about-worldvisa">
      <SectionHeader number="7" title="About Germany PR & Work Visa with WorldVisa" />

      <div className="subsection">
        <h3 style={{ color: '#22223B', fontSize: '13pt', marginBottom: '10pt' }}>Germany PR Visa Services</h3>
        <div className="card" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '16pt', borderRadius: '8pt' }}>
          <p style={{ marginBottom: '10pt', fontSize: '10pt', lineHeight: '1.6' }}>
            WorldVisa&apos;s Permanent Residency services for Germany provide comprehensive guidance for skilled professionals seeking to immigrate through EU Blue Card and Opportunity Card pathways. Our certified immigration advisors assist with:
          </p>
          <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '10pt', lineHeight: '1.6', listStyleType: 'disc' }}>
            <li style={{ marginBottom: '6pt' }}>Opportunity Card applications and points calculation</li>
            <li style={{ marginBottom: '6pt' }}>EU Blue Card applications for highly skilled professionals</li>
            <li style={{ marginBottom: '6pt' }}>Credential recognition and Anabin database verification</li>
            <li style={{ marginBottom: '6pt' }}>Language test preparation guidance (English B2/German A1)</li>
            <li style={{ marginBottom: '6pt' }}>Document preparation and submission</li>
            <li style={{ marginBottom: '6pt' }}>Application tracking and communication with German authorities</li>
            <li>Settlement support and integration assistance</li>
          </ul>
          <p style={{ marginTop: '12pt', marginBottom: 0, fontSize: '10pt', lineHeight: '1.6', fontWeight: 600, color: '#065F46' }}>
            With a 95% success rate in German visa applications, WorldVisa has helped thousands of tech professionals successfully navigate Germany&apos;s immigration system.
          </p>
        </div>
      </div>

      <div className="subsection" style={{ marginTop: '24pt' }}>
        <h3 style={{ color: '#22223B', fontSize: '13pt', marginBottom: '10pt' }}>Germany Work Visa Services</h3>
        <div className="card" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '16pt', borderRadius: '8pt' }}>
          <p style={{ marginBottom: '10pt', fontSize: '10pt', lineHeight: '1.6' }}>
            WorldVisa offers comprehensive German Work Visa services for professionals seeking employment in Germany:
          </p>
          <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '10pt', lineHeight: '1.6', listStyleType: 'disc' }}>
            <li style={{ marginBottom: '6pt' }}>Skilled Worker Visa applications</li>
            <li style={{ marginBottom: '6pt' }}>EU Blue Card applications (fast-track for highly qualified)</li>
            <li style={{ marginBottom: '6pt' }}>Accelerated Skilled Worker Procedure (4-6 week processing)</li>
            <li style={{ marginBottom: '6pt' }}>ICT (Intra-Corporate Transfer) permits</li>
            <li>Job seeker visa guidance (Opportunity Card)</li>
          </ul>
          <p style={{ marginTop: '12pt', marginBottom: 0, fontSize: '10pt', lineHeight: '1.6' }}>
            Our team coordinates with German employers, handles credential recognition requirements, and ensures compliance with all immigration regulations. Work visas can serve as a pathway to permanent residency through Germany&apos;s integration requirements.
          </p>
        </div>
      </div>
    </div>
  );
}

