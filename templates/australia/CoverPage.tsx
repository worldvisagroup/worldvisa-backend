import React from 'react';
import { CoverPageData, ReportMeta } from '../types/report-types';

interface CoverPageProps {
  data: CoverPageData;
  meta: ReportMeta;
}

export function CoverPage({ data, meta }: CoverPageProps) {
  return (
    <div className="cover-page">
      {/* Logo */}
      <img
        src="https://res.cloudinary.com/djvvz62dw/image/upload/v1765014046/worldvisa/logo_uavsjh.svg"
        alt="WorldVisa"
        className="cover-logo"
      />

      {/* Title */}
      {/* Main title section */}
      <div style={{ marginBottom: '70pt' }}>
        <h1 className="cover-title">{data.title}</h1>
        <p className="cover-subtitle">{data.subtitle}</p>
      </div>

      {/* User information cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16pt',
        maxWidth: '400pt',
        margin: '0 auto'
      }}>
        <div style={{
          background: '#F9FAFB',
          border: '1pt solid #E5E7EB',
          borderRadius: '8pt',
          padding: '16pt',
          textAlign: 'left'
        }}>
          <p style={{
            fontSize: '12pt',
            color: '#6B7280',
            marginBottom: '6pt',
            fontWeight: '600'
          }}>
            Prepared For
          </p>
          <p style={{
            fontSize: '14pt',
            fontWeight: '700',
            color: '#1F2937',
            marginBottom: '0'
          }}>
            {meta.userName || 'John Doe'}
          </p>
        </div>

        <div style={{
          background: '#F9FAFB',
          border: '1pt solid #E5E7EB',
          borderRadius: '8pt',
          padding: '16pt',
          textAlign: 'left'
        }}>
          <p style={{
            fontSize: '12pt',
            color: '#6B7280',
            marginBottom: '6pt',
            fontWeight: '600'
          }}>
            Report Date
          </p>
          <p style={{
            fontSize: '14pt',
            fontWeight: '700',
            color: '#1F2937',
            marginBottom: '0'
          }}>
            {meta.generatedDate || new Date().toLocaleDateString('en-AU', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Report version badge */}
      <div style={{
        marginTop: '40pt',
        display: 'inline-block',
        background: '#EBF5FF',
        color: '#0066CC',
        padding: '8pt 16pt',
        borderRadius: '20pt',
        fontSize: '12pt',
        fontWeight: '600'
      }}>
        Version {meta.reportVersion || '1.0'}
      </div>

      {/* Decorative footer element */}
      <div style={{
        position: 'absolute',
        bottom: '40pt',
        left: '0',
        right: '0',
        textAlign: 'center',
        color: '#9CA3AF',
        fontSize: '12pt'
      }}>
        <div style={{
          width: '100pt',
          height: '2pt',
          background: 'linear-gradient(90deg, transparent 0%, #0066CC 50%, transparent 100%)',
          margin: '0 auto 12pt'
        }} />
        <p style={{ margin: '0' }}>Confidential Migration Assessment Report</p>
      </div>
    </div>
  );
}

