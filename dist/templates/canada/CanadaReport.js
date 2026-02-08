"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanadaReport = CanadaReport;
const react_1 = __importDefault(require("react"));
const styles_1 = require("../shared/styles");
const CoverPage_1 = require("../shared/CoverPage");
const TableOfContents_1 = require("../shared/TableOfContents");
const Section1_ExecutiveSummary_1 = require("./Section1_ExecutiveSummary");
const Section2_ProfessionalProfile_1 = require("./Section2_ProfessionalProfile");
const Section3_NoJobOffer_1 = require("./Section3_NoJobOffer");
const Section4_NoSponsor_1 = require("./Section4_NoSponsor");
const Section5_SkillDemand_1 = require("./Section5_SkillDemand");
const Section6_TopEmployers_1 = require("./Section6_TopEmployers");
const Section7_SalaryVariation_1 = require("./Section7_SalaryVariation");
const Section8_VisaPathways_1 = require("./Section8_VisaPathways");
const Section9_AboutWorldVisa_1 = require("./Section9_AboutWorldVisa");
const ThankYouPage_1 = require("../shared/ThankYouPage");
const Section10_WorldVisaTimeline_1 = require("./Section10_WorldVisaTimeline");
function CanadaReport({ data }) {
    return (react_1.default.createElement("html", null,
        react_1.default.createElement("head", null,
            react_1.default.createElement("meta", { charSet: "utf-8" }),
            react_1.default.createElement("title", null,
                "WorldVisa Canada Report - ",
                data.meta.userName),
            react_1.default.createElement("style", { dangerouslySetInnerHTML: { __html: styles_1.pdfStyles } })),
        react_1.default.createElement("body", null,
            react_1.default.createElement(CoverPage_1.CoverPage, { data: data.coverPage, meta: data.meta }),
            react_1.default.createElement(TableOfContents_1.TableOfContents, null),
            react_1.default.createElement(Section1_ExecutiveSummary_1.Section1_ExecutiveSummary, { data: data.executiveSummary }),
            react_1.default.createElement(Section2_ProfessionalProfile_1.Section2_ProfessionalProfile, { data: data.professionalProfile }),
            react_1.default.createElement(Section3_NoJobOffer_1.Section3_NoJobOffer, { data: data.noJobOffer }),
            react_1.default.createElement(Section4_NoSponsor_1.Section4_NoSponsor, { data: data.noSponsor }),
            react_1.default.createElement(Section5_SkillDemand_1.Section5_SkillDemand, { data: data.skillDemand }),
            react_1.default.createElement(Section6_TopEmployers_1.Section6_TopEmployers, { data: data.topEmployers }),
            react_1.default.createElement(Section7_SalaryVariation_1.Section7_SalaryVariation, { data: data.salaryVariation }),
            react_1.default.createElement(Section8_VisaPathways_1.Section8_VisaPathways, { data: data.visaPathways }),
            react_1.default.createElement(Section9_AboutWorldVisa_1.Section9_AboutWorldVisa, null),
            react_1.default.createElement(Section10_WorldVisaTimeline_1.Section10_WorldVisaTimeline, null),
            react_1.default.createElement(ThankYouPage_1.ThankYouPage, null))));
}
