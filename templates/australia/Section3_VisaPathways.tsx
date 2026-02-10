import React from 'react';
import type { VisaPathwaysData } from '../types/report-types';
import { SectionHeader } from './shared/SectionHeader';

type PathwayDetail = VisaPathwaysData['withJobOffer']['pathways'][number];
type CategoryData = { description?: string; pathways: PathwayDetail[] };

interface Props {
  data: VisaPathwaysData;
}

interface CategoryConfig {
  sectionNumber: string;
  title: string;
  badgeText: string;
  accentColor: string;
  backgroundColor: string;
  borderWidth: string;
  showBoxShadow?: boolean;
  importantNote?: {
    text: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    strongColor: string;
    icon: string;
    label: string;
  };
}

export function Section3_VisaPathways({ data }: Props) {
  // Helper function to render a single pathway card
  const renderPathwayCard = (pathway: PathwayDetail, config: CategoryConfig, index: number) => (
    <div
      key={index}
      style={{
        borderLeft: `${config.borderWidth} solid ${config.accentColor}`,
        padding: '10pt 12pt',
        marginBottom: '12pt',
        background: config.backgroundColor,
        pageBreakInside: 'avoid',
        boxShadow: config.showBoxShadow ? '0 1pt 3pt rgba(0,0,0,0.08)' : 'none',
      }}
    >
      {/* Pathway Header */}
      <div style={{ marginBottom: '6pt' }}>
        <span style={{ fontSize: '12pt', fontWeight: 700, color: '#111827' }}>
          {pathway.name}
        </span>
        <span style={{ fontSize: '12pt', color: config.accentColor, fontWeight: 600, marginLeft: '8pt' }}>
          {pathway.subclass}
        </span>
      </div>

      {/* Key Info Grid - 2 columns */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt', marginBottom: '6pt' }}>
        <tbody>
          <tr>
            <td style={{ padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', fontWeight: 600, color: '#111827', width: '25%' }}>
              Points Requirement
            </td>
            <td style={{ padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', color: '#4B5563', width: '25%' }}>
              {pathway.pointsRequirement}
            </td>
            <td style={{ padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', fontWeight: 600, color: '#111827', width: '25%' }}>
              Age Requirement
            </td>
            <td style={{ padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', color: '#4B5563', width: '25%' }}>
              {pathway.ageRequirement}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', fontWeight: 600, color: '#111827' }}>
              Employer Sponsorship
            </td>
            <td style={{ padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', color: '#4B5563' }}>
              {pathway.employerSponsorship}
            </td>
            <td style={{ padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', fontWeight: 600, color: '#111827' }}>
              State Sponsorship
            </td>
            <td style={{ padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', color: '#4B5563' }}>
              {pathway.stateSponsorship}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', fontWeight: 600, color: '#111827' }}>
              Processing Time
            </td>
            <td style={{ padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', color: '#4B5563' }}>
              {pathway.processingTime}
            </td>
            <td style={{ padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', fontWeight: 600, color: '#111827' }}>
              Pathway
            </td>
            <td style={{ padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', color: '#4B5563' }}>
              {pathway.pathway}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Duration & PR Pathway */}
      {pathway.duration && (
        <p style={{ fontSize: '12pt', color: '#4B5563', margin: '0 0 4pt 0', lineHeight: '1.5' }}>
          <strong style={{ color: '#111827' }}>Duration:</strong> {pathway.duration}
          {pathway.prPathway && (
            <span> | <strong style={{ color: '#111827' }}>PR Pathway:</strong> {pathway.prPathway}</span>
          )}
        </p>
      )}

      {/* Key Requirements */}
      {pathway.keyRequirements && pathway.keyRequirements.length > 0 && (
        <div style={{ marginBottom: '4pt' }}>
          <p style={{ fontSize: '12pt', fontWeight: 600, color: '#111827', margin: '0 0 3pt 0' }}>
            Key Requirements:
          </p>
          <ul style={{ fontSize: '12pt', color: '#4B5563', margin: 0, paddingLeft: '14pt', lineHeight: '1.5' }}>
            {pathway.keyRequirements.map((req: string, reqIndex: number) => (
              <li key={reqIndex} style={{ marginBottom: '2pt' }}>{req}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Key States */}
      {pathway.keyStates && pathway.keyStates.length > 0 && (
        <div style={{ marginBottom: '4pt' }}>
          <p style={{ fontSize: '12pt', fontWeight: 600, color: '#111827', margin: '0 0 3pt 0' }}>
            Key States Actively Nominating:
          </p>
          <ul style={{ fontSize: '12pt', color: '#4B5563', margin: 0, paddingLeft: '14pt' }}>
            {pathway.keyStates.map((state: string, stateIndex: number) => (
              <li key={stateIndex} style={{ marginBottom: '2pt' }}>{state}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Regional Requirements */}
      {pathway.regionalRequirements && (
        <p style={{ fontSize: '12pt', color: '#4B5563', margin: '0 0 4pt 0', lineHeight: '1.5' }}>
          <strong style={{ color: '#111827' }}>Regional Requirements:</strong> {pathway.regionalRequirements}
        </p>
      )}

      {/* Key Advantage */}
      {pathway.keyAdvantage && (
        <p style={{ fontSize: '12pt', color: '#059669', margin: '0 0 4pt 0', lineHeight: '1.5' }}>
          <strong>▸ Key Advantage:</strong> {pathway.keyAdvantage}
        </p>
      )}

      {/* Additional Info */}
      {pathway.additionalInfo && (
        <p style={{ fontSize: '12pt', color: '#9CA3AF', margin: '0 0 4pt 0', lineHeight: '1.5', fontStyle: 'italic' }}>
          {pathway.additionalInfo}
        </p>
      )}

      {/* Why Suitable */}
      <div style={{ borderLeft: '2pt solid #059669', paddingLeft: '8pt', marginTop: '6pt' }}>
        <p style={{ fontSize: '12pt', margin: 0, lineHeight: '1.5' }}>
          <strong style={{ color: '#059669' }}>Why Suitable for You:</strong>{' '}
          <span style={{ color: '#4B5563' }}>{pathway.whySuitable}</span>
        </p>
      </div>
    </div>
  );

  // Helper function to render a category section
  const renderCategory = (categoryData: CategoryData, config: CategoryConfig) => (
    <div style={{ marginBottom: '24pt' }}>
      {/* Category Header with Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '0.02em' }}>
          {config.sectionNumber} {config.title}
        </h3>
        <span style={{
          fontSize: '9pt',
          fontWeight: 600,
          color: config.accentColor,
          background: config.backgroundColor,
          padding: '3pt 8pt',
          borderRadius: '10pt',
          border: `1pt solid ${config.accentColor}`,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
        }}>
          {config.badgeText}
        </span>
      </div>

      {/* Important Note (if provided) */}
      {config.importantNote && (
        <div style={{
          background: config.importantNote.bgColor,
          borderLeft: `4pt solid ${config.importantNote.borderColor}`,
          border: `1pt solid ${config.importantNote.borderColor}`,
          borderLeftWidth: '4pt',
          borderLeftColor: config.importantNote.borderColor,
          borderRadius: '4pt',
          padding: '12pt 14pt',
          marginBottom: '12pt',
          fontSize: '11pt',
          color: config.importantNote.textColor,
          lineHeight: '1.6',
          pageBreakInside: 'avoid',
        }}>
          <p style={{ margin: 0 }}>
            <strong style={{ color: config.importantNote.strongColor, fontSize: '12pt' }}>
              {config.importantNote.icon} {config.importantNote.label}:
            </strong> {config.importantNote.text}
          </p>
        </div>
      )}

      {/* Category Description (if provided) */}
      {categoryData.description && (
        <div style={{
          borderLeft: `2pt solid ${config.accentColor}`,
          padding: '8pt 10pt',
          marginBottom: '12pt',
          background: '#FAFAFA',
          fontSize: '12pt',
          color: '#4B5563',
          lineHeight: '1.6',
        }}>
          {categoryData.description}
        </div>
      )}

      {/* Pathway Cards */}
      {categoryData.pathways.map((pathway, index) => renderPathwayCard(pathway, config, index))}
    </div>
  );

  return (
    <div className="section page">
      <SectionHeader number="3" title="Visa Pathways Analysis" />

      {/* Concept Overview */}
      <div style={{ marginBottom: '20pt' }}>
        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '6pt', marginTop: 0 }}>
          3.1 visa pathways overview
        </h3>
        <p style={{ fontSize: '12pt', color: '#4B5563', lineHeight: '1.6', margin: 0 }}>
          {data.conceptOverview}
        </p>
      </div>

      {/* 3.2 Pathways without Job Offer */}
      {renderCategory(data.withoutJobOffer, {
        sectionNumber: '3.2',
        title: 'Pathways without a job offer',
        badgeText: 'Independent Pathway',
        accentColor: '#1B2A4A',
        backgroundColor: '#F8F9FB',
        borderWidth: '3pt',
        importantNote: {
          text: "You don't always need a job offer to move abroad. WorldVisa helps skilled professionals secure permanent residency directly, through points-based and independent pathways. With 21+ years of hands-on experience, we look at you - your skills, background, and long-term goals and guide you to the most realistic PR option, without relying on an employer.",
          bgColor: '#FFFFFF',
          borderColor: '#D1D5DB',
          textColor: '#374151',
          strongColor: '#DC2626',
          icon: '★',
          label: '',
        },
      })}

      {/* 3.3 Pathways with Job Offer */}
      {renderCategory(data.withJobOffer, {
        sectionNumber: '3.3',
        title: 'Pathways with a job offer',
        badgeText: 'Job Offer Required',
        accentColor: '#2563EB',
        backgroundColor: '#EFF6FF',
        borderWidth: '3pt',
        importantNote: {
          text: 'WorldVisa supports your work visa and permit process only after you have independently secured a valid overseas job offer. Once your offer is in place, our experts ensure the correct visa selection, compliant documentation, and smooth filing. Please note that WorldVisa does not provide recruitment or job placement services.',
          bgColor: '#FFFFFF',
          borderColor: '#D1D5DB',
          textColor: '#374151',
          strongColor: '#DC2626',
          icon: '★',
          label: '',
        },
      })}

      {/* 3.4 Recommended Pathways */}
      {renderCategory(data.recommended, {
        sectionNumber: '3.4',
        title: 'Recommended pathways',
        badgeText: 'Recommended for Your Profile',
        accentColor: '#059669',
        backgroundColor: '#ECFDF5',
        borderWidth: '4pt',
        showBoxShadow: true,
      })}
    </div>
  );
}
