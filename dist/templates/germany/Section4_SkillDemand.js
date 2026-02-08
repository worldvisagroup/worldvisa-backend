"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section4_SkillDemand = Section4_SkillDemand;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("../shared/SectionHeader");
function Section4_SkillDemand({ data }) {
    return (react_1.default.createElement("div", { className: "section page" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "4", title: "Global Skill Demand Mapping" }),
        react_1.default.createElement("div", { style: { marginBottom: '12pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '4pt' } }, "4.1 Mapping Your Core Skills to German Market"),
            react_1.default.createElement("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '12pt' } },
                react_1.default.createElement("thead", null,
                    react_1.default.createElement("tr", { style: { backgroundColor: '#F8F9FB' } },
                        react_1.default.createElement("th", { style: { padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' } }, "Your Skill"),
                        react_1.default.createElement("th", { style: { padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' } }, "IT Market Demand"),
                        react_1.default.createElement("th", { style: { padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' } }, "Salary Impact"),
                        react_1.default.createElement("th", { style: { padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' } }, "Shortage Status"))),
                react_1.default.createElement("tbody", null, data.skillMapping.map((skill, index) => (react_1.default.createElement("tr", { key: index, style: { backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FAFAFA' } },
                    react_1.default.createElement("td", { style: { padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#111827', fontWeight: 600 } }, skill.skill),
                    react_1.default.createElement("td", { style: { padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB' } },
                        react_1.default.createElement("span", { style: {
                                display: 'inline-block',
                                padding: '1pt 6pt',
                                backgroundColor: skill.marketDemand.toLowerCase().includes('very high') ? '#ECFDF5' : skill.marketDemand.toLowerCase().includes('high') ? '#F0FDF4' : '#FFFBEB',
                                color: skill.marketDemand.toLowerCase().includes('very high') ? '#059669' : skill.marketDemand.toLowerCase().includes('high') ? '#059669' : '#92400E',
                                fontSize: '10pt',
                                fontWeight: 600,
                                borderRadius: '3pt'
                            } }, skill.marketDemand)),
                    react_1.default.createElement("td", { style: { padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#4B5563' } }, skill.salaryImpact),
                    react_1.default.createElement("td", { style: { padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#4B5563' } }, skill.shortageStatus))))))),
        react_1.default.createElement("div", { style: { marginBottom: '12pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '4pt' } }, "4.2 Germany's Tech Skill Shortage"),
            react_1.default.createElement("p", { style: { fontSize: '12pt', fontWeight: 600, color: '#111827', marginTop: 0, marginBottom: '4pt' } }, data.techShortage.description),
            react_1.default.createElement("ul", { style: { margin: 0, paddingLeft: '14pt', marginBottom: '6pt' } }, data.techShortage.marketFacts.map((fact, index) => (react_1.default.createElement("li", { key: index, style: { fontSize: '12pt', color: '#4B5563', marginBottom: '3pt', lineHeight: 1.4 } }, fact)))),
            react_1.default.createElement("div", { style: { borderLeft: '3pt solid #059669', backgroundColor: '#F0FDF4', padding: '6pt 10pt' } },
                react_1.default.createElement("p", { style: { fontSize: '12pt', color: '#111827', margin: 0 } },
                    react_1.default.createElement("strong", null, "Conclusion:"),
                    " ",
                    react_1.default.createElement("span", { style: { color: '#4B5563' } }, data.techShortage.conclusion)))),
        react_1.default.createElement("div", { style: { marginBottom: '8pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '4pt' } }, "4.3 Demand Level by City"),
            react_1.default.createElement("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '12pt' } },
                react_1.default.createElement("thead", null,
                    react_1.default.createElement("tr", { style: { backgroundColor: '#F8F9FB' } },
                        react_1.default.createElement("th", { style: { padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' } }, "City"),
                        react_1.default.createElement("th", { style: { padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' } }, "Tech Market"),
                        react_1.default.createElement("th", { style: { padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' } }, "Job Opportunities"),
                        react_1.default.createElement("th", { style: { padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' } }, "Salary Range"),
                        react_1.default.createElement("th", { style: { padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' } }, "Type"))),
                react_1.default.createElement("tbody", null, data.demandByCity.map((city, index) => (react_1.default.createElement("tr", { key: index, style: { backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FAFAFA' } },
                    react_1.default.createElement("td", { style: { padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#111827', fontWeight: 600 } }, city.city),
                    react_1.default.createElement("td", { style: { padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#4B5563' } }, city.techMarket),
                    react_1.default.createElement("td", { style: { padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#4B5563' } }, city.jobOpportunities),
                    react_1.default.createElement("td", { style: { padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#4B5563' } }, city.salaryRange),
                    react_1.default.createElement("td", { style: { padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#4B5563' } }, city.type)))))))));
}
