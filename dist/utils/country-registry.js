"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COUNTRY_REGISTRY = void 0;
exports.getCountryConfig = getCountryConfig;
exports.getCountriesConfig = getCountriesConfig;
exports.getAllCountryCodes = getAllCountryCodes;
exports.getCountryByName = getCountryByName;
// Australia section imports
const Section1_ExecutiveSummary_1 = require("../templates/australia/Section1_ExecutiveSummary");
const Section2_ProfessionalProfile_1 = require("../templates/australia/Section2_ProfessionalProfile");
const Section3_VisaPathways_1 = require("../templates/australia/Section3_VisaPathways");
const Section4_SkillDemand_1 = require("../templates/australia/Section4_SkillDemand");
const Section5_TopEmployers_1 = require("../templates/australia/Section5_TopEmployers");
const Section6_SalaryVariation_1 = require("../templates/australia/Section6_SalaryVariation");
const Section7_Timeline_1 = require("../templates/australia/Section7_Timeline");
const Section8_RegulatoryAdvisor_1 = require("../templates/australia/Section8_RegulatoryAdvisor");
// Canada section imports
const Section1_ExecutiveSummary_2 = require("../templates/canada/Section1_ExecutiveSummary");
const Section2_ProfessionalProfile_2 = require("../templates/canada/Section2_ProfessionalProfile");
const Section3_NoJobOffer_1 = require("../templates/canada/Section3_NoJobOffer");
const Section4_NoSponsor_1 = require("../templates/canada/Section4_NoSponsor");
const Section5_SkillDemand_1 = require("../templates/canada/Section5_SkillDemand");
const Section6_TopEmployers_1 = require("../templates/canada/Section6_TopEmployers");
const Section7_SalaryVariation_1 = require("../templates/canada/Section7_SalaryVariation");
const Section8_VisaPathways_1 = require("../templates/canada/Section8_VisaPathways");
const Section9_AboutWorldVisa_1 = require("../templates/canada/Section9_AboutWorldVisa");
exports.COUNTRY_REGISTRY = {
    australia: {
        code: 'australia',
        name: 'Australia',
        flagPath: '/images/flags/australia.png',
        colors: {
            primary: '#0066CC',
            gradient: 'linear-gradient(135deg, #0066CC 0%, #004999 100%)'
        },
        usps: [
            'Points-based skilled migration without job offer',
            'High salaries (AUD $130K-$190K for developers)',
            'Clear pathway to permanent residency in 12-18 months',
            'World-class quality of life and healthcare system',
            'Strong tech sector in Sydney, Melbourne, Brisbane'
        ],
        sections: [
            { id: '1', title: 'Executive Summary', component: Section1_ExecutiveSummary_1.Section1_ExecutiveSummary, dataKey: 'executiveSummary' },
            { id: '2', title: 'Professional Profile Assessment', component: Section2_ProfessionalProfile_1.Section2_ProfessionalProfile, dataKey: 'professionalProfile' },
            { id: '3', title: 'Visa Pathways Without Job Offer', component: Section3_VisaPathways_1.Section3_VisaPathways, dataKey: 'visaPathways' },
            { id: '4', title: 'Global Skill Demand Mapping', component: Section4_SkillDemand_1.Section4_SkillDemand, dataKey: 'skillDemand' },
            { id: '5', title: 'Top 20 Target Employers', component: Section5_TopEmployers_1.Section5_TopEmployers, dataKey: 'topEmployers' },
            { id: '6', title: 'City-wise Salary Variation', component: Section6_SalaryVariation_1.Section6_SalaryVariation, dataKey: 'salaryVariation' },
            { id: '7', title: 'End-to-End Timeline', component: Section7_Timeline_1.Section7_Timeline, dataKey: 'timeline' },
            { id: '8', title: 'Why Use a Regulated Advisor', component: Section8_RegulatoryAdvisor_1.Section8_RegulatoryAdvisor, dataKey: 'regulatoryAdvisor' },
        ],
        dataKey: 'australia'
    },
    canada: {
        code: 'canada',
        name: 'Canada',
        flagPath: '/images/flags/canada.png',
        colors: {
            primary: '#D32F2F',
            gradient: 'linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%)'
        },
        usps: [
            'Express Entry & Provincial Nominee Programs',
            'Tech talent shortage with 250,000+ open positions',
            'Competitive salaries (CAD $120K-$180K for developers)',
            'Fast-track immigration for IT professionals',
            'Multicultural society with strong tech hubs in major cities'
        ],
        sections: [
            { id: '1', title: 'Executive Summary', component: Section1_ExecutiveSummary_2.Section1_ExecutiveSummary, dataKey: 'executiveSummary' },
            { id: '2', title: 'Your Professional Profile', component: Section2_ProfessionalProfile_2.Section2_ProfessionalProfile, dataKey: 'professionalProfile' },
            { id: '3', title: 'Move Without Job Offer', component: Section3_NoJobOffer_1.Section3_NoJobOffer, dataKey: 'noJobOffer' },
            { id: '4', title: 'Move Without Sponsor', component: Section4_NoSponsor_1.Section4_NoSponsor, dataKey: 'noSponsor' },
            { id: '5', title: 'Global Skill Demand Mapping', component: Section5_SkillDemand_1.Section5_SkillDemand, dataKey: 'skillDemand' },
            { id: '6', title: 'Top 20 Target Employers', component: Section6_TopEmployers_1.Section6_TopEmployers, dataKey: 'topEmployers' },
            { id: '7', title: 'City-wise Salary Variation', component: Section7_SalaryVariation_1.Section7_SalaryVariation, dataKey: 'salaryVariation' },
            { id: '8', title: 'Visa Pathways & Migration Strategy', component: Section8_VisaPathways_1.Section8_VisaPathways, dataKey: 'visaPathways' },
            { id: '9', title: 'About WorldVisa', component: Section9_AboutWorldVisa_1.Section9_AboutWorldVisa, dataKey: 'aboutWorldVisa' },
        ],
        dataKey: 'canada'
    },
    // Future: Just add Germany config here!
    // germany: {
    //   code: 'germany',
    //   name: 'Germany',
    //   flagPath: '/images/flags/germany.png',
    //   colors: {
    //     primary: '#000000',
    //     gradient: 'linear-gradient(135deg, #000000 0%, #DD0000 100%)'
    //   },
    //   usps: [
    //     'Blue Card program for IT professionals',
    //     'High demand for software developers (300K+ openings)',
    //     'Excellent salaries (€60K-€90K for mid-level)',
    //     'Path to citizenship in 6-8 years',
    //     'Central location in Europe with excellent quality of life'
    //   ],
    //   sections: [
    //     { id: '1', title: 'Executive Summary', component: GER_Section1, dataKey: 'executiveSummary' },
    //     // ... all Germany sections ...
    //   ],
    //   dataKey: 'germany'
    // }
};
// Helper functions
function getCountryConfig(countryCode) {
    return exports.COUNTRY_REGISTRY[countryCode.toLowerCase()];
}
function getCountriesConfig(countryCodes) {
    return countryCodes
        .map(code => getCountryConfig(code))
        .filter((config) => config !== undefined);
}
function getAllCountryCodes() {
    return Object.keys(exports.COUNTRY_REGISTRY);
}
function getCountryByName(name) {
    return Object.values(exports.COUNTRY_REGISTRY).find(config => config.name.toLowerCase() === name.toLowerCase());
}
