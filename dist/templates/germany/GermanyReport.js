"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GermanyReport = GermanyReport;
const react_1 = __importDefault(require("react"));
const styles_1 = require("../shared/styles");
const CoverPage_1 = require("../shared/CoverPage");
const TableOfContents_1 = require("../shared/TableOfContents");
const Section1_ExecutiveSummary_1 = require("./Section1_ExecutiveSummary");
const Section2_ProfessionalProfile_1 = require("./Section2_ProfessionalProfile");
const Section3_VisaCategories_1 = require("./Section3_VisaCategories");
const Section4_SkillDemand_1 = require("./Section4_SkillDemand");
const Section5_JobOpportunities_1 = require("./Section5_JobOpportunities");
const Section6_Compensation_1 = require("./Section6_Compensation");
const Section7_AboutWorldVisa_1 = require("./Section7_AboutWorldVisa");
const Section8_WorldVisaTimeline_1 = require("./Section8_WorldVisaTimeline");
const ThankYouPage_1 = require("../shared/ThankYouPage");
function GermanyReport({ data }) {
    return (react_1.default.createElement("html", null,
        react_1.default.createElement("head", null,
            react_1.default.createElement("meta", { charSet: "utf-8" }),
            react_1.default.createElement("title", null,
                "WorldVisa Germany Report - ",
                data.meta.userName),
            react_1.default.createElement("style", { dangerouslySetInnerHTML: { __html: styles_1.pdfStyles } })),
        react_1.default.createElement("body", null,
            react_1.default.createElement(CoverPage_1.CoverPage, { data: data.coverPage, meta: data.meta }),
            react_1.default.createElement(TableOfContents_1.TableOfContents, null),
            react_1.default.createElement(Section1_ExecutiveSummary_1.Section1_ExecutiveSummary, { data: data.executiveSummary }),
            react_1.default.createElement(Section2_ProfessionalProfile_1.Section2_ProfessionalProfile, { data: data.professionalProfile }),
            react_1.default.createElement(Section3_VisaCategories_1.Section3_VisaCategories, { data: data.visaCategories }),
            react_1.default.createElement(Section4_SkillDemand_1.Section4_SkillDemand, { data: data.skillDemand }),
            react_1.default.createElement(Section5_JobOpportunities_1.Section5_JobOpportunities, { data: data.jobOpportunities }),
            react_1.default.createElement(Section6_Compensation_1.Section6_Compensation, { data: data.compensation }),
            react_1.default.createElement(Section7_AboutWorldVisa_1.Section7_AboutWorldVisa, null),
            react_1.default.createElement(Section8_WorldVisaTimeline_1.Section8_WorldVisaTimeline, null),
            react_1.default.createElement(ThankYouPage_1.ThankYouPage, null))));
}
