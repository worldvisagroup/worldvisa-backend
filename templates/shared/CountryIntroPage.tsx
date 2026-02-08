import React from 'react';

interface CountryIntroPageProps {
  countryName: string;
  flagImagePath: string;
  usps: string[];
  colors: {
    primary: string;
    gradient: string;
  };
}

export function CountryIntroPage({
  countryName,
  flagImagePath,
  usps,
}: CountryIntroPageProps) {
  const t = {
    dark: '#111827',
    text: '#4B5563',
    accent: '#1B2A4A',
    border: '#E5E7EB',
    bg: '#FAFAFA',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '10mm 14mm',
      textAlign: 'center'
    }}>
      {/* Flag */}
      <div style={{
        width: '240pt',
        height: '120pt',
        marginBottom: '20pt',
        borderRadius: '6pt',
        overflow: 'hidden',
      }}>
        <img
          src={flagImagePath}
          alt={`${countryName} flag`}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* Heading */}
      <h1 style={{
        fontSize: '32pt',
        fontWeight: 700,
        color: t.dark,
        marginBottom: '4pt',
        lineHeight: 1.1,
      }}>
        {countryName}
      </h1>
      <p style={{
        fontSize: '14pt',
        color: t.accent,
        fontWeight: 600,
        marginBottom: '20pt',
      }}>
        Visa Opportunities Report
      </p>

      {/* Divider */}
      <div style={{ width: '40pt', height: '2px', background: t.accent, marginBottom: '20pt' }} />

      {/* USPs */}
      <div style={{
        background: t.bg,
        borderRadius: '8pt',
        padding: '16pt 20pt',
        maxWidth: '400pt',
        width: '100%',
        border: `0.5pt solid ${t.border}`,
        textAlign: 'left',
      }}>
        <h3 style={{
          fontSize: '11pt',
          fontWeight: 700,
          color: t.dark,
          marginBottom: '10pt',
          marginTop: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.5pt',
          textAlign: 'center',
        }}>
          Why {countryName}?
        </h3>

        {usps.map((usp, index) => (
          <div key={index} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8pt',
            marginBottom: '6pt',
            fontSize: '11pt',
            lineHeight: '1.5',
            color: t.text,
          }}>
            <span style={{ color: t.accent, fontWeight: 700, flexShrink: 0, marginTop: '1pt' }}>&#10003;</span>
            <span>{usp}</span>
          </div>
        ))}
      </div>

      {/* Bottom label */}
      <div style={{
        marginTop: '20pt',
        fontSize: '10pt',
        color: t.text,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '2pt',
      }}>
        Comprehensive Migration Assessment
      </div>
    </div>
  );
}
