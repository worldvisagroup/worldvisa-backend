"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AustraliaReport = AustraliaReport;
const react_1 = __importDefault(require("react"));
const styles_1 = require("./shared/styles");
const CoverPage_1 = require("../shared/CoverPage");
const TableOfContents_1 = require("../shared/TableOfContents");
const Section1_ExecutiveSummary_1 = require("./Section1_ExecutiveSummary");
const Section2_ProfessionalProfile_1 = require("./Section2_ProfessionalProfile");
const Section3_VisaPathways_1 = require("./Section3_VisaPathways");
const Section4_SkillDemand_1 = require("./Section4_SkillDemand");
const Section5_TopEmployers_1 = require("./Section5_TopEmployers");
const Section6_SalaryVariation_1 = require("./Section6_SalaryVariation");
const Section7_Timeline_1 = require("./Section7_Timeline");
const Section8_RegulatoryAdvisor_1 = require("./Section8_RegulatoryAdvisor");
const ThankYouPage_1 = require("../shared/ThankYouPage");
function AustraliaReport({ data }) {
    return (react_1.default.createElement("html", { lang: "en" },
        react_1.default.createElement("head", null,
            react_1.default.createElement("meta", { charSet: "utf-8" }),
            react_1.default.createElement("meta", { name: "viewport", content: "width=device-width, initial-scale=1.0" }),
            react_1.default.createElement("title", null,
                "WorldVisa Australia Report - ",
                data.meta.userName),
            react_1.default.createElement("style", { dangerouslySetInnerHTML: { __html: styles_1.pdfStyles } })),
        react_1.default.createElement("body", null,
            react_1.default.createElement(CoverPage_1.CoverPage, { data: data.coverPage, meta: data.meta }),
            react_1.default.createElement(TableOfContents_1.TableOfContents, null),
            react_1.default.createElement("div", { className: "page-break" }),
            react_1.default.createElement("div", { className: "content-wrapper" },
                react_1.default.createElement(Section1_ExecutiveSummary_1.Section1_ExecutiveSummary, { data: data.executiveSummary }),
                react_1.default.createElement(Section2_ProfessionalProfile_1.Section2_ProfessionalProfile, { data: data.professionalProfile }),
                react_1.default.createElement(Section3_VisaPathways_1.Section3_VisaPathways, { data: data.visaPathways }),
                react_1.default.createElement(Section4_SkillDemand_1.Section4_SkillDemand, { data: data.skillDemand }),
                react_1.default.createElement(Section5_TopEmployers_1.Section5_TopEmployers, { data: data.topEmployers }),
                react_1.default.createElement(Section6_SalaryVariation_1.Section6_SalaryVariation, { data: data.salaryVariation }),
                react_1.default.createElement(Section7_Timeline_1.Section7_Timeline, null),
                react_1.default.createElement(Section8_RegulatoryAdvisor_1.Section8_RegulatoryAdvisor, null)),
            react_1.default.createElement("div", { className: "page-break" }),
            react_1.default.createElement(ThankYouPage_1.ThankYouPage, null))));
}
