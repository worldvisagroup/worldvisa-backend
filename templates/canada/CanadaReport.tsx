import React from 'react';
import type { CanadaReportData } from '../types/report-types';
import { pdfStyles } from '../shared/styles';
import { CoverPage } from '../shared/CoverPage';
import { TableOfContents } from '../shared/TableOfContents';
import { Section1_ExecutiveSummary } from './Section1_ExecutiveSummary';
import { Section2_ProfessionalProfile } from './Section2_ProfessionalProfile';
import { Section3_NoJobOffer } from './Section3_NoJobOffer';
import { Section4_NoSponsor } from './Section4_NoSponsor';
import { Section5_SkillDemand } from './Section5_SkillDemand';
import { Section6_TopEmployers } from './Section6_TopEmployers';
import { Section7_SalaryVariation } from './Section7_SalaryVariation';
import { Section8_VisaPathways } from './Section8_VisaPathways';
import { Section9_AboutWorldVisa } from './Section9_AboutWorldVisa';
import { ThankYouPage } from '../shared/ThankYouPage';
import { Section10_WorldVisaTimeline } from './Section10_WorldVisaTimeline';

interface Props {
  data: CanadaReportData;
}

export function CanadaReport({ data }: Props) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>WorldVisa Canada Report - {data.meta.userName}</title>
        <style dangerouslySetInnerHTML={{ __html: pdfStyles }} />
      </head>
      <body>
        <CoverPage data={data.coverPage} meta={data.meta} />
        <TableOfContents />
        <Section1_ExecutiveSummary data={data.executiveSummary} />
        <Section2_ProfessionalProfile data={data.professionalProfile} />
        <Section3_NoJobOffer data={data.noJobOffer} />
        <Section4_NoSponsor data={data.noSponsor} />
        <Section5_SkillDemand data={data.skillDemand} />
        <Section6_TopEmployers data={data.topEmployers} />
        <Section7_SalaryVariation data={data.salaryVariation} />
        <Section8_VisaPathways data={data.visaPathways} />
        <Section9_AboutWorldVisa />
        <Section10_WorldVisaTimeline />
        <ThankYouPage />
      </body>
    </html>
  );
}
