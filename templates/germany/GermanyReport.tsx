import React from 'react';
import type { GermanyReportData } from '../types/report-types';
import { pdfStyles } from '../shared/styles';
import { CoverPage } from '../shared/CoverPage';
import { TableOfContents } from '../shared/TableOfContents';
import { Section1_ExecutiveSummary } from './Section1_ExecutiveSummary';
import { Section2_ProfessionalProfile } from './Section2_ProfessionalProfile';
import { Section3_VisaCategories } from './Section3_VisaCategories';
import { Section4_SkillDemand } from './Section4_SkillDemand';
import { Section5_JobOpportunities } from './Section5_JobOpportunities';
import { Section6_Compensation } from './Section6_Compensation';
import { Section7_AboutWorldVisa } from './Section7_AboutWorldVisa';
import { Section8_WorldVisaTimeline } from './Section8_WorldVisaTimeline';
import { ThankYouPage } from '../shared/ThankYouPage';

interface Props {
  data: GermanyReportData;
}

export function GermanyReport({ data }: Props) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>WorldVisa Germany Report - {data.meta.userName}</title>
        <style dangerouslySetInnerHTML={{ __html: pdfStyles }} />
      </head>
      <body>
        {/* Cover Page */}
        <CoverPage data={data.coverPage} meta={data.meta} />

        {/* Table of Contents */}
        <TableOfContents />
        <div className="page-break" />

        {/* Section 1: Executive Summary */}
        <Section1_ExecutiveSummary data={data.executiveSummary} />
        <div className="page-break" />

        {/* Section 2: Professional Profile */}
        <Section2_ProfessionalProfile data={data.professionalProfile} />
        <div className="page-break" />

        {/* Section 3: Visa Categories */}
        <Section3_VisaCategories data={data.visaCategories} />

        {/* Section 4: Skill Demand */}
        <Section4_SkillDemand data={data.skillDemand} />
        <div className="page-break" />

        {/* Section 5: Job Opportunities */}
        <Section5_JobOpportunities data={data.jobOpportunities} />
        <div className="page-break" />

        {/* Section 6: Compensation */}
        <Section6_Compensation data={data.compensation} />
        <div className="page-break" />

        {/* Section 7: About WorldVisa */}
        <Section7_AboutWorldVisa />
        <div className="page-break" />

        {/* Section 8: WorldVisa Timeline */}
        <Section8_WorldVisaTimeline />
        <div className="page-break" />

        {/* Thank You Page */}
        <ThankYouPage />
      </body>
    </html>
  );
}

