import React from 'react';

interface TOCSection {
  section: string;
  title: string;
  page: string;
  country?: string;
}

interface TableOfContentsProps {
  sections?: TOCSection[];
  countries?: string[];
}

export function TableOfContents({ sections, countries }: TableOfContentsProps) {
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

  const t = {
    dark: '#111827',
    text: '#4B5563',
    muted: '#9CA3AF',
    red: '#1B2A4A',
    border: '#E5E7EB',
    bg: '#FAFAFA',
  };

  if (countries && countries.length > 1) {
    return (
      <div style={{ padding: '10mm 12mm' }}>
        <div style={{ marginBottom: '16pt' }}>
          <p style={{ fontSize: '9pt', color: t.red, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '4pt' }}>Contents</p>
          <h2 style={{ fontSize: '24pt', fontWeight: 700, color: t.dark, margin: 0 }}>Table of Contents</h2>
          <div style={{ width: '40pt', height: '2px', background: t.red, marginTop: '8pt' }} />
        </div>

        {countries.map((country, ci) => (
          <div key={country} style={{ marginBottom: ci < countries.length - 1 ? '14pt' : '0' }}>
            <h3 style={{ fontSize: '13pt', fontWeight: 700, color: t.dark, marginBottom: '6pt', marginTop: '0', paddingBottom: '4pt', borderBottom: `1px solid ${t.border}` }}>
              {country}
            </h3>
            {tocData.filter(s => s.country === country).map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '5pt 0', borderBottom: `0.5pt dotted ${t.border}` }}>
                <span style={{ width: '24pt', fontSize: '10pt', fontWeight: 700, color: t.red }}>{item.section}</span>
                <span style={{ flex: 1, fontSize: '13pt', color: t.text }}>{item.title}</span>
                <span style={{ fontSize: '10pt', fontWeight: 600, color: t.muted, marginLeft: '8pt' }}>{item.page}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: '10mm 12mm' }}>
      <div style={{ marginBottom: '20pt' }}>
        <p style={{ fontSize: '9pt', color: t.red, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '4pt' }}>Contents</p>
        <h2 style={{ fontSize: '24pt', fontWeight: 700, color: t.dark, margin: 0 }}>Table of Contents</h2>
        <div style={{ width: '40pt', height: '2px', background: t.red, marginTop: '8pt' }} />
      </div>

      {tocData.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '7pt 0', borderBottom: `0.5pt dotted ${t.border}` }}>
          <span style={{ width: '28pt', fontSize: '10pt', fontWeight: 700, color: t.red }}>{item.section}</span>
          <span style={{ flex: 1, fontSize: '13pt', color: t.dark, fontWeight: 500 }}>{item.title}</span>
          <span style={{ fontSize: '10pt', fontWeight: 600, color: t.muted, marginLeft: '8pt' }}>{item.page}</span>
        </div>
      ))}

      <div style={{ marginTop: '20pt', padding: '10pt 12pt', background: t.bg, borderRadius: '4pt', borderLeft: `3pt solid ${t.red}` }}>
        <p style={{ fontSize: '10pt', color: t.text, marginBottom: '0', lineHeight: '1.5' }}>
          <strong>Note:</strong> This report is tailored specifically to your profile. Bookmark key sections for easy reference during your application journey.
        </p>
      </div>
    </div>
  );
}
