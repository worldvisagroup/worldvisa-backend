"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section4_SkillDemand = Section4_SkillDemand;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("../shared/SectionHeader");
const Table_1 = require("../shared/Table");
function Section4_SkillDemand({ data }) {
    return (react_1.default.createElement("div", { className: "section skill-demand", style: { pageBreakBefore: 'always' } },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "4", title: "Global Skill Demand Mapping" }),
        react_1.default.createElement("div", { className: "subsection", style: { marginTop: '8pt' } },
            react_1.default.createElement("h3", null, "4.1 Mapping Your Core Skills to German Market"),
            react_1.default.createElement(Table_1.Table, { columns: [
                    { header: 'Your Skill', key: 'skill' },
                    { header: 'IT Market Demand', key: 'marketDemand' },
                    { header: 'Salary Impact', key: 'salaryImpact' },
                    { header: 'Shortage Status', key: 'shortageStatus' },
                ], data: data.skillMapping.map(skill => ({
                    skill: skill.skill,
                    marketDemand: skill.marketDemand,
                    salaryImpact: skill.salaryImpact,
                    shortageStatus: skill.shortageStatus,
                })) }),
            react_1.default.createElement("p", { style: { marginTop: '12pt' } },
                react_1.default.createElement("strong", null, "Verdict:"),
                " Your skill set perfectly matches German IT shortage occupations, with ",
                react_1.default.createElement("strong", null, "exceptional advantage"),
                " in visa/immigration tech domain.")),
        react_1.default.createElement("div", { className: "subsection", style: { marginTop: '8pt' } },
            react_1.default.createElement("h3", null, "4.2 Germany's Tech Skill Shortage"),
            react_1.default.createElement("p", null,
                react_1.default.createElement("strong", null, data.techShortage.description)),
            react_1.default.createElement("ul", { style: { marginLeft: '20pt', marginBottom: '12pt' } }, data.techShortage.marketFacts.map((fact, index) => (react_1.default.createElement("li", { key: index, style: { marginBottom: '6pt' } }, fact)))),
            react_1.default.createElement("p", null,
                react_1.default.createElement("strong", null, "Conclusion:"),
                " ",
                data.techShortage.conclusion)),
        react_1.default.createElement("div", { className: "subsection", style: { marginTop: '8pt' } },
            react_1.default.createElement("h3", null, "4.3 Demand Level by City"),
            react_1.default.createElement(Table_1.Table, { columns: [
                    { header: 'City', key: 'city' },
                    { header: 'Tech Market', key: 'techMarket' },
                    { header: 'Job Opportunities', key: 'jobOpportunities' },
                    { header: 'Salary Range', key: 'salaryRange' },
                    { header: 'Type', key: 'type' },
                ], data: data.demandByCity.map(city => ({
                    city: city.city,
                    techMarket: city.techMarket,
                    jobOpportunities: city.jobOpportunities,
                    salaryRange: city.salaryRange,
                    type: city.type,
                })) }))));
}
