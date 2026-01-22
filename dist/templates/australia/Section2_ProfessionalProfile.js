"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section2_ProfessionalProfile = Section2_ProfessionalProfile;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("./shared/SectionHeader");
function Section2_ProfessionalProfile({ data }) {
    return (react_1.default.createElement("div", { className: "section professional-profile page" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "2", title: "Your Professional Profile \u2013 Assessment Input" }),
        react_1.default.createElement("div", { className: "subsection" },
            react_1.default.createElement("h3", null, "2.1 Core Skills & Occupation Mapping"),
            react_1.default.createElement("p", null, data.profileDescription),
            react_1.default.createElement("div", { style: {
                    background: '#F9FAFB',
                    border: '1pt solid #E5E7EB',
                    borderRadius: '8pt',
                    padding: '16pt',
                    marginTop: '16pt'
                } },
                react_1.default.createElement("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12pt' } },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("p", { style: { fontSize: '10pt', color: '#6B7280', marginBottom: '4pt', fontWeight: '600' } }, "Primary ANZSCO Code"),
                        react_1.default.createElement("p", { style: { fontSize: '13pt', fontWeight: '700', color: '#0066CC', marginBottom: '0' } }, data.anzscoCode)),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("p", { style: { fontSize: '10pt', color: '#6B7280', marginBottom: '4pt', fontWeight: '600' } }, "Skill Level"),
                        react_1.default.createElement("p", { style: { fontSize: '13pt', fontWeight: '700', color: '#0066CC', marginBottom: '0' } }, data.skillLevel))))),
        data.anzscoDetails && data.anzscoDetails.length > 0 && (react_1.default.createElement("div", { className: "subsection" },
            react_1.default.createElement("h3", null, "2.2 ANZSCO Occupation Options for Your Profile"),
            react_1.default.createElement("p", { style: { marginBottom: '16pt', fontSize: '10pt', color: '#6B7280' } }, "Your skills and experience qualify you for multiple ANZSCO occupation codes. Each code has specific requirements and opportunities:"),
            data.anzscoDetails.map((anzsco, index) => (react_1.default.createElement("div", { key: index, style: {
                    background: '#FFFFFF',
                    border: '1pt solid #E5E7EB',
                    borderLeft: '4pt solid #0066CC',
                    borderRadius: '6pt',
                    padding: '16pt',
                    marginBottom: '16pt',
                    pageBreakInside: 'avoid'
                } },
                react_1.default.createElement("div", { style: { display: 'flex', alignItems: 'center', marginBottom: '12pt' } },
                    react_1.default.createElement("span", { style: {
                            background: '#0066CC',
                            color: '#FFFFFF',
                            padding: '4pt 12pt',
                            borderRadius: '4pt',
                            fontSize: '11pt',
                            fontWeight: '700',
                            marginRight: '12pt'
                        } }, anzsco.code),
                    react_1.default.createElement("strong", { style: { fontSize: '14pt', color: '#1F2937' } }, anzsco.title)),
                react_1.default.createElement("p", { style: { fontSize: '10pt', color: '#4B5563', marginBottom: '12pt', lineHeight: '1.6' } }, anzsco.description),
                react_1.default.createElement("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16pt' } },
                    anzsco.keyResponsibilities && anzsco.keyResponsibilities.length > 0 && (react_1.default.createElement("div", null,
                        react_1.default.createElement("p", { style: { fontSize: '10pt', fontWeight: '600', color: '#1F2937', marginBottom: '8pt' } }, "Key Responsibilities:"),
                        react_1.default.createElement("ul", { style: { fontSize: '9pt', color: '#4B5563', marginLeft: '16pt', marginBottom: '0' } }, anzsco.keyResponsibilities.map((resp, idx) => (react_1.default.createElement("li", { key: idx, style: { marginBottom: '4pt' } }, resp)))))),
                    anzsco.skillsRequired && anzsco.skillsRequired.length > 0 && (react_1.default.createElement("div", null,
                        react_1.default.createElement("p", { style: { fontSize: '10pt', fontWeight: '600', color: '#1F2937', marginBottom: '8pt' } }, "Skills Required:"),
                        react_1.default.createElement("ul", { style: { fontSize: '9pt', color: '#4B5563', marginLeft: '16pt', marginBottom: '0' } }, anzsco.skillsRequired.map((skill, idx) => (react_1.default.createElement("li", { key: idx, style: { marginBottom: '4pt' } }, skill)))))))))))),
        data.skillsAssessment && (react_1.default.createElement("div", { className: "subsection" },
            react_1.default.createElement("h3", null, "2.3 Skills Assessment Process"),
            react_1.default.createElement("div", { style: {
                    background: '#EBF5FF',
                    border: '1pt solid #BFDBFE',
                    borderRadius: '8pt',
                    padding: '16pt'
                } },
                react_1.default.createElement("div", { style: { marginBottom: '16pt' } },
                    react_1.default.createElement("p", { style: { fontSize: '11pt', fontWeight: '600', color: '#1F2937', marginBottom: '4pt' } }, "Assessing Authority:"),
                    react_1.default.createElement("p", { style: { fontSize: '13pt', fontWeight: '700', color: '#0066CC', marginBottom: '0' } }, data.skillsAssessment.authority)),
                react_1.default.createElement("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12pt', marginBottom: '16pt' } },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("p", { style: { fontSize: '10pt', color: '#6B7280', marginBottom: '4pt' } }, "Process:"),
                        react_1.default.createElement("p", { style: { fontSize: '11pt', color: '#1F2937', marginBottom: '0' } }, data.skillsAssessment.process)),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("p", { style: { fontSize: '10pt', color: '#6B7280', marginBottom: '4pt' } }, "Timeline:"),
                        react_1.default.createElement("p", { style: { fontSize: '11pt', fontWeight: '600', color: '#1F2937', marginBottom: '0' } }, data.skillsAssessment.timeline))),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("p", { style: { fontSize: '10pt', fontWeight: '600', color: '#1F2937', marginBottom: '8pt' } }, "Requirements:"),
                    react_1.default.createElement("ul", { className: "checkmark-list" }, data.skillsAssessment.requirements.map((req, index) => (react_1.default.createElement("li", { key: index, style: { fontSize: '10pt', color: '#4B5563', marginBottom: '6pt' } }, req)))))))),
        (data.occupationCeiling || data.labourMarketInfo) && (react_1.default.createElement("div", { className: "subsection" },
            react_1.default.createElement("h3", null, "2.4 Occupation Demand & Availability"),
            data.occupationCeiling && (react_1.default.createElement("div", { style: {
                    background: '#D1FAE5',
                    border: '1pt solid #10B981',
                    borderRadius: '6pt',
                    padding: '12pt',
                    marginBottom: '12pt'
                } },
                react_1.default.createElement("p", { style: { marginBottom: '0', fontSize: '11pt' } },
                    react_1.default.createElement("strong", { style: { color: '#065F46' } }, "\u2713 Occupation Ceiling Status:"),
                    ' ',
                    react_1.default.createElement("span", { style: { color: '#047857' } }, data.occupationCeiling)))),
            data.labourMarketInfo && (react_1.default.createElement("div", { style: {
                    background: '#FFFBEB',
                    border: '1pt solid #FCD34D',
                    borderRadius: '6pt',
                    padding: '12pt'
                } },
                react_1.default.createElement("p", { style: { marginBottom: '0', fontSize: '11pt', lineHeight: '1.6' } },
                    react_1.default.createElement("strong", { style: { color: '#92400E' } }, "Labour Market Insight:"),
                    ' ',
                    react_1.default.createElement("span", { style: { color: '#78350F' } }, data.labourMarketInfo))))))));
}
