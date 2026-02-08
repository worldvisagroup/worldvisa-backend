"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section1_ExecutiveSummary = Section1_ExecutiveSummary;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("./shared/SectionHeader");
function Section1_ExecutiveSummary({ data }) {
    return (react_1.default.createElement("div", { className: "section page" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "1", title: "Executive Summary" }),
        react_1.default.createElement("div", { style: { marginBottom: '20pt' } },
            react_1.default.createElement("p", { style: { fontSize: '12pt', color: '#4B5563', lineHeight: '1.6', margin: 0 } }, data.purpose)),
        react_1.default.createElement("div", { style: { marginBottom: '20pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 } }, "1.1 Top Visa Pathways"),
            react_1.default.createElement("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '12pt' } },
                react_1.default.createElement("thead", null,
                    react_1.default.createElement("tr", null,
                        react_1.default.createElement("th", { style: { background: '#F8F9FB', padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#111827', border: '1pt solid #E5E7EB' } }, "Pathway"),
                        react_1.default.createElement("th", { style: { background: '#F8F9FB', padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#111827', border: '1pt solid #E5E7EB', width: '80pt' } }, "Subclass"),
                        react_1.default.createElement("th", { style: { background: '#F8F9FB', padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#111827', border: '1pt solid #E5E7EB' } }, "Description"))),
                react_1.default.createElement("tbody", null, data.topVisaPathways.map((pathway, index) => (react_1.default.createElement("tr", { key: index },
                    react_1.default.createElement("td", { style: { padding: '6pt 8pt', border: '1pt solid #E5E7EB', color: '#111827', fontWeight: 600, verticalAlign: 'top', background: index % 2 === 0 ? '#FFFFFF' : '#F8F9FB' } }, pathway.name),
                    react_1.default.createElement("td", { style: { padding: '6pt 8pt', border: '1pt solid #E5E7EB', color: '#2563EB', fontWeight: 600, verticalAlign: 'top', background: index % 2 === 0 ? '#FFFFFF' : '#F8F9FB' } }, pathway.subclass),
                    react_1.default.createElement("td", { style: { padding: '6pt 8pt', border: '1pt solid #E5E7EB', color: '#4B5563', verticalAlign: 'top', lineHeight: '1.5', background: index % 2 === 0 ? '#FFFFFF' : '#F8F9FB' } }, pathway.description))))))),
        data.whyAustralia && data.whyAustralia.length > 0 && (react_1.default.createElement("div", { style: { marginBottom: '20pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 } }, "1.2 Why Australia?"),
            react_1.default.createElement("ul", { style: { margin: 0, paddingLeft: '16pt', listStyle: 'none' } }, data.whyAustralia.map((reason, index) => (react_1.default.createElement("li", { key: index, style: { fontSize: '12pt', color: '#4B5563', marginBottom: '4pt', lineHeight: '1.5' } },
                react_1.default.createElement("span", { dangerouslySetInnerHTML: { __html: '&#10003;' }, style: { color: '#059669', marginRight: '6pt', fontWeight: 700 } }),
                reason)))))),
        data.keyHighlights && data.keyHighlights.length > 0 && (react_1.default.createElement("div", { style: { marginBottom: '20pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 } }, "1.3 Key Highlights"),
            react_1.default.createElement("div", { style: { borderLeft: '3pt solid #1B2A4A', paddingLeft: '10pt', background: '#F8F9FB', padding: '8pt 10pt' } },
                react_1.default.createElement("ul", { style: { margin: 0, paddingLeft: '14pt' } }, data.keyHighlights.map((highlight, index) => (react_1.default.createElement("li", { key: index, style: { fontSize: '12pt', color: '#111827', marginBottom: '4pt', lineHeight: '1.5', fontWeight: 600 } }, highlight))))))),
        data.profileStrengths && data.profileStrengths.length > 0 && (react_1.default.createElement("div", { style: { marginBottom: '20pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 } }, "1.4 Profile Strengths"),
            react_1.default.createElement("ul", { style: { margin: 0, paddingLeft: '16pt', listStyle: 'none' } }, data.profileStrengths.map((strength, index) => (react_1.default.createElement("li", { key: index, style: { fontSize: '12pt', color: '#4B5563', marginBottom: '4pt', lineHeight: '1.5' } },
                react_1.default.createElement("span", { dangerouslySetInnerHTML: { __html: '&#10003;' }, style: { color: '#059669', marginRight: '6pt', fontWeight: 700 } }),
                strength)))))),
        data.marketTrends && (react_1.default.createElement("div", { style: { marginBottom: '20pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 } }, "1.5 Market Trends"),
            react_1.default.createElement("div", { style: { borderLeft: '3pt solid #1B2A4A', paddingLeft: '10pt', background: '#F8F9FB', padding: '8pt 10pt' } },
                react_1.default.createElement("p", { style: { margin: 0, fontSize: '12pt', color: '#4B5563', lineHeight: '1.6' } },
                    react_1.default.createElement("strong", { style: { color: '#111827' } }, "Market Insight:"),
                    " ",
                    data.marketTrends))))));
}
