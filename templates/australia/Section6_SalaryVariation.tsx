import React from 'react';
import type { SalaryVariationData } from '../types/report-types';
import { SectionHeader } from './shared/SectionHeader';

interface Props {
  data: SalaryVariationData;
}

export function Section6_SalaryVariation({ data }: Props) {
  const getSalaryBarWidth = (salaryRange: string): number => {
    const match = salaryRange.match(/\$([0-9,]+)\s*–\s*\$([0-9,]+)/);
    if (match) {
      const maxSalary = parseInt(match[2].replace(/,/g, ''));
      return Math.min((maxSalary / 210000) * 100, 100);
    }
    return 50;
  };

  const introText = data.roleName
    ? `Salary variation for ${data.roleName} across Australian cities. This section provides comprehensive compensation data, including take-home estimates and living costs.`
    : 'Salary ranges can vary significantly across Australian cities, depending on the profession and local factors. This section provides comprehensive compensation data, including take-home estimates and living costs, to help you understand city-wise salary variation.';

  return (
    <div className="section salary-variation page">
      <SectionHeader number="6" title="City-wise Salary Variation (Capitals vs Tier-2)" />

      <p className="salary-variation-intro">
        {introText}
      </p>

      {data.cities.map((city, index) => (
        <div key={index} className="city-card">
          <div className="city-card-header">
            <div className="city-card-header-content">
              <h4 className="city-name">{city.cityName}</h4>
              {(city.techHub || city.nicheOpportunity) && (
                <p className="city-card-subtitle">
                  {city.techHub || city.nicheOpportunity}
                </p>
              )}
            </div>
          </div>

          <div className="city-card-salary-block">
            <div className="salary-range">
              <span className="salary-label">{city.midLevelRoleName || 'Mid-level'}</span>
              <div className="salary-range-row">
                <span className="salary-value">{city.midLevelRange}</span>
                {city.premium && (
                  <span className="salary-premium-badge">{city.premium}</span>
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
              <span className="salary-label">{city.seniorLevelRoleName || 'Senior'}</span>
              <span className="salary-value">{city.seniorLevelRange}</span>
              <div className="salary-bar">
                <div
                  className="salary-bar-fill"
                  style={{ width: `${getSalaryBarWidth(city.seniorLevelRange)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="city-details">
            <div className="city-detail-item">
              <div className="city-detail-label">Tax rate</div>
              <div className="city-detail-value">{city.taxRate || 'N/A'}</div>
            </div>
            <div className="city-detail-item">
              <div className="city-detail-label">Take-home</div>
              <div className="city-detail-value city-detail-value-accent">
                {city.takeHomeSalary || 'N/A'}
              </div>
            </div>
            <div className="city-detail-item">
              <div className="city-detail-label">Housing cost</div>
              <div className="city-detail-value">{city.housingCost || 'N/A'}</div>
            </div>
            <div className="city-detail-item">
              <div className="city-detail-label">Cost of living</div>
              <div className="city-detail-value">{city.costOfLiving}</div>
            </div>
            {city.qualityOfLife && (
              <div className="city-detail-item">
                <div className="city-detail-label">Quality of life</div>
                <div className="city-detail-value">{city.qualityOfLife}</div>
              </div>
            )}
          </div>

          {(city.additionalNotes || city.yourAdvantage) && (
            <div className="city-notes">
              <p className="city-notes-text">
                {city.additionalNotes || city.yourAdvantage}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

