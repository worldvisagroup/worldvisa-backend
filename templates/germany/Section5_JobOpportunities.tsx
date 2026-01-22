import React from 'react';
import type { GermanyJobOpportunitiesData } from '../types/report-types';
import { SectionHeader } from '../shared/SectionHeader';
import { Table } from '../shared/Table';

interface Props {
  data: GermanyJobOpportunitiesData;
}

// Color scheme for cities - extends for additional cities
const CITY_COLORS = [
  '#0066CC', // Berlin (blue)
  '#10B981', // Munich (green)
  '#F59E0B', // Frankfurt (amber)
  '#8B5CF6', // Additional cities (purple)
  '#EC4899', // Additional cities (pink)
  '#14B8A6', // Additional cities (teal)
];

// Helper function to get color for a city by index
function getCityColor(index: number): string {
  return CITY_COLORS[index % CITY_COLORS.length];
}

// Helper function to get light background color for specialized roles
function getSpecializedRolesBgColor(color: string): string {
  const colorMap: Record<string, string> = {
    '#0066CC': '#EBF5FF', // Light blue for Berlin
    '#10B981': '#D1FAE5', // Light green for Munich
    '#F59E0B': '#FEF3C7', // Light amber for Frankfurt
  };
  return colorMap[color] || '#F3F4F6'; // Default gray
}

// Helper function to get advantage box background color
function getAdvantageBgColor(color: string): string {
  const colorMap: Record<string, string> = {
    '#0066CC': '#EBF5FF', // Light blue for Berlin
    '#10B981': '#D1FAE5', // Light green for Munich
    '#F59E0B': '#FEF3C7', // Light amber for Frankfurt
  };
  return colorMap[color] || '#F3F4F6'; // Default gray
}

// Helper function to get advantage box text color
function getAdvantageTextColor(color: string): string {
  const colorMap: Record<string, string> = {
    '#0066CC': '#1E40AF', // Dark blue for Berlin
    '#10B981': '#065F46', // Dark green for Munich
    '#F59E0B': '#92400E', // Dark amber for Frankfurt
  };
  return colorMap[color] || '#374151'; // Default gray
}

// Helper function to get border color for specialized roles
function getSpecializedRolesBorderColor(color: string): string {
  const colorMap: Record<string, string> = {
    '#0066CC': '#BFDBFE', // Light blue border for Berlin
    '#10B981': '#10B981', // Green border for Munich
    '#F59E0B': '#F59E0B', // Amber border for Frankfurt
  };
  return colorMap[color] || '#E5E7EB'; // Default gray
}

