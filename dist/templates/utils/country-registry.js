"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COUNTRY_REGISTRY = void 0;
exports.getCountryConfig = getCountryConfig;
exports.getCountriesConfig = getCountriesConfig;
exports.getAllCountryCodes = getAllCountryCodes;
exports.getCountryByName = getCountryByName;
// Australia section imports
const Section1_ExecutiveSummary_1 = require("../australia/Section1_ExecutiveSummary");
const Section2_ProfessionalProfile_1 = require("../australia/Section2_ProfessionalProfile");
const Section3_VisaPathways_1 = require("../australia/Section3_VisaPathways");
const Section4_SkillDemand_1 = require("../australia/Section4_SkillDemand");
const Section5_TopEmployers_1 = require("../australia/Section5_TopEmployers");
const Section6_SalaryVariation_1 = require("../australia/Section6_SalaryVariation");
const Section7_Timeline_1 = require("../australia/Section7_Timeline");
const Section8_RegulatoryAdvisor_1 = require("../australia/Section8_RegulatoryAdvisor");
// Canada section imports
const Section1_ExecutiveSummary_2 = require("../canada/Section1_ExecutiveSummary");
const Section2_ProfessionalProfile_2 = require("../canada/Section2_ProfessionalProfile");
const Section3_NoJobOffer_1 = require("../canada/Section3_NoJobOffer");
const Section4_NoSponsor_1 = require("../canada/Section4_NoSponsor");
const Section5_SkillDemand_1 = require("../canada/Section5_SkillDemand");
const Section6_TopEmployers_1 = require("../canada/Section6_TopEmployers");
const Section7_SalaryVariation_1 = require("../canada/Section7_SalaryVariation");
const Section8_VisaPathways_1 = require("../canada/Section8_VisaPathways");
const Section9_AboutWorldVisa_1 = require("../canada/Section9_AboutWorldVisa");
const Section10_WorldVisaTimeline_1 = require("../canada/Section10_WorldVisaTimeline");
// Germany section imports
const Section1_ExecutiveSummary_3 = require("../germany/Section1_ExecutiveSummary");
const Section2_ProfessionalProfile_3 = require("../germany/Section2_ProfessionalProfile");
const Section3_VisaCategories_1 = require("../germany/Section3_VisaCategories");
const Section4_SkillDemand_2 = require("../germany/Section4_SkillDemand");
const Section5_JobOpportunities_1 = require("../germany/Section5_JobOpportunities");
const Section6_Compensation_1 = require("../germany/Section6_Compensation");
const Section7_AboutWorldVisa_1 = require("../germany/Section7_AboutWorldVisa");
const Section8_WorldVisaTimeline_1 = require("../germany/Section8_WorldVisaTimeline");
exports.COUNTRY_REGISTRY = {
    australia: {
        code: "australia",
        name: "Australia",
        flagPath: "https://res.cloudinary.com/djvvz62dw/image/upload/v1765014033/worldvisa/australia_flag_oqozpv.png",
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
                component: Section1_ExecutiveSummary_1.Section1_ExecutiveSummary,
                dataKey: "executiveSummary",
            },
            {
                id: "2",
                title: "Professional Profile Assessment",
                component: Section2_ProfessionalProfile_1.Section2_ProfessionalProfile,
                dataKey: "professionalProfile",
            },
            {
                id: "3",
                title: "Visa Pathways Without Job Offer",
                component: Section3_VisaPathways_1.Section3_VisaPathways,
                dataKey: "visaPathways",
            },
            {
                id: "4",
                title: "Global Skill Demand Mapping",
                component: Section4_SkillDemand_1.Section4_SkillDemand,
                dataKey: "skillDemand",
            },
            {
                id: "5",
                title: "Top 20 Target Employers",
                component: Section5_TopEmployers_1.Section5_TopEmployers,
                dataKey: "topEmployers",
            },
            {
                id: "6",
                title: "City-wise Salary Variation",
                component: Section6_SalaryVariation_1.Section6_SalaryVariation,
                dataKey: "salaryVariation",
            },
            {
                id: "7",
                title: "End-to-End Timeline",
                component: Section7_Timeline_1.Section7_Timeline,
                dataKey: "timeline",
            },
            {
                id: "8",
                title: "Why Use a Regulated Advisor",
                component: Section8_RegulatoryAdvisor_1.Section8_RegulatoryAdvisor,
                dataKey: "regulatoryAdvisor",
            },
        ],
        dataKey: "australia",
    },
    canada: {
        code: "canada",
        name: "Canada",
        flagPath: "https://res.cloudinary.com/djvvz62dw/image/upload/v1765014033/worldvisa/canada_flag_rted58.png",
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
                component: Section1_ExecutiveSummary_2.Section1_ExecutiveSummary,
                dataKey: "executiveSummary",
            },
            {
                id: "2",
                title: "Your Professional Profile",
                component: Section2_ProfessionalProfile_2.Section2_ProfessionalProfile,
                dataKey: "professionalProfile",
            },
            {
                id: "3",
                title: "Move Without Job Offer",
                component: Section3_NoJobOffer_1.Section3_NoJobOffer,
                dataKey: "noJobOffer",
            },
            {
                id: "4",
                title: "Move Without Sponsor",
                component: Section4_NoSponsor_1.Section4_NoSponsor,
                dataKey: "noSponsor",
            },
            {
                id: "5",
                title: "Global Skill Demand Mapping",
                component: Section5_SkillDemand_1.Section5_SkillDemand,
                dataKey: "skillDemand",
            },
            {
                id: "6",
                title: "Top 20 Target Employers",
                component: Section6_TopEmployers_1.Section6_TopEmployers,
                dataKey: "topEmployers",
            },
            {
                id: "7",
                title: "City-wise Salary Variation",
                component: Section7_SalaryVariation_1.Section7_SalaryVariation,
                dataKey: "salaryVariation",
            },
            {
                id: "8",
                title: "Visa Pathways & Migration Strategy",
                component: Section8_VisaPathways_1.Section8_VisaPathways,
                dataKey: "visaPathways",
            },
            {
                id: "9",
                title: "About WorldVisa",
                component: Section9_AboutWorldVisa_1.Section9_AboutWorldVisa,
                dataKey: "aboutWorldVisa",
            },
            {
                id: "10",
                title: "WorldVisa Immigration Timeline",
                component: Section10_WorldVisaTimeline_1.Section10_WorldVisaTimeline,
                dataKey: "worldVisaTimeline",
            },
        ],
        dataKey: "canada",
    },
    germany: {
        code: "germany",
        name: "Germany",
        flagPath: "https://res.cloudinary.com/djvvz62dw/image/upload/v1765014033/worldvisa/germany_flag_bcj7zx.png",
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
                component: Section1_ExecutiveSummary_3.Section1_ExecutiveSummary,
                dataKey: "executiveSummary",
            },
            {
                id: "2",
                title: "Your Professional Profile",
                component: Section2_ProfessionalProfile_3.Section2_ProfessionalProfile,
                dataKey: "professionalProfile",
            },
            {
                id: "3",
                title: "German Visa Categories & Pathways",
                component: Section3_VisaCategories_1.Section3_VisaCategories,
                dataKey: "visaCategories",
            },
            {
                id: "4",
                title: "Global Skill Demand Mapping",
                component: Section4_SkillDemand_2.Section4_SkillDemand,
                dataKey: "skillDemand",
            },
            {
                id: "5",
                title: "Job Opportunities by Role & City",
                component: Section5_JobOpportunities_1.Section5_JobOpportunities,
                dataKey: "jobOpportunities",
            },
            {
                id: "6",
                title: "Compensation Benchmarking",
                component: Section6_Compensation_1.Section6_Compensation,
                dataKey: "compensation",
            },
            {
                id: "7",
                title: "About WorldVisa",
                component: Section7_AboutWorldVisa_1.Section7_AboutWorldVisa,
                dataKey: "aboutWorldVisa",
            },
            {
                id: "8",
                title: "WorldVisa Immigration Timeline",
                component: Section8_WorldVisaTimeline_1.Section8_WorldVisaTimeline,
                dataKey: "worldVisaTimeline",
            },
        ],
        dataKey: "germany",
    },
};
// Helper functions
function getCountryConfig(countryCode) {
    return exports.COUNTRY_REGISTRY[countryCode.toLowerCase()];
}
function getCountriesConfig(countryCodes) {
    return countryCodes
        .map((code) => getCountryConfig(code))
        .filter((config) => config !== undefined);
}
function getAllCountryCodes() {
    return Object.keys(exports.COUNTRY_REGISTRY);
}
function getCountryByName(name) {
    return Object.values(exports.COUNTRY_REGISTRY).find((config) => config.name.toLowerCase() === name.toLowerCase());
}
