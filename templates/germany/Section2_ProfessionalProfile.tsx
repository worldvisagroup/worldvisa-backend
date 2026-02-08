import React from 'react';
import type { GermanyProfessionalProfileData } from '../types/report-types';
import { SectionHeader } from '../shared/SectionHeader';

interface Props {
  data: GermanyProfessionalProfileData;
}

export function Section2_ProfessionalProfile({ data }: Props) {
  return (
    <div className="section page">
      <SectionHeader number="2" title="Your Professional Profile" />

      {/* 2.1 Core Skills */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '4pt' }}>
          2.1 Core Skills &amp; Occupation Mapping (to German Classifications)
        </h3>
        <p style={{ fontSize: '12pt', color: '#4B5563', marginTop: 0, marginBottom: '6pt' }}>
          Your profile maps to <strong style={{ color: '#111827' }}>two primary German occupation categories:</strong>
        </p>

        {/* Primary Role */}
        <div style={{ borderLeft: '3pt solid #1B2A4A', paddingLeft: '10pt', marginBottom: '8pt', backgroundColor: '#F8F9FB', padding: '8pt 10pt 8pt 12pt' }}>
          <p style={{ fontSize: '12pt', fontWeight: 600, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
            Primary: {data.coreSkills.primaryRole.title}
          </p>
          <ul style={{ margin: 0, paddingLeft: '14pt' }}>
            {data.coreSkills.primaryRole.responsibilities.map((resp, index) => (
              <li key={index} style={{ fontSize: '12pt', color: '#4B5563', marginBottom: '2pt' }}>{resp}</li>
            ))}
          </ul>
        </div>

        {/* Secondary Role */}
        <div style={{ borderLeft: '3pt solid #2563EB', paddingLeft: '10pt', marginBottom: '8pt', backgroundColor: '#F8F9FB', padding: '8pt 10pt 8pt 12pt' }}>
          <p style={{ fontSize: '12pt', fontWeight: 600, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
            Secondary: {data.coreSkills.secondaryRole.title}
          </p>
          <ul style={{ margin: 0, paddingLeft: '14pt' }}>
            {data.coreSkills.secondaryRole.responsibilities.map((resp, index) => (
              <li key={index} style={{ fontSize: '12pt', color: '#4B5563', marginBottom: '2pt' }}>{resp}</li>
            ))}
          </ul>
        </div>

        {/* Verdict */}
        <div style={{ borderLeft: '3pt solid #059669', backgroundColor: '#F0FDF4', padding: '6pt 10pt', marginBottom: '6pt' }}>
          <p style={{ fontSize: '12pt', color: '#111827', margin: 0 }}>
            <strong>Verdict:</strong> <span style={{ color: '#4B5563' }}>{data.coreSkills.verdict}</span>
          </p>
        </div>
      </div>

      {/* 2.2 Experience */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '4pt' }}>
          2.2 Years of Experience &amp; Seniority Level
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8F9FB' }}>
              <th style={{ padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' }}>Metric</th>
              <th style={{ padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' }}>Your Profile</th>
            </tr>
          </thead>
          <tbody>
            {data.experience.map((exp, index) => (
              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                <td style={{ padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#374151', fontWeight: 600 }}>{exp.metric}</td>
                <td style={{ padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#4B5563' }}>{exp.yourProfile}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 2.3 Language & Education */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '4pt' }}>
          2.3 Language Proficiency &amp; Education Level
        </h3>

        {/* English Proficiency */}
        <p style={{ fontSize: '12pt', fontWeight: 600, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          English Language Proficiency
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt', marginBottom: '8pt' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8F9FB' }}>
              <th style={{ padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' }}>Requirement</th>
              <th style={{ padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' }}>Status</th>
              <th style={{ padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' }}>Action Needed</th>
            </tr>
          </thead>
          <tbody>
            {data.languageAndEducation.englishProficiency.map((lang, index) => (
              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                <td style={{ padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#374151' }}>{lang.requirement}</td>
                <td style={{ padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#374151' }}>{lang.status}</td>
                <td style={{ padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#4B5563' }}>{lang.actionNeeded}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* German Note */}
        <div style={{ borderLeft: '3pt solid #1B2A4A', backgroundColor: '#F8F9FB', padding: '6pt 10pt', marginBottom: '8pt' }}>
          <p style={{ fontSize: '12pt', color: '#111827', margin: 0 }}>
            <strong>German Language Note:</strong> <span style={{ color: '#4B5563' }}>{data.languageAndEducation.germanNote}</span>
          </p>
        </div>

        {/* Education */}
        <p style={{ fontSize: '12pt', fontWeight: 600, color: '#111827', marginBottom: '4pt', marginTop: 0 }}>
          Education Level
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8F9FB' }}>
              <th style={{ padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' }}>Qualification</th>
              <th style={{ padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' }}>Details</th>
              <th style={{ padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' }}>Germany Recognition</th>
              <th style={{ padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.languageAndEducation.education.map((edu, index) => (
              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                <td style={{ padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#374151', fontWeight: 600 }}>{edu.qualification}</td>
                <td style={{ padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#4B5563' }}>{edu.details}</td>
                <td style={{ padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#4B5563' }}>{edu.germanyRecognition}</td>
                <td style={{ padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#374151' }}>{edu.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
