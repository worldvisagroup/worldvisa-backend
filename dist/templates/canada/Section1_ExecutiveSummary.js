"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section1_ExecutiveSummary = Section1_ExecutiveSummary;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("../shared/SectionHeader");
function Section1_ExecutiveSummary({ data }) {
    return (react_1.default.createElement("div", { className: "section page" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "1", title: "Executive Summary" }),
        react_1.default.createElement("div", { style: { marginBottom: '8pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 } }, "1.1 Purpose of This Report"),
            react_1.default.createElement("p", { style: { fontSize: '12pt', color: '#4B5563', lineHeight: 1.5, margin: 0 } }, data.purpose)),
        react_1.default.createElement("div", { style: { marginBottom: '12pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 } }, "1.2 Why Canada"),
            react_1.default.createElement("p", { style: { fontSize: '12pt', color: '#4B5563', lineHeight: 1.5, margin: 0 } }, data.whyCanada)),
        react_1.default.createElement("div", { style: { marginBottom: '12pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 } }, "1.3 Top Recommended Canadian Provinces"),
            react_1.default.createElement("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '12pt' } },
                react_1.default.createElement("thead", null,
                    react_1.default.createElement("tr", null, ['Rank', 'Province', 'Pathway', 'CRS Advantage', 'Job Demand', 'Recommendation'].map((h) => (react_1.default.createElement("th", { key: h, style: {
                            textAlign: 'left',
                            padding: '5pt 6pt',
                            backgroundColor: '#1B2A4A',
                            color: '#FFFFFF',
                            fontWeight: 600,
                            fontSize: '10pt',
                            borderBottom: '1pt solid #E5E7EB',
                        } }, h))))),
                react_1.default.createElement("tbody", null, data.topProvinces.map((p, i) => (react_1.default.createElement("tr", { key: i, style: { backgroundColor: i % 2 === 0 ? '#F8F9FB' : '#FFFFFF' } },
                    react_1.default.createElement("td", { style: { padding: '4pt 6pt', color: '#111827', textAlign: 'center', borderBottom: '1pt solid #E5E7EB' } }, p.rank),
                    react_1.default.createElement("td", { style: { padding: '4pt 6pt', color: '#111827', fontWeight: 600, borderBottom: '1pt solid #E5E7EB' } }, p.province),
                    react_1.default.createElement("td", { style: { padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' } }, p.pathway),
                    react_1.default.createElement("td", { style: { padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' } }, p.crsAdvantage),
                    react_1.default.createElement("td", { style: { padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' } }, p.jobDemand),
                    react_1.default.createElement("td", { style: { padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' } }, p.recommendation))))))),
        react_1.default.createElement("div", { style: { marginBottom: '6pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 } }, "1.4 High-Level Risk & Reward Overview"),
            react_1.default.createElement("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '12pt' } },
                react_1.default.createElement("thead", null,
                    react_1.default.createElement("tr", null, ['Factor', 'Risk Level', 'Reward Level', 'Mitigation'].map((h) => (react_1.default.createElement("th", { key: h, style: {
                            textAlign: 'left',
                            padding: '5pt 6pt',
                            backgroundColor: '#1B2A4A',
                            color: '#FFFFFF',
                            fontWeight: 600,
                            fontSize: '10pt',
                            borderBottom: '1pt solid #E5E7EB',
                        } }, h))))),
                react_1.default.createElement("tbody", null, data.riskReward.map((r, i) => (react_1.default.createElement("tr", { key: i, style: { backgroundColor: i % 2 === 0 ? '#F8F9FB' : '#FFFFFF' } },
                    react_1.default.createElement("td", { style: { padding: '4pt 6pt', color: '#111827', fontWeight: 600, borderBottom: '1pt solid #E5E7EB' } }, r.factor),
                    react_1.default.createElement("td", { style: { padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' } }, r.riskLevel),
                    react_1.default.createElement("td", { style: { padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' } }, r.rewardLevel),
                    react_1.default.createElement("td", { style: { padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' } }, r.mitigation)))))))));
}
