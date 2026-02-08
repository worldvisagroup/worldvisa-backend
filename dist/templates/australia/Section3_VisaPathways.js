"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section3_VisaPathways = Section3_VisaPathways;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("./shared/SectionHeader");
function Section3_VisaPathways({ data }) {
    return (react_1.default.createElement("div", { className: "section page" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "3", title: "Your Key Australian Skilled Migration Pathways" }),
        react_1.default.createElement("div", { style: { marginBottom: '20pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 } }, "3.1 Concept Overview"),
            react_1.default.createElement("p", { style: { fontSize: '12pt', color: '#4B5563', lineHeight: '1.6', margin: 0 } }, data.conceptOverview)),
        react_1.default.createElement("div", { style: { marginBottom: '20pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 } }, "3.2 Visa Routes"),
            data.pathways.map((pathway, index) => (react_1.default.createElement("div", { key: index, style: {
                    borderLeft: '3pt solid #1B2A4A',
                    padding: '8pt 10pt',
                    marginBottom: '12pt',
                    background: '#F8F9FB',
                    pageBreakInside: 'avoid'
                } },
                react_1.default.createElement("div", { style: { marginBottom: '6pt' } },
                    react_1.default.createElement("span", { style: { fontSize: '12pt', fontWeight: 700, color: '#111827' } }, pathway.name),
                    react_1.default.createElement("span", { style: { fontSize: '12pt', color: '#2563EB', fontWeight: 600, marginLeft: '8pt' } }, pathway.subclass)),
                react_1.default.createElement("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '12pt', marginBottom: '6pt' } },
                    react_1.default.createElement("tbody", null,
                        react_1.default.createElement("tr", null,
                            react_1.default.createElement("td", { style: { padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', fontWeight: 600, color: '#111827', width: '25%' } }, "Points Requirement"),
                            react_1.default.createElement("td", { style: { padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', color: '#4B5563', width: '25%' } }, pathway.pointsRequirement),
                            react_1.default.createElement("td", { style: { padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', fontWeight: 600, color: '#111827', width: '25%' } }, "Age Requirement"),
                            react_1.default.createElement("td", { style: { padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', color: '#4B5563', width: '25%' } }, pathway.ageRequirement)),
                        react_1.default.createElement("tr", null,
                            react_1.default.createElement("td", { style: { padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', fontWeight: 600, color: '#111827' } }, "Employer Sponsorship"),
                            react_1.default.createElement("td", { style: { padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', color: '#4B5563' } }, pathway.employerSponsorship),
                            react_1.default.createElement("td", { style: { padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', fontWeight: 600, color: '#111827' } }, "State Sponsorship"),
                            react_1.default.createElement("td", { style: { padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', color: '#4B5563' } }, pathway.stateSponsorship)),
                        react_1.default.createElement("tr", null,
                            react_1.default.createElement("td", { style: { padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', fontWeight: 600, color: '#111827' } }, "Processing Time"),
                            react_1.default.createElement("td", { style: { padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', color: '#4B5563' } }, pathway.processingTime),
                            react_1.default.createElement("td", { style: { padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', fontWeight: 600, color: '#111827' } }, "Pathway"),
                            react_1.default.createElement("td", { style: { padding: '4pt 6pt', border: '1pt solid #E5E7EB', background: '#FFFFFF', color: '#4B5563' } }, pathway.pathway)))),
                pathway.duration && (react_1.default.createElement("p", { style: { fontSize: '12pt', color: '#4B5563', margin: '0 0 4pt 0', lineHeight: '1.5' } },
                    react_1.default.createElement("strong", { style: { color: '#111827' } }, "Duration:"),
                    " ",
                    pathway.duration,
                    pathway.prPathway && (react_1.default.createElement("span", null,
                        " | ",
                        react_1.default.createElement("strong", { style: { color: '#111827' } }, "PR Pathway:"),
                        " ",
                        pathway.prPathway)))),
                pathway.keyRequirements && pathway.keyRequirements.length > 0 && (react_1.default.createElement("div", { style: { marginBottom: '4pt' } },
                    react_1.default.createElement("p", { style: { fontSize: '12pt', fontWeight: 600, color: '#111827', margin: '0 0 3pt 0' } }, "Key Requirements:"),
                    react_1.default.createElement("ul", { style: { fontSize: '12pt', color: '#4B5563', margin: 0, paddingLeft: '14pt', lineHeight: '1.5' } }, pathway.keyRequirements.map((req, reqIndex) => (react_1.default.createElement("li", { key: reqIndex, style: { marginBottom: '2pt' } }, req)))))),
                pathway.keyStates && pathway.keyStates.length > 0 && (react_1.default.createElement("div", { style: { marginBottom: '4pt' } },
                    react_1.default.createElement("p", { style: { fontSize: '12pt', fontWeight: 600, color: '#111827', margin: '0 0 3pt 0' } }, "Key States Actively Nominating:"),
                    react_1.default.createElement("ul", { style: { fontSize: '12pt', color: '#4B5563', margin: 0, paddingLeft: '14pt' } }, pathway.keyStates.map((state, stateIndex) => (react_1.default.createElement("li", { key: stateIndex, style: { marginBottom: '2pt' } }, state)))))),
                pathway.keyAdvantage && (react_1.default.createElement("p", { style: { fontSize: '12pt', color: '#059669', margin: '0 0 4pt 0', lineHeight: '1.5' } },
                    react_1.default.createElement("strong", null, "Key Advantage:"),
                    " ",
                    pathway.keyAdvantage)),
                pathway.additionalInfo && (react_1.default.createElement("p", { style: { fontSize: '12pt', color: '#9CA3AF', margin: '0 0 4pt 0', lineHeight: '1.5', fontStyle: 'italic' } }, pathway.additionalInfo)),
                react_1.default.createElement("div", { style: { borderLeft: '2pt solid #059669', paddingLeft: '8pt', marginTop: '4pt' } },
                    react_1.default.createElement("p", { style: { fontSize: '12pt', margin: 0, lineHeight: '1.5' } },
                        react_1.default.createElement("strong", { style: { color: '#059669' } }, "Why Suitable for You:"),
                        ' ',
                        react_1.default.createElement("span", { style: { color: '#4B5563' } }, pathway.whySuitable)))))))));
}
