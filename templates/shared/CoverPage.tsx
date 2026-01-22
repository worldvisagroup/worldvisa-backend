import React from 'react';
import type { CoverPageData, ReportMeta } from '../types/report-types';

interface CoverPageProps {
  data: CoverPageData;
  meta: ReportMeta;
  countries?: string[]; // NEW: optional countries array for multi-country reports
}

export function CoverPage({ data, meta, countries }: CoverPageProps) {
  // Determine countries list
  const targetCountries = countries && countries.length > 0
    ? countries
    : [meta.country];

  // Specific colors from request
  const theme = {
    red: '#D52636',
    dark: '#111827',
    text: '#4B5563',
    bg: '#F3F4F6'
  };

  return (
    <div className="cover-page" style={{
      height: '1123px',
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      padding: '0'
    }}>

      {/* Top Right Image / Graphic - Absolute Path for Reliability */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '55%',
        height: '55%',
        zIndex: 1
      }}>
        <img
          src="https://res.cloudinary.com/djvvz62dw/image/upload/v1767534963/coverpage_image_isdaf4.png"
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            position: 'absolute',
            top: '-10%',
            right: '-10%'
          }}
        />
      </div>

      {/* Main Content Container */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        padding: '18pt', // Reduced padding from 60pt
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>

        {/* 1. Header Section */}
        <div style={{ marginTop: '30pt' }}>

          {/* LOGO ADDED ABOVE TEXT */}
          <img
            src="https://res.cloudinary.com/djvvz62dw/image/upload/v1765014046/worldvisa/logo_uavsjh.svg"
            alt="WorldVisa"
            style={{ height: '36pt', marginBottom: '24pt', display: 'block' }}
          />

          <p style={{
            fontSize: '10pt',
            fontWeight: '400',
            color: theme.dark,
            marginBottom: '16pt',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Personalized for you
          </p>

          <h1 style={{
            fontSize: '52pt', // Increased size slightly
            fontWeight: '700',
            color: theme.dark,
            lineHeight: '1.0',
            marginBottom: '6pt'
          }}>
            Your Global Report
          </h1>
          <h1 style={{
            fontSize: '52pt',
            fontWeight: '700',
            color: theme.red,
            lineHeight: '1.0',
            marginTop: '0'
          }}>
            Ready now
          </h1>
        </div>

        {/* 2. Description Section */}
        <div style={{ marginTop: '32pt', maxWidth: '450pt' }}>
          <p style={{
            fontSize: '11pt',
            color: theme.text,
            lineHeight: '1.6',
            marginBottom: '24pt'
          }}>
            Built by visa experts, this report gives you a structured view of your global prospects.<br />
            No guesswork — just clear insights to help you make informed decisions.
          </p>

          {/* Red Divider Line */}
          <div style={{
            width: '60pt',
            height: '3px',
            background: theme.red,
            marginBottom: '30pt'
          }} />
        </div>

        {/* 3. Target Countries (Requested Above USP) */}
        <div style={{ marginBottom: '30pt' }}>
          <p style={{
            fontSize: '9pt',
            fontWeight: '500',
            color: theme.text,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '12pt'
          }}>
            Target Destinations
          </p>
          <div style={{ display: 'flex', gap: '10pt', flexWrap: 'wrap' }}>
            {targetCountries.map((country, idx) => (
              <div key={idx} style={{
                padding: '8pt 24pt',
                background: '#FFFFFF',
                color: theme.dark,
                borderRadius: '50pt',
                fontSize: '12pt',
                fontWeight: '600',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                border: `1px solid ${theme.bg}`
              }}>
                {country}
              </div>
            ))}
          </div>
        </div>

        {/* 4. USP Stats (Requested Layout) */}
        <div style={{
          display: 'flex',
          gap: '50pt',
        }}>
          <div>
            <div style={{ fontSize: '36pt', fontWeight: '600', color: theme.dark }}>150+</div>
            <div style={{ fontSize: '10pt', color: theme.text, marginTop: '4pt', fontWeight: '500' }}>options for you</div>
          </div>
          <div>
            <div style={{ fontSize: '36pt', fontWeight: '600', color: theme.dark }}>50k+</div>
            <div style={{ fontSize: '10pt', color: theme.text, marginTop: '4pt', fontWeight: '500' }}>happy clients</div>
          </div>
          <div>
            <div style={{ fontSize: '36pt', fontWeight: '600', color: theme.dark }}>21+</div>
            <div style={{ fontSize: '10pt', color: theme.text, marginTop: '4pt', fontWeight: '500' }}>in industry</div>
          </div>
        </div>

        {/* 5. Meta Information (Footer) - Aligned to bottom */}
        <div style={{
          borderTop: `1px solid #D1D5DB`,
          paddingTop: '20pt',
          marginTop: '8pt',
          paddingBottom: '20pt'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: '9pt', color: theme.text, fontWeight: '600', marginBottom: '4pt', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Prepared Exclusively For
              </p>
              <p style={{ fontSize: '18pt', fontWeight: '600', color: theme.dark }}>
                {meta.userName}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '10pt', color: theme.text, marginBottom: '2pt', fontWeight: '500' }}>
                Date: {meta.generatedDate}
              </p>
            </div>
          </div>

          <p style={{ fontSize: '9pt', fontWeight: '600', color: theme.dark, marginTop: '10pt' }}>
            Your 1:1 call will be followed up
          </p>
        </div>

      </div>
    </div>
  );
}
