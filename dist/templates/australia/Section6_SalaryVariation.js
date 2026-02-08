"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section6_SalaryVariation = Section6_SalaryVariation;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("./shared/SectionHeader");
function Section6_SalaryVariation({ data }) {
    return (react_1.default.createElement("div", { className: "section page" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "6", title: "City-wise Salary Variation (Capitals vs Tier-2)" }),
        react_1.default.createElement("p", { style: { fontSize: '12pt', color: '#4B5563', marginBottom: '20pt', lineHeight: '1.5' } }, data.roleName
            ? `Salary variation for ${data.roleName} across Australian cities, including take-home estimates and living costs.`
            : 'Salary ranges across Australian cities, including take-home estimates and living costs.'),
        data.cities.map((city, index) => (react_1.default.createElement("div", { key: index, style: {
                borderLeft: '3pt solid #1B2A4A',
                padding: '8pt 10pt',
                marginBottom: '20pt',
                background: '#FFFFFF',
                border: '0.5pt solid #E5E7EB',
                borderLeftWidth: '3pt',
                borderLeftColor: '#1B2A4A',
                borderRadius: '3pt',
                pageBreakInside: 'avoid'
            } },
            react_1.default.createElement("div", { style: { marginBottom: '6pt', paddingBottom: '4pt', borderBottom: '0.5pt solid #E5E7EB' } },
                react_1.default.createElement("span", { style: { fontSize: '12pt', fontWeight: 700, color: '#111827' } }, city.cityName),
                (city.techHub || city.nicheOpportunity) && (react_1.default.createElement("span", { style: { fontSize: '10pt', color: '#6B7280', marginLeft: '8pt' } }, city.techHub || city.nicheOpportunity))),
            react_1.default.createElement("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8pt', marginBottom: '6pt', padding: '6pt 8pt', background: '#FAFAFA', borderRadius: '3pt' } },
                react_1.default.createElement("div", null,
                    react_1.default.createElement("div", { style: { fontSize: '10pt', fontWeight: 600, color: '#6B7280', marginBottom: '2pt' } }, city.midLevelRoleName || 'Mid-level'),
                    react_1.default.createElement("div", { style: { fontSize: '12pt', fontWeight: 700, color: '#1B2A4A' } }, city.midLevelRange),
                    city.premium && (react_1.default.createElement("span", { style: { fontSize: '10pt', fontWeight: 600, color: '#1E40AF', background: '#EFF6FF', border: '0.5pt solid #BFDBFE', padding: '1pt 4pt', borderRadius: '2pt', display: 'inline-block', marginTop: '2pt' } }, city.premium))),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("div", { style: { fontSize: '10pt', fontWeight: 600, color: '#6B7280', marginBottom: '2pt' } }, city.seniorLevelRoleName || 'Senior'),
                    react_1.default.createElement("div", { style: { fontSize: '12pt', fontWeight: 700, color: '#1B2A4A' } }, city.seniorLevelRange))),
            react_1.default.createElement("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4pt 12pt', marginBottom: '4pt' } }, [
                { label: 'Tax Rate', value: city.taxRate || 'N/A' },
                { label: 'Take-home', value: city.takeHomeSalary || 'N/A', accent: true },
                { label: 'Housing Cost', value: city.housingCost || 'N/A' },
                { label: 'Cost of Living', value: city.costOfLiving },
                ...(city.qualityOfLife ? [{ label: 'Quality of Life', value: city.qualityOfLife }] : []),
            ].map((item, i) => (react_1.default.createElement("div", { key: i, style: { fontSize: '12pt' } },
                react_1.default.createElement("span", { style: { color: '#6B7280' } },
                    item.label,
                    ": "),
                react_1.default.createElement("span", { style: { fontWeight: 600, color: 'accent' in item && item.accent ? '#1B2A4A' : '#1F2937' } }, item.value))))),
            (city.additionalNotes || city.yourAdvantage) && (react_1.default.createElement("div", { style: { marginTop: '4pt', padding: '4pt 8pt', background: '#F0F4F8', borderLeft: '2pt solid #1B2A4A', borderRadius: '0 3pt 3pt 0' } },
                react_1.default.createElement("p", { style: { fontSize: '12pt', color: '#374151', margin: 0, lineHeight: '1.4' } }, city.additionalNotes || city.yourAdvantage))))))));
}
