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
        <CoverPage data={data.coverPage} meta={data.meta} />

        <TableOfContents />

        <Section1_ExecutiveSummary data={data.executiveSummary} />
        <Section2_ProfessionalProfile data={data.professionalProfile} />
        <Section3_VisaPathways data={data.visaPathways} />
        <Section4_SkillDemand data={data.skillDemand} />
        <Section5_TopEmployers data={data.topEmployers} />
        <Section6_SalaryVariation data={data.salaryVariation} />
        <Section7_Timeline />
        <Section8_RegulatoryAdvisor />

        <ThankYouPage />
      </body>
    </html>
  );
}

