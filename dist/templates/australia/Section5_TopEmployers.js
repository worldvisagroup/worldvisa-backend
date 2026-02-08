"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section5_TopEmployers = Section5_TopEmployers;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("./shared/SectionHeader");
function Section5_TopEmployers({ data }) {
    return (react_1.default.createElement("div", { className: "section page" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "5", title: "Top 20 Target Employers (by Sector, Australia)" }),
        react_1.default.createElement("p", { style: { fontSize: '12pt', color: '#4B5563', marginBottom: '12pt', lineHeight: '1.5' } }, "Based on your professional background, these companies represent the best opportunities for your skills and experience."),
        data.tiers.map((tier, tierIndex) => (react_1.default.createElement("div", { key: tierIndex, style: { marginBottom: '12pt', pageBreakInside: 'avoid' } },
            react_1.default.createElement("div", { style: { borderLeft: '3pt solid #1B2A4A', padding: '6pt 10pt', marginBottom: '6pt', background: '#F8F9FB' } },
                react_1.default.createElement("div", { style: { fontSize: '12pt', fontWeight: 700, color: '#111827' } }, tier.tierName),
                react_1.default.createElement("div", { style: { fontSize: '10pt', color: '#9CA3AF', marginTop: '2pt' } }, tier.tierDescription)),
            react_1.default.createElement("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6pt' } }, tier.companies.map((company, companyIndex) => (react_1.default.createElement("div", { key: companyIndex, style: { padding: '6pt 8pt', border: '0.5pt solid #E5E7EB', borderRadius: '3pt', background: '#FFFFFF', pageBreakInside: 'avoid' } },
                react_1.default.createElement("span", { style: { fontWeight: 600, color: '#1F2937', fontSize: '12pt', display: 'block', marginBottom: '2pt' } }, company.name),
                react_1.default.createElement("span", { style: { fontSize: '10pt', color: '#6B7280', background: '#F3F4F6', padding: '1pt 5pt', borderRadius: '2pt', display: 'inline-block', marginBottom: '3pt' } }, company.location),
                react_1.default.createElement("div", { style: { fontSize: '12pt', color: '#4B5563', marginTop: '2pt', lineHeight: '1.3' } }, company.description)))))))),
        react_1.default.createElement("div", { style: { marginTop: '8pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 } }, "Why These Companies?"),
            react_1.default.createElement("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '12pt' } },
                react_1.default.createElement("tbody", null, [
                    { label: 'Actively Hiring', value: data.whyTheseCompanies.activelyHiring },
                    { label: 'Sponsor Migrants', value: data.whyTheseCompanies.sponsorMigrants },
                    { label: 'Growth Trajectory', value: data.whyTheseCompanies.growthTrajectory },
                    { label: 'Your Fit', value: data.whyTheseCompanies.yourFit },
                    { label: 'Learning Opportunity', value: data.whyTheseCompanies.learningOpportunity },
                ].map((row, i) => (react_1.default.createElement("tr", { key: i, style: { background: i % 2 === 0 ? '#F8F9FB' : '#FFFFFF' } },
                    react_1.default.createElement("td", { style: { padding: '5pt 8pt', fontWeight: 600, color: '#111827', borderBottom: '0.5pt solid #E5E7EB', width: '25%', verticalAlign: 'top' } }, row.label),
                    react_1.default.createElement("td", { style: { padding: '5pt 8pt', color: '#4B5563', borderBottom: '0.5pt solid #E5E7EB', lineHeight: '1.4' } }, row.value)))))))));
}
