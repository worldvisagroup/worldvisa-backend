import React from 'react';
import type { GermanyProfessionalProfileData } from '../types/report-types';
import { SectionHeader } from '../shared/SectionHeader';
import { Table } from '../shared/Table';

interface Props {
  data: GermanyProfessionalProfileData;
}

export function Section2_ProfessionalProfile({ data }: Props) {
  return (
    <div className="section professional-profile">
      <SectionHeader number="2" title="Your Professional Profile" />

      <div className="subsection" style={{ marginTop: '8pt' }}>
        <h3>2.1 Core Skills & Occupation Mapping (to German Classifications)</h3>
        <p>Your profile maps to <strong>two primary German occupation categories:</strong></p>
        
        <p><strong>Primary: {data.coreSkills.primaryRole.title}</strong></p>
        <ul style={{ marginLeft: '20pt', marginBottom: '12pt' }}>
          {data.coreSkills.primaryRole.responsibilities.map((resp, index) => (
            <li key={index} style={{ marginBottom: '4pt' }}>{resp}</li>
          ))}
        </ul>

        <p><strong>Secondary: {data.coreSkills.secondaryRole.title}</strong></p>
        <ul style={{ marginLeft: '20pt', marginBottom: '12pt' }}>
          {data.coreSkills.secondaryRole.responsibilities.map((resp, index) => (
            <li key={index} style={{ marginBottom: '4pt' }}>{resp}</li>
          ))}
        </ul>

        <p><strong>Verdict:</strong> {data.coreSkills.verdict}</p>
      </div>

      <div className="subsection" style={{ marginTop: '8pt' }}>
        <h3>2.2 Years of Experience & Seniority Level</h3>
        <Table
          columns={[
            { header: 'Metric', key: 'metric' },
            { header: 'Your Profile', key: 'yourProfile' },
          ]}
          data={data.experience.map(exp => ({
            metric: exp.metric,
            yourProfile: exp.yourProfile,
          }))}
        />
      </div>

      <div className="subsection" style={{ marginTop: '8pt' }}>
        <h3>2.3 Language Proficiency & Education Level</h3>
        
        <p><strong>English Language Proficiency</strong></p>
        <Table
          columns={[
            { header: 'Requirement', key: 'requirement' },
            { header: 'Status', key: 'status' },
            { header: 'Action Needed', key: 'actionNeeded' },
          ]}
          data={data.languageAndEducation.englishProficiency.map(lang => ({
            requirement: lang.requirement,
            status: lang.status,
            actionNeeded: lang.actionNeeded,
          }))}
        />

        <p style={{ marginTop: '12pt' }}><strong>German Language Proficiency</strong></p>
        <p>{data.languageAndEducation.germanNote}</p>

        <p style={{ marginTop: '12pt' }}><strong>Education Level</strong></p>
        <Table
          columns={[
            { header: 'Qualification', key: 'qualification' },
            { header: 'Details', key: 'details' },
            { header: 'Germany Recognition', key: 'germanyRecognition' },
            { header: 'Status', key: 'status' },
          ]}
          data={data.languageAndEducation.education.map(edu => ({
            qualification: edu.qualification,
            details: edu.details,
            germanyRecognition: edu.germanyRecognition,
            status: edu.status,
          }))}
        />
      </div>
    </div>
  );
}

