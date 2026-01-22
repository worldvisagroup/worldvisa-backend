import React from 'react';
import { SectionHeader } from '../shared/SectionHeader';

export function Section9_AboutWorldVisa() {
  return (
    <div className="section about-worldvisa">
      <SectionHeader number="9" title="About Canada PR & Work Visa with WorldVisa" />

      <div className="subsection">
        <h3 style={{ color: '#22223B', fontSize: '13pt', marginBottom: '10pt' }}>Canada PR Visa Services</h3>
        <div className="card" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '16pt', borderRadius: '8pt' }}>
          <p style={{ marginBottom: '10pt', fontSize: '10pt', lineHeight: '1.6' }}>
            WorldVisa&apos;s Permanent Residency (PR) services provide comprehensive guidance for skilled professionals seeking to immigrate to Canada through Express Entry and Provincial Nominee Programs. Our RCIC-certified advisors assist with:
          </p>
          <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '10pt', lineHeight: '1.6', listStyleType: 'disc' }}>
            <li style={{ marginBottom: '6pt' }}>Express Entry profile creation and optimization</li>
            <li style={{ marginBottom: '6pt' }}>Provincial Nominee Program applications (BC PNP, OINP, AAIP)</li>
            <li style={{ marginBottom: '6pt' }}>Educational Credential Assessment (ECA) coordination</li>
            <li style={{ marginBottom: '6pt' }}>Language test preparation guidance (IELTS/PTE/CELPIP)</li>
            <li style={{ marginBottom: '6pt' }}>Document preparation and submission</li>
            <li style={{ marginBottom: '6pt' }}>Application tracking and communication with immigration authorities</li>
            <li>Post-landing settlement support</li>
          </ul>
          <p style={{ marginTop: '12pt', marginBottom: 0, fontSize: '10pt', lineHeight: '1.6', fontWeight: 600, color: '#065F46' }}>
            With a 95% success rate in PR applications, WorldVisa has helped thousands of tech professionals successfully navigate Canada&apos;s complex immigration system.
          </p>
        </div>
      </div>

      <div className="subsection" style={{ marginTop: '24pt' }}>
        <h3 style={{ color: '#22223B', fontSize: '13pt', marginBottom: '10pt' }}>Canada Work Visa Services</h3>
        <div className="card" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '16pt', borderRadius: '8pt' }}>
          <p style={{ marginBottom: '10pt', fontSize: '10pt', lineHeight: '1.6' }}>
            WorldVisa offers comprehensive Work Permit services for professionals seeking to work in Canada temporarily or as a pathway to permanent residency:
          </p>
          <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '10pt', lineHeight: '1.6', listStyleType: 'disc' }}>
            <li style={{ marginBottom: '6pt' }}>Employer-Specific Work Permits (LMIA-based)</li>
            <li style={{ marginBottom: '6pt' }}>Global Talent Stream applications (2-week processing)</li>
            <li style={{ marginBottom: '6pt' }}>Open Work Permits (Post-Graduation Work Permit style)</li>
            <li style={{ marginBottom: '6pt' }}>Intra-Company Transfer Work Permits</li>
            <li>CUSMA/NAFTA professional work permits</li>
          </ul>
          <p style={{ marginTop: '12pt', marginBottom: 0, fontSize: '10pt', lineHeight: '1.6' }}>
            Our team coordinates with Canadian employers, handles Labour Market Impact Assessment (LMIA) applications where required, and ensures compliance with all immigration regulations. Work permits can serve as a bridge to permanent residency through Canadian work experience points in Express Entry.
          </p>
        </div>
      </div>
    </div>
  );
}

