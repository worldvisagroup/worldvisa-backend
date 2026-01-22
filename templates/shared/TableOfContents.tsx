import React from 'react';
import { Table } from './Table';

interface TOCSection {
  section: string;
  title: string;
  page: string;
  country?: string; // NEW: identify which country
}

interface TableOfContentsProps {
  sections?: TOCSection[]; // Optional: pass sections dynamically
  countries?: string[]; // NEW: for multi-country reports
}

export function TableOfContents({ sections, countries }: TableOfContentsProps) {
  // Default Australia sections if not provided (for backwards compatibility)
  const defaultSections: TOCSection[] = [
    { section: '1', title: 'Executive Summary', page: '3' },
    { section: '2', title: 'Professional Profile Assessment', page: '5' },
    { section: '3', title: 'Visa Pathways Without Job Offer', page: '7' },
    { section: '4', title: 'Global Skill Demand Mapping', page: '11' },
    { section: '5', title: 'Top 20 Target Employers', page: '13' },
    { section: '6', title: 'City-wise Salary Variation', page: '15' },
    { section: '7', title: 'End-to-End Timeline', page: '17' },
    { section: '8', title: 'Why Use a Regulated Advisor', page: '19' },
  ];

  const tocData = sections || defaultSections;

  const columns = [
    { header: 'Section', key: 'section', align: 'center' as const },
    { header: 'Content', key: 'title', align: 'left' as const },
    { header: 'Page', key: 'page', align: 'center' as const },
  ];

  // If multi-country, group by country
  if (countries && countries.length > 1) {
    return (
      <div>
        {/* Header section */}
        <div style={{ marginBottom: '22pt' }}>
          <h2 style={{
            fontSize: '32pt',
            fontWeight: '700',
            color: '#0066CC',
            marginBottom: '8pt',
            marginTop: '0'
          }}>
            Table of Contents
          </h2>
        </div>

        {/* Group sections by country */}
        {countries.map((country) => (
          <div key={country}>
            <h3 style={{
              color: '#D52636',
              fontSize: '18pt',
              fontWeight: '700',
              marginBottom: '4pt',
              marginTop: '0'
            }}>
              {country}
            </h3>
            <Table
              columns={columns}
              data={tocData.filter(s => s.country === country).map(s => ({
                section: s.section,
                title: s.title,
                page: s.page,
              }))}
            />
          </div>
        ))}
      </div>
    );
  }

  // Single country - normal rendering
  return (
    <div style={{ padding: '8mm 10mm' }}>
      {/* Header section */}
      <div style={{ marginBottom: '32pt' }}>
        <h2 style={{
          fontSize: '32pt',
          fontWeight: '700',
          color: '#0066CC',
          marginBottom: '8pt',
          marginTop: '0'
        }}>
          Table of Contents
        </h2>
      </div>

      {/* Table */}
      <div style={{ fontSize: '13pt' }}>
        <Table columns={columns} data={tocData.map(s => ({
          section: s.section,
          title: s.title,
          page: s.page,
        }))} />
      </div>

      {/* Footer note */}
      <div style={{
        marginTop: '32pt',
        padding: '16pt',
        background: '#EBF5FF',
        borderRadius: '8pt',
        border: '1pt solid #BFDBFE'
      }}>
        <p style={{
          fontSize: '11pt',
          color: '#4B5563',
          marginBottom: '0',
          lineHeight: '1.6'
        }}>
          💡 <strong>Tip:</strong> This report is tailored specifically to your profile and the {countries?.[0] || 'immigration'} system.
          Bookmark key sections for easy reference during your application journey.
        </p>
      </div>
    </div>
  );
}

