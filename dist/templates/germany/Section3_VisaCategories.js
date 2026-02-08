"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section3_VisaCategories = Section3_VisaCategories;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("../shared/SectionHeader");
function Section3_VisaCategories({ data }) {
    return (react_1.default.createElement("div", { className: "section page" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "3", title: "German Visa Categories & Pathways" }),
        react_1.default.createElement("div", { style: { marginBottom: '12pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '4pt' } }, "3.1 Concept Overview"),
            react_1.default.createElement("p", { style: { fontSize: '12pt', color: '#4B5563', lineHeight: 1.5, marginTop: 0 } }, data.conceptOverview)),
        react_1.default.createElement("div", { style: { marginBottom: '12pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '4pt' } },
                "3.2 Primary Pathway: ",
                data.opportunityCard.title),
            react_1.default.createElement("div", { style: { borderLeft: '3pt solid #1B2A4A', backgroundColor: '#F8F9FB', padding: '8pt 10pt 8pt 12pt' } },
                react_1.default.createElement("p", { style: { fontSize: '12pt', fontWeight: 600, color: '#111827', marginBottom: '3pt', marginTop: 0 } }, "What It Is:"),
                react_1.default.createElement("p", { style: { fontSize: '12pt', color: '#4B5563', lineHeight: 1.5, marginTop: 0, marginBottom: '6pt' } }, data.opportunityCard.description),
                react_1.default.createElement("p", { style: { fontSize: '12pt', fontWeight: 600, color: '#111827', marginBottom: '3pt' } }, "Advantages:"),
                react_1.default.createElement("ul", { style: { listStyle: 'none', margin: 0, padding: 0, marginBottom: '6pt' } }, data.opportunityCard.advantages.map((advantage, index) => (react_1.default.createElement("li", { key: index, style: { fontSize: '12pt', color: '#4B5563', marginBottom: '2pt', paddingLeft: '14pt', position: 'relative' } },
                    react_1.default.createElement("span", { style: { position: 'absolute', left: 0, color: '#059669', fontWeight: 700 } }, "\u2713"),
                    advantage)))),
                react_1.default.createElement("p", { style: { fontSize: '12pt', margin: 0 } },
                    react_1.default.createElement("strong", { style: { color: '#111827' } }, "Success Probability: "),
                    react_1.default.createElement("span", { style: {
                            display: 'inline-block',
                            padding: '1pt 8pt',
                            backgroundColor: '#ECFDF5',
                            color: '#059669',
                            fontSize: '10pt',
                            fontWeight: 600,
                            borderRadius: '3pt'
                        } }, data.opportunityCard.successProbability)))),
        react_1.default.createElement("div", { style: { marginBottom: '8pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '4pt' } },
                "3.3 Secondary Pathway: ",
                data.euBlueCard.title),
            react_1.default.createElement("div", { style: { borderLeft: '3pt solid #2563EB', backgroundColor: '#F8F9FB', padding: '8pt 10pt 8pt 12pt' } },
                react_1.default.createElement("p", { style: { fontSize: '12pt', fontWeight: 600, color: '#111827', marginBottom: '3pt', marginTop: 0 } }, "What It Is:"),
                react_1.default.createElement("p", { style: { fontSize: '12pt', color: '#4B5563', lineHeight: 1.5, marginTop: 0, marginBottom: '6pt' } }, data.euBlueCard.description),
                react_1.default.createElement("p", { style: { fontSize: '12pt', fontWeight: 600, color: '#111827', marginBottom: '3pt' } }, "Advantages:"),
                react_1.default.createElement("ul", { style: { listStyle: 'none', margin: 0, padding: 0, marginBottom: '6pt' } }, data.euBlueCard.advantages.map((advantage, index) => (react_1.default.createElement("li", { key: index, style: { fontSize: '12pt', color: '#4B5563', marginBottom: '2pt', paddingLeft: '14pt', position: 'relative' } },
                    react_1.default.createElement("span", { style: { position: 'absolute', left: 0, color: '#059669', fontWeight: 700 } }, "\u2713"),
                    advantage)))),
                react_1.default.createElement("p", { style: { fontSize: '12pt', margin: 0 } },
                    react_1.default.createElement("strong", { style: { color: '#111827' } }, "Success Probability: "),
                    react_1.default.createElement("span", { style: {
                            display: 'inline-block',
                            padding: '1pt 8pt',
                            backgroundColor: '#EFF6FF',
                            color: '#2563EB',
                            fontSize: '10pt',
                            fontWeight: 600,
                            borderRadius: '3pt'
                        } }, data.euBlueCard.successProbability))))));
}
