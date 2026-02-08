"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section4_NoSponsor = Section4_NoSponsor;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("../shared/SectionHeader");
function Section4_NoSponsor({ data }) {
    return (react_1.default.createElement("div", { className: "section page" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "4", title: "You Can Move to WITHOUT a Sponsor / Employer" }),
        react_1.default.createElement("div", { style: { marginBottom: '20pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 } }, "4.1 Understanding Sponsor-Free / Self-Sponsored Routes"),
            react_1.default.createElement("p", { style: { fontSize: '12pt', color: '#4B5563', lineHeight: 1.5, margin: '0 0 6pt 0' } }, data.concept),
            react_1.default.createElement("p", { style: { fontSize: '12pt', fontWeight: 600, color: '#111827', margin: '0 0 4pt 0' } }, "Self-Sponsored Routes in Canada:"),
            react_1.default.createElement("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '12pt' } },
                react_1.default.createElement("thead", null,
                    react_1.default.createElement("tr", null, ['Route', 'Sponsor Required?', 'Job Offer Required?', 'Viability for You'].map((h) => (react_1.default.createElement("th", { key: h, style: {
                            textAlign: 'left',
                            padding: '5pt 6pt',
                            backgroundColor: '#1B2A4A',
                            color: '#FFFFFF',
                            fontWeight: 600,
                            fontSize: '10pt',
                            borderBottom: '1pt solid #E5E7EB',
                        } }, h))))),
                react_1.default.createElement("tbody", null, data.selfSponsoredRoutes.map((route, i) => (react_1.default.createElement("tr", { key: i, style: { backgroundColor: i % 2 === 0 ? '#F8F9FB' : '#FFFFFF' } },
                    react_1.default.createElement("td", { style: { padding: '4pt 6pt', color: '#111827', fontWeight: 600, borderBottom: '1pt solid #E5E7EB' } }, route.route),
                    react_1.default.createElement("td", { style: { padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' } }, route.sponsorRequired),
                    react_1.default.createElement("td", { style: { padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' } }, route.jobOfferRequired),
                    react_1.default.createElement("td", { style: { padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' } }, route.viability))))))),
        react_1.default.createElement("div", { style: { marginBottom: '20pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 } }, "4.2 Canada Matrix \u2013 No Employer Sponsorship Required"),
            react_1.default.createElement("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '12pt' } },
                react_1.default.createElement("thead", null,
                    react_1.default.createElement("tr", null, ['Option', 'Type', 'Details'].map((h) => (react_1.default.createElement("th", { key: h, style: {
                            textAlign: 'left',
                            padding: '5pt 6pt',
                            backgroundColor: '#1B2A4A',
                            color: '#FFFFFF',
                            fontWeight: 600,
                            fontSize: '10pt',
                            borderBottom: '1pt solid #E5E7EB',
                        } }, h))))),
                react_1.default.createElement("tbody", null, data.matrix.map((item, i) => (react_1.default.createElement("tr", { key: i, style: { backgroundColor: i % 2 === 0 ? '#F8F9FB' : '#FFFFFF' } },
                    react_1.default.createElement("td", { style: { padding: '4pt 6pt', color: '#111827', fontWeight: 600, borderBottom: '1pt solid #E5E7EB' } }, item.option),
                    react_1.default.createElement("td", { style: { padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' } }, item.type),
                    react_1.default.createElement("td", { style: { padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' } }, item.details))))))),
        react_1.default.createElement("div", { style: { marginBottom: '20pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 } }, "4.3 Long-Term Settlement & Citizenship Pathways"),
            react_1.default.createElement("p", { style: { fontSize: '12pt', fontWeight: 600, color: '#111827', margin: '0 0 4pt 0' } }, "PR to Citizenship Timeline:"),
            react_1.default.createElement("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '12pt' } },
                react_1.default.createElement("thead", null,
                    react_1.default.createElement("tr", null, ['Stage', 'Duration', 'Status'].map((h) => (react_1.default.createElement("th", { key: h, style: {
                            textAlign: 'left',
                            padding: '5pt 6pt',
                            backgroundColor: '#1B2A4A',
                            color: '#FFFFFF',
                            fontWeight: 600,
                            fontSize: '10pt',
                            borderBottom: '1pt solid #E5E7EB',
                        } }, h))))),
                react_1.default.createElement("tbody", null, data.settlementPathway.stages.map((stage, i) => (react_1.default.createElement("tr", { key: i, style: { backgroundColor: i % 2 === 0 ? '#F8F9FB' : '#FFFFFF' } },
                    react_1.default.createElement("td", { style: { padding: '4pt 6pt', color: '#111827', fontWeight: 600, borderBottom: '1pt solid #E5E7EB' } }, stage.stage),
                    react_1.default.createElement("td", { style: { padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' } }, stage.duration),
                    react_1.default.createElement("td", { style: { padding: '4pt 6pt', color: '#4B5563', borderBottom: '1pt solid #E5E7EB' } }, stage.status)))))))));
}
