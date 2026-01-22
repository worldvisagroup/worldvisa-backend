import React from 'react';
import type { CanadaProfessionalProfileData } from '../types/report-types';
import { SectionHeader } from '../shared/SectionHeader';

interface Props {
  data: CanadaProfessionalProfileData;
}

export function Section2_ProfessionalProfile({ data }: Props) {
  return (
    <div className="section professional-profile">
      <SectionHeader number="2" title="Your Professional Profile" />

      <div className="subsection">
        <h3>2.1 Core Skills & Occupation Mapping (to NOC)</h3>
        <p>Your profile maps to two primary Canadian NOC codes:</p>

        {data.nocCodes.map((noc, index) => (
          <div key={index} className="card" style={{ marginBottom: '16pt' }}>
            <h4 style={{ color: '#0066CC', marginTop: 0 }}>
              {noc.type}: {noc.code} – {noc.title}
            </h4>
            
            <p><strong>Definition:</strong> {noc.definition}</p>

            {noc.alignment.length > 0 && (
              <>
                <p><strong>Your Alignment:</strong></p>
                <ul>
                  {noc.alignment.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </>
            )}

            {noc.credentialMatch.length > 0 && (
              <>
                <p><strong>Credential Match:</strong></p>
                <ul className="checkmark-list">
                  {noc.credentialMatch.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="subsection">
        <h3>2.2 Years of Experience & Seniority Level</h3>
        <table>
          <tbody>
            <tr>
              <td><strong>Total Years</strong></td>
              <td>{data.experienceMetrics.totalYears}</td>
            </tr>
            <tr>
              <td><strong>Current Role</strong></td>
              <td>{data.experienceMetrics.currentRole}</td>
            </tr>
            <tr>
              <td><strong>Seniority Level</strong></td>
              <td>{data.experienceMetrics.seniorityLevel}</td>
            </tr>
            <tr>
              <td><strong>Age</strong></td>
              <td>{data.experienceMetrics.age}</td>
            </tr>
            <tr>
              <td><strong>Age Advantage (CRS)</strong></td>
              <td>{data.experienceMetrics.ageAdvantage}</td>
            </tr>
          </tbody>
        </table>

        <div className="card" style={{ marginTop: '12pt' }}>
          <p><strong>CRS Scoring Advantage:</strong></p>
          <p>{data.experienceMetrics.crsAdvantage}</p>
        </div>
      </div>
    </div>
  );
}

