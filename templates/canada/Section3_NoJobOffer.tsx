import React from 'react';
import type { NoJobOfferData } from '../types/report-types';
import { SectionHeader } from '../shared/SectionHeader';
import { Table } from '../shared/Table';

interface Props {
  data: NoJobOfferData;
}

export function Section3_NoJobOffer({ data }: Props) {
  return (
    <div className="section no-job-offer">
      <SectionHeader number="3" title="You Can Move to WITHOUT a Job Offer" />

      <div className="subsection">
        <h3>3.1 Concept Overview – &quot;Job-Offer-Free&quot; Migration Pathways</h3>
        <p>{data.conceptOverview}</p>
      </div>

      <div className="subsection">
        <h3>3.2 Canadian Visa Categories & Conditions</h3>

        {data.visaCategories.map((category, index) => (
          <div key={index} className="visa-pathway">
            <div className="visa-pathway-title">
              {category.type === 'Primary' ? 'PRIMARY PATHWAY' : 'SECONDARY PATHWAY'}: {category.name}
            </div>
            
            <p><strong>What It Is:</strong> {category.description}</p>

            {category.estimatedCRS && (
              <div className="card" style={{ marginTop: '12pt', marginBottom: '12pt' }}>
                <h4 style={{ marginTop: 0 }}>Your Estimated CRS Score (Without Job Offer):</h4>
                <table>
                  <tbody>
                    <tr>
                      <td>Age (18–35)</td>
                      <td>+{category.estimatedCRS.age} points</td>
                    </tr>
                    <tr>
                      <td>Education (Bachelor&apos;s)</td>
                      <td>+{category.estimatedCRS.education} points</td>
                    </tr>
                    <tr>
                      <td>Language (CLB 8, estimated)</td>
                      <td>+{category.estimatedCRS.language} points</td>
                    </tr>
                    <tr>
                      <td>Work experience (4 years)</td>
                      <td>+{category.estimatedCRS.workExperience} points</td>
                    </tr>
                    <tr>
                      <td>Spouse/Partner</td>
                      <td>+{category.estimatedCRS.spouse} points</td>
                    </tr>
                    <tr style={{ fontWeight: 600, background: '#EBF5FF' }}>
                      <td>SUBTOTAL</td>
                      <td>~{category.estimatedCRS.subtotal} points</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {category.cutOffScores && (
              <p><strong>Current Cut-Off Scores:</strong> {category.cutOffScores}</p>
            )}

            {category.improvements && category.improvements.length > 0 && (
              <>
                <p><strong>How to Improve Your CRS Score:</strong></p>
                <ul>
                  {category.improvements.map((improvement, idx) => (
                    <li key={idx}>
                      <strong>{improvement.action}:</strong> {improvement.boost}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {category.options && category.options.length > 0 && (
              <>
                <p><strong>Top Provincial Programs for You:</strong></p>
                {category.options.map((option, optIdx) => (
                  <div key={optIdx} className="card" style={{ marginTop: '12pt', marginBottom: '12pt' }}>
                    <h4 style={{ color: '#0066CC', marginTop: 0 }}>
                      OPTION {optIdx + 1}: {option.name}
                    </h4>
                    <p style={{ marginBottom: '8pt' }}><strong>Province:</strong> {option.province}</p>

                    <p><strong>Key Details:</strong></p>
                    <ul>
                      {option.details.map((detail, dIdx) => (
                        <li key={dIdx}>{detail}</li>
                      ))}
                    </ul>

                    <p><strong>CRS Bonus:</strong> {option.crsBonus}</p>

                    {option.advantages.length > 0 && (
                      <>
                        <p><strong>Advantages:</strong></p>
                        <ul>
                          {option.advantages.map((adv, aIdx) => (
                            <li key={aIdx}>{adv}</li>
                          ))}
                        </ul>
                      </>
                    )}

                    {option.process.length > 0 && (
                      <>
                        <p><strong>Process:</strong></p>
                        <ol>
                          {option.process.map((step, sIdx) => (
                            <li key={sIdx}>{step}</li>
                          ))}
                        </ol>
                      </>
                    )}

                    <p><strong>Timeline:</strong> {option.timeline}</p>

                    {option.disadvantages && option.disadvantages.length > 0 && (
                      <>
                        <p><strong>Disadvantages:</strong></p>
                        <ul>
                          {option.disadvantages.map((dis, dIdx) => (
                            <li key={dIdx}>{dis}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        ))}
      </div>

      <div className="subsection">
        <h3>3.3 Comparative Summary – Ease, Timelines, Long-Term PR Options</h3>
        <Table
          columns={[
            { header: 'Pathway', key: 'pathway' },
            { header: 'Timeline', key: 'timeline' },
            { header: 'Ease', key: 'ease' },
            { header: 'Job Offer Required', key: 'jobOfferRequired' },
            { header: 'Cost', key: 'cost' },
            { header: 'Long-Term PR', key: 'longTermPR' },
            { header: 'Recommendation', key: 'recommendation' },
          ]}
          data={data.comparativeSummary.map(row => ({
            pathway: row.pathway,
            timeline: row.timeline,
            ease: row.ease,
            jobOfferRequired: row.jobOfferRequired,
            cost: row.cost,
            longTermPR: row.longTermPR,
            recommendation: row.recommendation,
          }))}
        />
      </div>
    </div>
  );
}

