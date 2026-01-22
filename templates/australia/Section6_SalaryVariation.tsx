import React from 'react';
import type { SalaryVariationData } from '../types/report-types';
import { SectionHeader } from './shared/SectionHeader';

interface Props {
  data: SalaryVariationData;
}

export function Section6_SalaryVariation({ data }: Props) {
  // Function to get a percentage width for salary bar visualization
  const getSalaryBarWidth = (salaryRange: string): number => {
    // Extract the max value from the range (e.g., "AUD $140,000 – $165,000" -> 165000)
    const match = salaryRange.match(/\$([0-9,]+)\s*–\s*\$([0-9,]+)/);
    if (match) {
      const maxSalary = parseInt(match[2].replace(/,/g, ''));
      // Normalize to 210000 as max (100%)
      return Math.min((maxSalary / 210000) * 100, 100);
    }
    return 50;
  };

  return (
    <div className="section salary-variation page">
      <SectionHeader number="6" title="City-wise Salary Variation (Capitals vs Tier-2)" />

      <p style={{ fontSize: '11pt', color: '#6B7280', marginBottom: '20pt', lineHeight: '1.6' }}>
        Salary ranges for Full Stack Developers vary significantly across Australian cities.
        This section provides comprehensive compensation data including take-home estimates and living costs.
      </p>

      {data.cities.map((city, index) => (
        <div key={index} className="city-card">
          {/* City Header */}
          <div className="city-card-header">
            <div style={{ flex: 1 }}>
              <h4 className="city-name">{city.cityName}</h4>
              {(city.techHub || city.nicheOpportunity) && (
                <p style={{ fontSize: '9pt', color: '#6B7280', marginTop: '4pt', marginBottom: '0' }}>
                  {city.techHub || city.nicheOpportunity}
                </p>
              )}
            </div>
            <span className="city-icon">🏙️</span>
          </div>

          {/* Salary Ranges */}
          <div style={{ marginBottom: '16pt' }}>
            <div className="salary-range">
              <span className="salary-label">Mid-Level Developer</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10pt' }}>
                <span className="salary-value">{city.midLevelRange}</span>
                {city.premium && (
                  <span style={{
                    background: '#FEF3C7',
                    color: '#92400E',
                    padding: '2pt 8pt',
                    borderRadius: '10pt',
                    fontSize: '8pt',
                    fontWeight: '600'
                  }}>
                    {city.premium}
                  </span>
                )}
              </div>
              <div className="salary-bar">
                <div
                  className="salary-bar-fill"
                  style={{ width: `${getSalaryBarWidth(city.midLevelRange)}%` }}
                />
              </div>
            </div>

            <div className="salary-range">
              <span className="salary-label">Senior Developer</span>
              <span className="salary-value">{city.seniorLevelRange}</span>
              <div className="salary-bar">
                <div
                  className="salary-bar-fill"
                  style={{ width: `${getSalaryBarWidth(city.seniorLevelRange)}%` }}
                />
              </div>
            </div>
          </div>

          {/* City Details Grid */}
          <div className="city-details">
            <div className="city-detail-item">
              <div className="city-detail-label">💰 Tax Rate</div>
              <div className="city-detail-value">{city.taxRate || 'N/A'}</div>
            </div>

            <div className="city-detail-item">
              <div className="city-detail-label">💵 Take-Home</div>
              <div className="city-detail-value" style={{ color: '#10B981' }}>
                {city.takeHomeSalary || 'N/A'}
              </div>
            </div>

            <div className="city-detail-item">
              <div className="city-detail-label">🏠 Housing Cost</div>
              <div className="city-detail-value">{city.housingCost || 'N/A'}</div>
            </div>

            <div className="city-detail-item">
              <div className="city-detail-label">📊 Cost of Living</div>
              <div className="city-detail-value">{city.costOfLiving}</div>
            </div>

            {city.qualityOfLife && (
              <>
                <div className="city-detail-item">
                  <div className="city-detail-label">⭐ Quality of Life</div>
                  <div className="city-detail-value">{city.qualityOfLife}</div>
                </div>
              </>
            )}
          </div>

          {/* Additional Notes */}
          {(city.additionalNotes || city.yourAdvantage) && (
            <div style={{
              marginTop: '12pt',
              background: '#EBF5FF',
              borderRadius: '6pt',
              padding: '10pt'
            }}>
              <p style={{ fontSize: '9pt', color: '#1E40AF', marginBottom: '0', lineHeight: '1.5' }}>
                💡 {city.additionalNotes || city.yourAdvantage}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

