"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section7_SalaryVariation = Section7_SalaryVariation;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("../shared/SectionHeader");
const thStyle = {
    padding: '5pt 6pt',
    textAlign: 'left',
    fontWeight: 700,
    fontSize: '10pt',
    color: '#FFFFFF',
    background: '#1B2A4A',
    borderBottom: '1pt solid #E5E7EB',
};
const tdStyle = {
    padding: '4pt 6pt',
    color: '#4B5563',
    borderBottom: '0.5pt solid #E5E7EB',
    lineHeight: '1.4',
};
function Section7_SalaryVariation({ data }) {
    return (react_1.default.createElement("div", { className: "section page" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "7", title: "City-wise Salary Variation (Toronto vs Vancouver vs Montreal)" }),
        react_1.default.createElement("div", { style: { marginBottom: '20pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 } }, "Salary Comparison"),
            data.cities.map((city, index) => (react_1.default.createElement("div", { key: index, style: { marginBottom: '8pt' } },
                data.cities.length > 1 && (react_1.default.createElement("div", { style: { fontSize: '12pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '3pt' } }, city.city)),
                react_1.default.createElement("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '12pt' } },
                    react_1.default.createElement("thead", null,
                        react_1.default.createElement("tr", null,
                            react_1.default.createElement("th", { style: thStyle }, "Factor"),
                            react_1.default.createElement("th", { style: thStyle }, "Toronto"),
                            react_1.default.createElement("th", { style: thStyle }, "Vancouver"),
                            react_1.default.createElement("th", { style: thStyle }, "Montreal"),
                            react_1.default.createElement("th", { style: thStyle }, "Winner for You"))),
                    react_1.default.createElement("tbody", null, city.factors.map((factor, i) => (react_1.default.createElement("tr", { key: i, style: { background: i % 2 === 0 ? '#FFFFFF' : '#F8F9FB' } },
                        react_1.default.createElement("td", { style: { ...tdStyle, fontWeight: 600, color: '#111827' } }, factor.factor),
                        react_1.default.createElement("td", { style: tdStyle }, factor.toronto),
                        react_1.default.createElement("td", { style: tdStyle }, factor.vancouver),
                        react_1.default.createElement("td", { style: tdStyle }, factor.montreal),
                        react_1.default.createElement("td", { style: { ...tdStyle, fontWeight: 600, color: '#059669' } }, factor.winner)))))))))),
        react_1.default.createElement("div", { style: { marginBottom: '20pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 } }, "Recommendation Summary"),
            react_1.default.createElement("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '12pt' } },
                react_1.default.createElement("thead", null,
                    react_1.default.createElement("tr", null,
                        react_1.default.createElement("th", { style: thStyle }, "Priority"),
                        react_1.default.createElement("th", { style: thStyle }, "Toronto (Ontario)"),
                        react_1.default.createElement("th", { style: thStyle }, "Vancouver (BC)"),
                        react_1.default.createElement("th", { style: thStyle }, "Montreal (Quebec)"))),
                react_1.default.createElement("tbody", null, data.recommendation.priorities.map((priority, i) => (react_1.default.createElement("tr", { key: i, style: { background: i % 2 === 0 ? '#FFFFFF' : '#F8F9FB' } },
                    react_1.default.createElement("td", { style: { ...tdStyle, fontWeight: 600, color: '#111827' } }, priority.priority),
                    react_1.default.createElement("td", { style: tdStyle }, priority.toronto),
                    react_1.default.createElement("td", { style: tdStyle }, priority.vancouver),
                    react_1.default.createElement("td", { style: tdStyle }, priority.montreal)))))))));
}