export function Section5_JobOpportunities({ data }: Props) {
  const cityEntries = Object.entries(data.cities);
  const totalCities = cityEntries.length;

  return (
    <div className="section job-opportunities">
      <SectionHeader number="5" title="Job Opportunities by Role & City" />

      {cityEntries.map(([cityKey, city], cityIndex) => {
        const sectionNumber = cityIndex + 1;
        const cityColor = getCityColor(cityIndex);
        const specializedRolesBg = getSpecializedRolesBgColor(cityColor);
        const advantageBg = getAdvantageBgColor(cityColor);
        const advantageTextColor = getAdvantageTextColor(cityColor);
        const specializedRolesBorder = getSpecializedRolesBorderColor(cityColor);

        return (
          <div key={cityKey} className="subsection" style={{ marginTop: '8pt' }}>
            <h3>
              5.{sectionNumber} {city.name.toUpperCase()} – MID TO SENIOR LEVEL
            </h3>

            {/* City Card */}
            <div
              style={{
                background: '#F9FAFB',
                border: `2pt solid ${cityColor}`,
                borderRadius: '8pt',
                padding: '16pt',
                marginBottom: '16pt',
              }}
            >
              <h4
                style={{
                  fontSize: '16pt',
                  fontWeight: '700',
                  color: cityColor,
                  marginTop: '0',
                  marginBottom: '12pt',
                }}
              >
                {city.name.toUpperCase()} – MID TO SENIOR LEVEL
              </h4>

              {/* Job Titles Box */}
              <div
                style={{
                  background: '#FFFFFF',
                  padding: '12pt',
                  borderRadius: '6pt',
                  marginBottom: '12pt',
                  border: '1pt solid #E5E7EB',
                }}
              >
                <h5
                  style={{
                    fontSize: '12pt',
                    fontWeight: '600',
                    marginBottom: '8pt',
                    color: '#1F2937',
                  }}
                >
                  Typical Job Titles
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6pt' }}>
                  {city.jobTitles.map((title, index) => (
                    <div
                      key={index}
                      style={{
                        fontSize: '10pt',
                        color: '#374151',
                        paddingLeft: '8pt',
                        borderLeft: `3pt solid ${cityColor}`,
                      }}
                    >
                      {title}
                    </div>
                  ))}
                </div>
              </div>

              {/* Specialized Roles Box - Only render if it exists */}
              {city.specializedRoles && city.specializedRoles.length > 0 && (
                <div
                  style={{
                    background: specializedRolesBg,
                    padding: '12pt',
                    borderRadius: '6pt',
                    marginBottom: '12pt',
                    border: `1pt solid ${specializedRolesBorder}`,
                  }}
                >
                  <h5
                    style={{
                      fontSize: '12pt',
                      fontWeight: '600',
                      marginBottom: '8pt',
                      color: cityColor,
                    }}
                  >
                    Specialized Roles (Your Niche)
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6pt' }}>
                    {city.specializedRoles.map((role, index) => (
                      <div
                        key={index}
                        style={{
                          fontSize: '10pt',
                          color: '#1E40AF',
                          paddingLeft: '8pt',
                          borderLeft: '3pt solid #3B82F6',
                        }}
                      >
                        {role}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Target Companies Box */}
              <div
                style={{
                  background: '#FFFFFF',
                  padding: '12pt',
                  borderRadius: '6pt',
                  marginBottom: city.advantage ? '12pt' : '0',
                  border: '1pt solid #E5E7EB',
                }}
              >
                <h5
                  style={{
                    fontSize: '12pt',
                    fontWeight: '600',
                    marginBottom: '8pt',
                    color: '#1F2937',
                  }}
                >
                  Target Companies
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6pt' }}>
                  {city.targetCompanies.map((company, index) => (
                    <div
                      key={index}
                      style={{
                        fontSize: '10pt',
                        color: '#374151',
                        paddingLeft: '8pt',
                        borderLeft: `3pt solid ${cityColor}`,
                      }}
                    >
                      {company}
                    </div>
                  ))}
                </div>
              </div>

              {/* Advantage Box - Only render if it exists */}
              {city.advantage && (
                <div
                  style={{
                    background: advantageBg,
                    padding: '12pt',
                    borderRadius: '6pt',
                    border: `1pt solid ${cityColor}`,
                  }}
                >
                  <p
                    style={{
                      fontSize: '11pt',
                      fontWeight: '600',
                      color: advantageTextColor,
                      margin: '0',
                    }}
                  >
                    <strong>Advantage:</strong> {city.advantage}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div className="subsection" style={{ marginTop: '8pt' }}>
        <h3>5.{totalCities + 1} Key Industries Hiring for Your Skill Set</h3>
        <Table
          columns={[
            { header: 'Industry', key: 'industry' },
            { header: 'Demand', key: 'demand' },
            { header: 'Growth', key: 'growth' },
            { header: 'Example Companies', key: 'exampleCompanies' },
            { header: 'Your Fit', key: 'yourFit' },
          ]}
          data={data.keyIndustries.map((industry) => ({
            industry: industry.industry,
            demand: industry.demand,
            growth: industry.growth,
            exampleCompanies: industry.exampleCompanies,
            yourFit: industry.yourFit,
          }))}
        />
      </div>
    </div>
  );
}
