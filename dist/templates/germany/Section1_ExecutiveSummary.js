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
        react_1.default.createElement("div", { style: { marginBottom: '12pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '4pt' } }, "1.1 Purpose of This Report"),
            react_1.default.createElement("p", { style: { fontSize: '12pt', color: '#4B5563', lineHeight: 1.5, marginTop: 0 } }, data.purpose)),
        react_1.default.createElement("div", { style: { marginBottom: '12pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '4pt' } }, "1.2 Snapshot of Your Global Mobility Options"),
            react_1.default.createElement("p", { style: { fontSize: '12pt', fontWeight: 600, color: '#111827', marginBottom: '4pt', marginTop: 0 } }, "Your Key Advantages:"),
            react_1.default.createElement("ul", { style: { listStyle: 'none', margin: 0, padding: 0 } }, data.globalMobility.keyAdvantages.map((advantage, index) => (react_1.default.createElement("li", { key: index, style: { fontSize: '12pt', color: '#4B5563', marginBottom: '3pt', paddingLeft: '14pt', position: 'relative' } },
                react_1.default.createElement("span", { style: { position: 'absolute', left: 0, color: '#059669', fontWeight: 700 } }, "\u2713"),
                advantage))))),
        react_1.default.createElement("div", { style: { marginBottom: '8pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '4pt' } }, "1.3 Top Recommended German Cities"),
            react_1.default.createElement("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '12pt' } },
                react_1.default.createElement("thead", null,
                    react_1.default.createElement("tr", { style: { backgroundColor: '#F8F9FB' } },
                        react_1.default.createElement("th", { style: { padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' } }, "Rank"),
                        react_1.default.createElement("th", { style: { padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' } }, "City"),
                        react_1.default.createElement("th", { style: { padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' } }, "Tech Hub"),
                        react_1.default.createElement("th", { style: { padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' } }, "Job Demand"),
                        react_1.default.createElement("th", { style: { padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' } }, "Salary Range"),
                        react_1.default.createElement("th", { style: { padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' } }, "Recommendation"))),
                react_1.default.createElement("tbody", null, data.topCities.map((city, index) => (react_1.default.createElement("tr", { key: index, style: { backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FAFAFA' } },
                    react_1.default.createElement("td", { style: { padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#374151', textAlign: 'center' } }, city.rank),
                    react_1.default.createElement("td", { style: { padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#111827', fontWeight: 600 } }, city.city),
                    react_1.default.createElement("td", { style: { padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#374151' } }, city.techHub),
                    react_1.default.createElement("td", { style: { padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#374151' } }, city.jobDemand),
                    react_1.default.createElement("td", { style: { padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#374151' } }, city.salaryRange),
                    react_1.default.createElement("td", { style: { padding: '6pt 8pt', borderBottom: '0.5pt solid #E5E7EB', color: '#4B5563' } }, city.recommendation)))))))));
}
