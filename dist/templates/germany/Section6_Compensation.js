"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section6_Compensation = Section6_Compensation;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("../shared/SectionHeader");
function Section6_Compensation({ data }) {
    const thStyle = {
        padding: '5pt 6pt',
        textAlign: 'left',
        fontWeight: 700,
        fontSize: '10pt',
        color: '#FFFFFF',
        background: '#1B2A4A',
        border: '0.5pt solid #E5E7EB',
    };
    const tdStyle = {
        padding: '5pt 6pt',
        fontSize: '12pt',
        color: '#4B5563',
        border: '0.5pt solid #E5E7EB',
    };
    return (react_1.default.createElement("div", { className: "section page" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "6", title: "Compensation Benchmarking" }),
        react_1.default.createElement("div", { style: { marginBottom: '12pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 } }, "Salary Ranges by City & Role Level"),
            react_1.default.createElement("table", { style: { width: '100%', borderCollapse: 'collapse', border: '0.5pt solid #E5E7EB' } },
                react_1.default.createElement("thead", null,
                    react_1.default.createElement("tr", null,
                        react_1.default.createElement("th", { style: thStyle }, "Level"),
                        react_1.default.createElement("th", { style: thStyle }, "Location"),
                        react_1.default.createElement("th", { style: thStyle }, "EUR (Annual)"),
                        react_1.default.createElement("th", { style: thStyle }, "INR Equivalent"))),
                react_1.default.createElement("tbody", null, data.salaryRanges.map((salary, index) => (react_1.default.createElement("tr", { key: index, style: { background: index % 2 === 0 ? '#F8F9FB' : '#FFFFFF' } },
                    react_1.default.createElement("td", { style: tdStyle }, salary.level),
                    react_1.default.createElement("td", { style: tdStyle }, salary.location),
                    react_1.default.createElement("td", { style: tdStyle }, salary.eurAnnual),
                    react_1.default.createElement("td", { style: tdStyle }, salary.inrEquivalent))))))),
        react_1.default.createElement("div", { style: { marginBottom: '6pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 } }, "City-wise Salary Comparison"),
            react_1.default.createElement("table", { style: { width: '100%', borderCollapse: 'collapse', border: '0.5pt solid #E5E7EB' } },
                react_1.default.createElement("thead", null,
                    react_1.default.createElement("tr", null,
                        react_1.default.createElement("th", { style: thStyle }, "Factor"),
                        react_1.default.createElement("th", { style: thStyle }, "Berlin"),
                        react_1.default.createElement("th", { style: thStyle }, "Munich"),
                        react_1.default.createElement("th", { style: thStyle }, "Frankfurt"),
                        react_1.default.createElement("th", { style: thStyle }, "Winner"))),
                react_1.default.createElement("tbody", null, data.cityComparison.map((comparison, index) => (react_1.default.createElement("tr", { key: index, style: { background: index % 2 === 0 ? '#F8F9FB' : '#FFFFFF' } },
                    react_1.default.createElement("td", { style: { ...tdStyle, fontWeight: 600, color: '#111827' } }, comparison.factor),
                    react_1.default.createElement("td", { style: tdStyle }, comparison.berlin),
                    react_1.default.createElement("td", { style: tdStyle }, comparison.munich),
                    react_1.default.createElement("td", { style: tdStyle }, comparison.frankfurt),
                    react_1.default.createElement("td", { style: { ...tdStyle, fontWeight: 600, color: '#059669' } }, comparison.winner)))))))));
}
