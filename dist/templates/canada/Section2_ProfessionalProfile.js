"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section2_ProfessionalProfile = Section2_ProfessionalProfile;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("../shared/SectionHeader");
function Section2_ProfessionalProfile({ data }) {
    return (react_1.default.createElement("div", { className: "section page" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "2", title: "Your Professional Profile" }),
        react_1.default.createElement("div", { style: { marginBottom: '12pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 } }, "2.1 Core Skills & Occupation Mapping (to NOC)"),
            react_1.default.createElement("p", { style: { fontSize: '12pt', color: '#4B5563', lineHeight: 1.5, margin: '0 0 6pt 0' } }, "Your profile maps to the following Canadian NOC codes:"),
            data.nocCodes.map((noc, index) => (react_1.default.createElement("div", { key: index, style: {
                    borderLeft: '3pt solid #1B2A4A',
                    padding: '6pt 10pt',
                    marginBottom: '8pt',
                    backgroundColor: '#F8F9FB',
                } },
                react_1.default.createElement("div", { style: { fontSize: '12pt', fontWeight: 700, color: '#1B2A4A', marginBottom: '3pt' } },
                    noc.type,
                    ": ",
                    noc.code,
                    " \u2013 ",
                    noc.title),
                react_1.default.createElement("p", { style: { fontSize: '12pt', color: '#4B5563', lineHeight: 1.5, margin: '0 0 4pt 0' } },
                    react_1.default.createElement("span", { style: { fontWeight: 600, color: '#111827' } }, "Definition:"),
                    " ",
                    noc.definition),
                noc.alignment.length > 0 && (react_1.default.createElement("div", { style: { marginBottom: '4pt' } },
                    react_1.default.createElement("span", { style: { fontSize: '12pt', fontWeight: 600, color: '#111827' } }, "Your Alignment:"),
                    react_1.default.createElement("ul", { style: { margin: '2pt 0 0 0', paddingLeft: '14pt', fontSize: '12pt', color: '#4B5563', lineHeight: 1.5 } }, noc.alignment.map((item, idx) => (react_1.default.createElement("li", { key: idx, style: { marginBottom: '1pt' } }, item)))))),
                noc.credentialMatch.length > 0 && (react_1.default.createElement("div", null,
                    react_1.default.createElement("span", { style: { fontSize: '12pt', fontWeight: 600, color: '#111827' } }, "Credential Match:"),
                    react_1.default.createElement("ul", { style: { margin: '2pt 0 0 0', paddingLeft: '14pt', fontSize: '12pt', color: '#4B5563', lineHeight: 1.5 } }, noc.credentialMatch.map((item, idx) => (react_1.default.createElement("li", { key: idx, style: { marginBottom: '1pt' } },
                        react_1.default.createElement("span", { dangerouslySetInnerHTML: { __html: '&#10003;' } }),
                        " ",
                        item)))))))))),
        react_1.default.createElement("div", { style: { marginBottom: '6pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 } }, "2.2 Years of Experience & Seniority Level"),
            react_1.default.createElement("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '12pt' } },
                react_1.default.createElement("thead", null,
                    react_1.default.createElement("tr", null,
                        react_1.default.createElement("th", { style: { textAlign: 'left', padding: '5pt 6pt', backgroundColor: '#1B2A4A', color: '#FFFFFF', fontWeight: 600, fontSize: '10pt' } }, "Metric"),
                        react_1.default.createElement("th", { style: { textAlign: 'left', padding: '5pt 6pt', backgroundColor: '#1B2A4A', color: '#FFFFFF', fontWeight: 600, fontSize: '10pt' } }, "Value"))),
                react_1.default.createElement("tbody", null, [
                    { label: 'Total Years', value: data.experienceMetrics.totalYears },
                    { label: 'Current Role', value: data.experienceMetrics.currentRole },
                    { label: 'Seniority Level', value: data.experienceMetrics.seniorityLevel },
                    { label: 'Age', value: data.experienceMetrics.age },
                    { label: 'Age Advantage (CRS)', value: data.experienceMetrics.ageAdvantage },
                ].map((row, i) => (react_1.default.createElement("tr", { key: i, style: { backgroundColor: i % 2 === 0 ? '#F8F9FB' : '#FFFFFF' } },
                    react_1.default.createElement("td", { style: { padding: '4pt 6pt', fontWeight: 600, color: '#111827', borderBottom: '1pt solid #E5E7EB' } }, row.label),
                    react_1.default.createElement("td", { style: { padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' } }, row.value)))))),
            react_1.default.createElement("div", { style: { borderLeft: '3pt solid #1B2A4A', padding: '6pt 10pt', marginTop: '8pt', backgroundColor: '#F8F9FB' } },
                react_1.default.createElement("p", { style: { fontSize: '12pt', margin: 0 } },
                    react_1.default.createElement("span", { style: { fontWeight: 600, color: '#111827' } }, "CRS Scoring Advantage:"),
                    ' ',
                    react_1.default.createElement("span", { style: { color: '#4B5563' } }, data.experienceMetrics.crsAdvantage))))));
}
