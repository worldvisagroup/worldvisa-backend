/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";

// Australia section imports
import { Section1_ExecutiveSummary as AUS_Section1 } from "../australia/Section1_ExecutiveSummary";
import { Section2_ProfessionalProfile as AUS_Section2 } from "../australia/Section2_ProfessionalProfile";
import { Section3_VisaPathways as AUS_Section3 } from "../australia/Section3_VisaPathways";
import { Section4_SkillDemand as AUS_Section4 } from "../australia/Section4_SkillDemand";
import { Section5_TopEmployers as AUS_Section5 } from "../australia/Section5_TopEmployers";
import { Section6_SalaryVariation as AUS_Section6 } from "../australia/Section6_SalaryVariation";
import { Section7_Timeline as AUS_Section7 } from "../australia/Section7_Timeline";
import { Section8_RegulatoryAdvisor as AUS_Section8 } from "../australia/Section8_RegulatoryAdvisor";

// Canada section imports
import { Section1_ExecutiveSummary as CAN_Section1 } from "../canada/Section1_ExecutiveSummary";
import { Section2_ProfessionalProfile as CAN_Section2 } from "../canada/Section2_ProfessionalProfile";
import { Section3_NoJobOffer as CAN_Section3 } from "../canada/Section3_NoJobOffer";
import { Section4_NoSponsor as CAN_Section4 } from "../canada/Section4_NoSponsor";
import { Section5_SkillDemand as CAN_Section5 } from "../canada/Section5_SkillDemand";
import { Section6_TopEmployers as CAN_Section6 } from "../canada/Section6_TopEmployers";
import { Section7_SalaryVariation as CAN_Section7 } from "../canada/Section7_SalaryVariation";
import { Section8_VisaPathways as CAN_Section8 } from "../canada/Section8_VisaPathways";
import { Section9_AboutWorldVisa as CAN_Section9 } from "../canada/Section9_AboutWorldVisa";
import { Section10_WorldVisaTimeline as CAN_Section10 } from "../canada/Section10_WorldVisaTimeline";

// Germany section imports
import { Section1_ExecutiveSummary as GER_Section1 } from '../germany/Section1_ExecutiveSummary';
import { Section2_ProfessionalProfile as GER_Section2 } from '../germany/Section2_ProfessionalProfile';
import { Section3_VisaCategories as GER_Section3 } from '../germany/Section3_VisaCategories';
import { Section4_SkillDemand as GER_Section4 } from '../germany/Section4_SkillDemand';
import { Section5_JobOpportunities as GER_Section5 } from '../germany/Section5_JobOpportunities';
import { Section6_Compensation as GER_Section6 } from '../germany/Section6_Compensation';
import { Section7_AboutWorldVisa as GER_Section7 } from '../germany/Section7_AboutWorldVisa';
import { Section8_WorldVisaTimeline as GER_Section8 } from '../germany/Section8_WorldVisaTimeline';

export interface CountryConfig {
   code: string;
   name: string;
   flagPath: string;
   colors: {
      primary: string;
      gradient: string;
   };
   usps: string[];
   sections: Array<{
      id: string;
      title: string;
      component: React.ComponentType<any>;
      dataKey: string; // Key in country data object (e.g., 'executiveSummary', 'professionalProfile')
   }>;
   dataKey: string; // Key in main reportData object
}

