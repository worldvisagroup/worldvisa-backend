"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section6_TopEmployers = Section6_TopEmployers;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("../shared/SectionHeader");
function Section6_TopEmployers({ data }) {
    return (react_1.default.createElement("div", { className: "section page" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "6", title: "Top Target Employers (by Province & Sector)" }),
        data.provinces.map((provinceData, index) => (react_1.default.createElement("div", { key: index, style: { marginBottom: '20pt', pageBreakInside: 'avoid' } },
            react_1.default.createElement("div", { style: {
                    borderLeft: '3pt solid #1B2A4A',
                    padding: '5pt 10pt',
                    marginBottom: '6pt',
                    background: '#F8F9FB',
                } },
                react_1.default.createElement("div", { style: { fontSize: '12pt', fontWeight: 700, color: '#111827' } },
                    provinceData.province,
                    " / ",
                    provinceData.city),
                react_1.default.createElement("div", { style: { fontSize: '10pt', color: '#9CA3AF', marginTop: '1pt' } },
                    "Top ",
                    provinceData.employers.length,
                    " Target Employers")),
            react_1.default.createElement("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '12pt', marginBottom: '4pt' } },
                react_1.default.createElement("thead", null,
                    react_1.default.createElement("tr", null, ['Rank', 'Company', 'Industry', 'Salary (CAD)', 'Visa Sponsorship'].map((h, i) => (react_1.default.createElement("th", { key: i, style: {
                            padding: '5pt 6pt',
                            textAlign: i === 0 ? 'center' : 'left',
                            fontWeight: 700,
                            fontSize: '10pt',
                            color: '#FFFFFF',
                            background: '#1B2A4A',
                            borderBottom: '1pt solid #E5E7EB',
                        } }, h))))),
                react_1.default.createElement("tbody", null, provinceData.employers.map((employer, i) => (react_1.default.createElement("tr", { key: i, style: { background: i % 2 === 0 ? '#FFFFFF' : '#F8F9FB' } },
                    react_1.default.createElement("td", { style: {
                            padding: '4pt 6pt',
                            textAlign: 'center',
                            fontWeight: 600,
                            color: '#1B2A4A',
                            borderBottom: '0.5pt solid #E5E7EB',
                        } }, employer.rank),
                    react_1.default.createElement("td", { style: {
                            padding: '4pt 6pt',
                            fontWeight: 600,
                            color: '#111827',
                            borderBottom: '0.5pt solid #E5E7EB',
                        } }, employer.company),
                    react_1.default.createElement("td", { style: {
                            padding: '4pt 6pt',
                            color: '#4B5563',
                            borderBottom: '0.5pt solid #E5E7EB',
                        } }, employer.industry),
                    react_1.default.createElement("td", { style: {
                            padding: '4pt 6pt',
                            color: '#4B5563',
                            borderBottom: '0.5pt solid #E5E7EB',
                        } }, employer.salary),
                    react_1.default.createElement("td", { style: {
                            padding: '4pt 6pt',
                            color: employer.visaSponsorship?.toLowerCase().includes('yes') ? '#059669' : '#4B5563',
                            fontWeight: employer.visaSponsorship?.toLowerCase().includes('yes') ? 600 : 400,
                            borderBottom: '0.5pt solid #E5E7EB',
                        } }, employer.visaSponsorship)))))),
            provinceData.employers.some(e => e.whyHireYou) && (react_1.default.createElement("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '10pt', marginBottom: '6pt' } },
                react_1.default.createElement("tbody", null, provinceData.employers.map((employer, i) => (employer.whyHireYou ? (react_1.default.createElement("tr", { key: i, style: { background: i % 2 === 0 ? '#FFFFFF' : '#F8F9FB' } },
                    react_1.default.createElement("td", { style: {
                            padding: '3pt 6pt',
                            fontWeight: 600,
                            color: '#111827',
                            borderBottom: '0.5pt solid #E5E7EB',
                            width: '20%',
                            verticalAlign: 'top',
                        } }, employer.company),
                    react_1.default.createElement("td", { style: {
                            padding: '3pt 6pt',
                            color: '#4B5563',
                            borderBottom: '0.5pt solid #E5E7EB',
                            lineHeight: '1.4',
                        } }, employer.whyHireYou))) : null))))))))));
}
