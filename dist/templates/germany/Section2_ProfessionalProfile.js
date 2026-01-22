"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section2_ProfessionalProfile = Section2_ProfessionalProfile;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("../shared/SectionHeader");
const Table_1 = require("../shared/Table");
function Section2_ProfessionalProfile({ data }) {
    return (react_1.default.createElement("div", { className: "section professional-profile" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "2", title: "Your Professional Profile" }),
        react_1.default.createElement("div", { className: "subsection", style: { marginTop: '8pt' } },
            react_1.default.createElement("h3", null, "2.1 Core Skills & Occupation Mapping (to German Classifications)"),
            react_1.default.createElement("p", null,
                "Your profile maps to ",
                react_1.default.createElement("strong", null, "two primary German occupation categories:")),
            react_1.default.createElement("p", null,
                react_1.default.createElement("strong", null,
                    "Primary: ",
                    data.coreSkills.primaryRole.title)),
            react_1.default.createElement("ul", { style: { marginLeft: '20pt', marginBottom: '12pt' } }, data.coreSkills.primaryRole.responsibilities.map((resp, index) => (react_1.default.createElement("li", { key: index, style: { marginBottom: '4pt' } }, resp)))),
            react_1.default.createElement("p", null,
                react_1.default.createElement("strong", null,
                    "Secondary: ",
                    data.coreSkills.secondaryRole.title)),
            react_1.default.createElement("ul", { style: { marginLeft: '20pt', marginBottom: '12pt' } }, data.coreSkills.secondaryRole.responsibilities.map((resp, index) => (react_1.default.createElement("li", { key: index, style: { marginBottom: '4pt' } }, resp)))),
            react_1.default.createElement("p", null,
                react_1.default.createElement("strong", null, "Verdict:"),
                " ",
                data.coreSkills.verdict)),
        react_1.default.createElement("div", { className: "subsection", style: { marginTop: '8pt' } },
            react_1.default.createElement("h3", null, "2.2 Years of Experience & Seniority Level"),
            react_1.default.createElement(Table_1.Table, { columns: [
                    { header: 'Metric', key: 'metric' },
                    { header: 'Your Profile', key: 'yourProfile' },
                ], data: data.experience.map(exp => ({
                    metric: exp.metric,
                    yourProfile: exp.yourProfile,
                })) })),
        react_1.default.createElement("div", { className: "subsection", style: { marginTop: '8pt' } },
            react_1.default.createElement("h3", null, "2.3 Language Proficiency & Education Level"),
            react_1.default.createElement("p", null,
                react_1.default.createElement("strong", null, "English Language Proficiency")),
            react_1.default.createElement(Table_1.Table, { columns: [
                    { header: 'Requirement', key: 'requirement' },
                    { header: 'Status', key: 'status' },
                    { header: 'Action Needed', key: 'actionNeeded' },
                ], data: data.languageAndEducation.englishProficiency.map(lang => ({
                    requirement: lang.requirement,
                    status: lang.status,
                    actionNeeded: lang.actionNeeded,
                })) }),
            react_1.default.createElement("p", { style: { marginTop: '12pt' } },
                react_1.default.createElement("strong", null, "German Language Proficiency")),
            react_1.default.createElement("p", null, data.languageAndEducation.germanNote),
            react_1.default.createElement("p", { style: { marginTop: '12pt' } },
                react_1.default.createElement("strong", null, "Education Level")),
            react_1.default.createElement(Table_1.Table, { columns: [
                    { header: 'Qualification', key: 'qualification' },
                    { header: 'Details', key: 'details' },
                    { header: 'Germany Recognition', key: 'germanyRecognition' },
                    { header: 'Status', key: 'status' },
                ], data: data.languageAndEducation.education.map(edu => ({
                    qualification: edu.qualification,
                    details: edu.details,
                    germanyRecognition: edu.germanyRecognition,
                    status: edu.status,
                })) }))));
}
