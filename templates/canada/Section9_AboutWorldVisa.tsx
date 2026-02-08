import React from 'react';
import { SectionHeader } from '../shared/SectionHeader';

export function Section9_AboutWorldVisa() {
  return (
    <div className="section page">
      <SectionHeader number="9" title="About Canada PR & Work Visa with WorldVisa" />

      {/* Canada PR Visa Services */}
      <div style={{ marginBottom: '12pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          Canada PR Visa Services
        </h3>
        <div style={{ borderLeft: '3pt solid #1B2A4A', padding: '8pt 10pt', background: '#F8F9FB' }}>
          <p style={{ fontSize: '12pt', color: '#4B5563', marginBottom: '6pt', lineHeight: '1.5', marginTop: 0 }}>
            WorldVisa's Permanent Residency (PR) services provide comprehensive guidance for skilled professionals seeking to immigrate to Canada through Express Entry and Provincial Nominee Programs. Our RCIC-certified advisors assist with:
          </p>
          <ul style={{ margin: 0, paddingLeft: '14pt', fontSize: '12pt', color: '#4B5563', lineHeight: '1.4' }}>
            <li style={{ marginBottom: '2pt' }}>Express Entry profile creation and optimization</li>
            <li style={{ marginBottom: '2pt' }}>Provincial Nominee Program applications (BC PNP, OINP, AAIP)</li>
            <li style={{ marginBottom: '2pt' }}>Educational Credential Assessment (ECA) coordination</li>
            <li style={{ marginBottom: '2pt' }}>Language test preparation guidance (IELTS/PTE/CELPIP)</li>
            <li style={{ marginBottom: '2pt' }}>Document preparation and submission</li>
            <li style={{ marginBottom: '2pt' }}>Application tracking and communication with immigration authorities</li>
            <li>Post-landing settlement support</li>
          </ul>
          <p style={{ fontSize: '12pt', color: '#059669', marginTop: '6pt', marginBottom: 0, fontWeight: 600, lineHeight: '1.5' }}>
            With a 95% success rate in PR applications, WorldVisa has helped thousands of tech professionals successfully navigate Canada's complex immigration system.
          </p>
        </div>
      </div>

      {/* Canada Work Visa Services */}
      <div style={{ marginBottom: '6pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          Canada Work Visa Services
        </h3>
        <div style={{ borderLeft: '3pt solid #1B2A4A', padding: '8pt 10pt', background: '#F8F9FB' }}>
          <p style={{ fontSize: '12pt', color: '#4B5563', marginBottom: '6pt', lineHeight: '1.5', marginTop: 0 }}>
            WorldVisa offers comprehensive Work Permit services for professionals seeking to work in Canada temporarily or as a pathway to permanent residency:
          </p>
          <ul style={{ margin: 0, paddingLeft: '14pt', fontSize: '12pt', color: '#4B5563', lineHeight: '1.4' }}>
            <li style={{ marginBottom: '2pt' }}>Employer-Specific Work Permits (LMIA-based)</li>
            <li style={{ marginBottom: '2pt' }}>Global Talent Stream applications (2-week processing)</li>
            <li style={{ marginBottom: '2pt' }}>Open Work Permits (Post-Graduation Work Permit style)</li>
            <li style={{ marginBottom: '2pt' }}>Intra-Company Transfer Work Permits</li>
            <li>CUSMA/NAFTA professional work permits</li>
          </ul>
          <p style={{ fontSize: '12pt', color: '#4B5563', marginTop: '6pt', marginBottom: 0, lineHeight: '1.5' }}>
            Our team coordinates with Canadian employers, handles Labour Market Impact Assessment (LMIA) applications where required, and ensures compliance with all immigration regulations. Work permits can serve as a bridge to permanent residency through Canadian work experience points in Express Entry.
          </p>
        </div>
      </div>
    </div>
  );
}
