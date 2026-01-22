import React from 'react';

interface CountryIntroPageProps {
  countryName: string; // Dynamic: "Australia", "Canada", "Germany", etc.
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
  colors 
}: CountryIntroPageProps) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#222222',
      padding: '0mm 0mm',
      textAlign: 'center'
    }}>
      {/* Flag */}
      <div style={{
        width: '200pt',
        height: '120pt',
        marginBottom: '32pt',
        borderRadius: '12pt',
        overflow: 'hidden',
      }}>
        <img 
          src={flagImagePath} 
          alt={`${countryName} flag`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      </div>
      
      {/* Heading */}
      <h1 style={{
        fontSize: '42pt',
        fontWeight: '700',
        marginBottom: '16pt',
        letterSpacing: '0.5pt',
        margin: '0 0 16pt 0'
      }}>
        {countryName} Visa Opportunities Report
      </h1>
      
      
      {/* USPs */}
      <div style={{
        background: '#FFFFFF',
        backdropFilter: 'blur(10pt)',
        borderRadius: '16pt',
        padding: '24pt 32pt',
        maxWidth: '500pt',
        border: '1pt solid #222222'
      }}>
        <h3 style={{
          fontSize: '16pt',
          fontWeight: '700',
          marginBottom: '16pt',
          marginTop: '0',
          textTransform: 'uppercase',
          letterSpacing: '1pt'
        }}>
          Why {countryName}?
        </h3>
        
        <ul style={{
          listStyle: 'none',
          padding: '0',
          margin: '0',
          textAlign: 'left'
        }}>
          {usps.map((usp, index) => (
            <li key={index} style={{
              fontSize: '12pt',
              lineHeight: '1.7',
              marginBottom: '8pt',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12pt'
            }}>
              <span style={{
                fontSize: '18pt',
                fontWeight: '700',
                marginTop: '-2pt',
                flexShrink: 0
              }}>✓</span>
              <span>{usp}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Decorative element */}
      <div style={{
        marginTop: '32pt',
        fontSize: '11pt',
        opacity: '0.9',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '2pt'
      }}>
        Comprehensive Migration Assessment
      </div>
    </div>
  );
}