export const COUNTRY_REGISTRY: Record<string, CountryConfig> = {
   australia: {
      code: "australia",
      name: "Australia",
      flagPath:
         "https://res.cloudinary.com/djvvz62dw/image/upload/v1765014033/worldvisa/australia_flag_oqozpv.png",
      colors: {
         primary: "#0066CC",
         gradient: "linear-gradient(135deg, #0066CC 0%, #004999 100%)",
      },
      usps: [
         "Points-based skilled migration open to various professions without a job offer",
         "Transparent pathway to permanent residency within 12-18 months",
         "High quality of life and world-class healthcare system",
         "Access to excellent education and multicultural communities",
         "Opportunities to settle with family and enjoy strong social benefits",
      ],
      sections: [
         {
            id: "1",
            title: "Executive Summary",
            component: AUS_Section1,
            dataKey: "executiveSummary",
         },
         {
            id: "2",
            title: "Professional Profile Assessment",
            component: AUS_Section2,
            dataKey: "professionalProfile",
         },
         {
            id: "3",
            title: "Visa Pathways Without Job Offer",
            component: AUS_Section3,
            dataKey: "visaPathways",
         },
         {
            id: "4",
            title: "Global Skill Demand Mapping",
            component: AUS_Section4,
            dataKey: "skillDemand",
         },
         {
            id: "5",
            title: "Top 20 Target Employers",
            component: AUS_Section5,
            dataKey: "topEmployers",
         },
         {
            id: "6",
            title: "City-wise Salary Variation",
            component: AUS_Section6,
            dataKey: "salaryVariation",
         },
         {
            id: "7",
            title: "End-to-End Timeline",
            component: AUS_Section7,
            dataKey: "timeline",
         },
         {
            id: "8",
            title: "Why Use a Regulated Advisor",
            component: AUS_Section8,
            dataKey: "regulatoryAdvisor",
         },
      ],
      dataKey: "australia",
   },

   canada: {
      code: "canada",
      name: "Canada",
      flagPath:
         "https://res.cloudinary.com/djvvz62dw/image/upload/v1765014033/worldvisa/canada_flag_rted58.png",
      colors: {
         primary: "#D32F2F",
         gradient: "linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%)",
      },
      usps: [
         "Express Entry & Provincial Nominee Programs for skilled workers",
         "Streamlined immigration for a wide range of professionals",
         "Multicultural society with welcoming cities and diverse opportunities",
         "Robust healthcare system and high standard of living",
         "Numerous post-arrival settlement and integration resources",
      ],
      sections: [
         {
            id: "1",
            title: "Executive Summary",
            component: CAN_Section1,
            dataKey: "executiveSummary",
         },
         {
            id: "2",
            title: "Your Professional Profile",
            component: CAN_Section2,
            dataKey: "professionalProfile",
         },
         {
            id: "3",
            title: "Move Without Job Offer",
            component: CAN_Section3,
            dataKey: "noJobOffer",
         },
         {
            id: "4",
            title: "Move Without Sponsor",
            component: CAN_Section4,
            dataKey: "noSponsor",
         },
         {
            id: "5",
            title: "Global Skill Demand Mapping",
            component: CAN_Section5,
            dataKey: "skillDemand",
         },
         {
            id: "6",
            title: "Top 20 Target Employers",
            component: CAN_Section6,
            dataKey: "topEmployers",
         },
         {
            id: "7",
            title: "City-wise Salary Variation",
            component: CAN_Section7,
            dataKey: "salaryVariation",
         },
         {
            id: "8",
            title: "Visa Pathways & Migration Strategy",
            component: CAN_Section8,
            dataKey: "visaPathways",
         },
         {
            id: "9",
            title: "About WorldVisa",
            component: CAN_Section9,
            dataKey: "aboutWorldVisa",
         },
         {
            id: "10",
            title: "WorldVisa Immigration Timeline",
            component: CAN_Section10,
            dataKey: "worldVisaTimeline",
         },
      ],
      dataKey: "canada",
   },

   germany: {
      code: "germany",
      name: "Germany",
      flagPath:
         "https://res.cloudinary.com/djvvz62dw/image/upload/v1765014033/worldvisa/germany_flag_bcj7zx.png",
      colors: {
         primary: "#000000",
         gradient: "linear-gradient(135deg, #000000 0%, #DD0000 100%)",
      },
      usps: [
         "Blue Card program offers attractive pathways for skilled professionals",
         "Strong demand across multiple sectors (300K+ current job openings)",
         "Competitive salaries and benefits for qualified talent",
         "Path to citizenship in 6-8 years",
         "Central European location with excellent quality of life",
      ],
      sections: [
         {
            id: "1",
            title: "Executive Summary",
            component: GER_Section1,
            dataKey: "executiveSummary",
         },
         {
            id: "2",
            title: "Your Professional Profile",
            component: GER_Section2,
            dataKey: "professionalProfile",
         },
         {
            id: "3",
            title: "German Visa Categories & Pathways",
            component: GER_Section3,
            dataKey: "visaCategories",
         },
         {
            id: "4",
            title: "Global Skill Demand Mapping",
            component: GER_Section4,
            dataKey: "skillDemand",
         },
         {
            id: "5",
            title: "Job Opportunities by Role & City",
            component: GER_Section5,
            dataKey: "jobOpportunities",
         },
         {
            id: "6",
            title: "Compensation Benchmarking",
            component: GER_Section6,
            dataKey: "compensation",
         },
         {
            id: "7",
            title: "About WorldVisa",
            component: GER_Section7,
            dataKey: "aboutWorldVisa",
         },
         {
            id: "8",
            title: "WorldVisa Immigration Timeline",
            component: GER_Section8,
            dataKey: "worldVisaTimeline",
         },
      ],
      dataKey: "germany",
   },
};

// Helper functions
export function getCountryConfig(
   countryCode: string
): CountryConfig | undefined {
   return COUNTRY_REGISTRY[countryCode.toLowerCase()];
}

export function getCountriesConfig(countryCodes: string[]): CountryConfig[] {
   return countryCodes
      .map((code) => getCountryConfig(code))
      .filter((config): config is CountryConfig => config !== undefined);
}

export function getAllCountryCodes(): string[] {
   return Object.keys(COUNTRY_REGISTRY);
}

export function getCountryByName(name: string): CountryConfig | undefined {
   return Object.values(COUNTRY_REGISTRY).find(
      (config) => config.name.toLowerCase() === name.toLowerCase()
   );
}
