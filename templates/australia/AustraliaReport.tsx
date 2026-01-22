import React from 'react';
import type { AustraliaReportData } from '../types/report-types';
import { pdfStyles } from './shared/styles';
import { CoverPage } from '../shared/CoverPage';
import { TableOfContents } from '../shared/TableOfContents';
import { Section1_ExecutiveSummary } from './Section1_ExecutiveSummary';
import { Section2_ProfessionalProfile } from './Section2_ProfessionalProfile';
import { Section3_VisaPathways } from './Section3_VisaPathways';
import { Section4_SkillDemand } from './Section4_SkillDemand';
import { Section5_TopEmployers } from './Section5_TopEmployers';
import { Section6_SalaryVariation } from './Section6_SalaryVariation';
import { Section7_Timeline } from './Section7_Timeline';
import { Section8_RegulatoryAdvisor } from './Section8_RegulatoryAdvisor';
import { ThankYouPage } from '../shared/ThankYouPage';

interface AustraliaReportProps {
  data: AustraliaReportData;
}

export function AustraliaReport({ data }: AustraliaReportProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>WorldVisa Australia Report - {data.meta.userName}</title>
        <style dangerouslySetInnerHTML={{ __html: pdfStyles }} />
      </head>
      <body>
        {/* Cover Page */}
        <CoverPage data={data.coverPage} meta={data.meta} />

        {/* Table of Contents */}
        <TableOfContents />

        {/* Page Break after TOC */}
        <div className="page-break" />

        {/* Main Content Sections - Flow naturally */}
        <div className="content-wrapper">
          {/* Section 1: Executive Summary */}
          <Section1_ExecutiveSummary data={data.executiveSummary} />

          {/* Section 2: Professional Profile */}
          <Section2_ProfessionalProfile data={data.professionalProfile} />

          {/* Section 3: Visa Pathways */}
          <Section3_VisaPathways data={data.visaPathways} />

          {/* Section 4: Skill Demand */}
          <Section4_SkillDemand data={data.skillDemand} />

          {/* Section 5: Top Employers */}
          <Section5_TopEmployers data={data.topEmployers} />

          {/* Section 6: Salary Variation */}
          <Section6_SalaryVariation data={data.salaryVariation} />

          {/* Section 7: Timeline */}
          <Section7_Timeline />

          {/* Section 8: Regulatory Advisor */}
          <Section8_RegulatoryAdvisor />
        </div>

        {/* Page Break before Thank You */}
        <div className="page-break" />

        {/* Thank You Page */}
        <ThankYouPage />
      </body>
    </html>
  );
}

