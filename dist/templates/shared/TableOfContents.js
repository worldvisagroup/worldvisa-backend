"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableOfContents = TableOfContents;
const react_1 = __importDefault(require("react"));
function TableOfContents({ sections, countries }) {
    const defaultSections = [
        { section: '1', title: 'Executive Summary', page: '3' },
        { section: '2', title: 'Professional Profile Assessment', page: '5' },
        { section: '3', title: 'Visa Pathways Without Job Offer', page: '7' },
        { section: '4', title: 'Global Skill Demand Mapping', page: '11' },
        { section: '5', title: 'Top 20 Target Employers', page: '13' },
        { section: '6', title: 'City-wise Salary Variation', page: '15' },
        { section: '7', title: 'End-to-End Timeline', page: '17' },
        { section: '8', title: 'Why Use a Regulated Advisor', page: '19' },
    ];
    const tocData = sections || defaultSections;
    const t = {
        dark: '#111827',
        text: '#4B5563',
        muted: '#9CA3AF',
        red: '#1B2A4A',
        border: '#E5E7EB',
        bg: '#FAFAFA',
    };
    if (countries && countries.length > 1) {
        return (react_1.default.createElement("div", { style: { padding: '10mm 12mm' } },
            react_1.default.createElement("div", { style: { marginBottom: '16pt' } },
                react_1.default.createElement("p", { style: { fontSize: '9pt', color: t.red, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '4pt' } }, "Contents"),
                react_1.default.createElement("h2", { style: { fontSize: '24pt', fontWeight: 700, color: t.dark, margin: 0 } }, "Table of Contents"),
                react_1.default.createElement("div", { style: { width: '40pt', height: '2px', background: t.red, marginTop: '8pt' } })),
            countries.map((country, ci) => (react_1.default.createElement("div", { key: country, style: { marginBottom: ci < countries.length - 1 ? '14pt' : '0' } },
                react_1.default.createElement("h3", { style: { fontSize: '13pt', fontWeight: 700, color: t.dark, marginBottom: '6pt', marginTop: '0', paddingBottom: '4pt', borderBottom: `1px solid ${t.border}` } }, country),
                tocData.filter(s => s.country === country).map((item, idx) => (react_1.default.createElement("div", { key: idx, style: { display: 'flex', alignItems: 'center', padding: '5pt 0', borderBottom: `0.5pt dotted ${t.border}` } },
                    react_1.default.createElement("span", { style: { width: '24pt', fontSize: '10pt', fontWeight: 700, color: t.red } }, item.section),
                    react_1.default.createElement("span", { style: { flex: 1, fontSize: '13pt', color: t.text } }, item.title),
                    react_1.default.createElement("span", { style: { fontSize: '10pt', fontWeight: 600, color: t.muted, marginLeft: '8pt' } }, item.page)))))))));
    }
    return (react_1.default.createElement("div", { style: { padding: '10mm 12mm' } },
        react_1.default.createElement("div", { style: { marginBottom: '20pt' } },
            react_1.default.createElement("p", { style: { fontSize: '9pt', color: t.red, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '4pt' } }, "Contents"),
            react_1.default.createElement("h2", { style: { fontSize: '24pt', fontWeight: 700, color: t.dark, margin: 0 } }, "Table of Contents"),
            react_1.default.createElement("div", { style: { width: '40pt', height: '2px', background: t.red, marginTop: '8pt' } })),
        tocData.map((item, idx) => (react_1.default.createElement("div", { key: idx, style: { display: 'flex', alignItems: 'center', padding: '7pt 0', borderBottom: `0.5pt dotted ${t.border}` } },
            react_1.default.createElement("span", { style: { width: '28pt', fontSize: '10pt', fontWeight: 700, color: t.red } }, item.section),
            react_1.default.createElement("span", { style: { flex: 1, fontSize: '13pt', color: t.dark, fontWeight: 500 } }, item.title),
            react_1.default.createElement("span", { style: { fontSize: '10pt', fontWeight: 600, color: t.muted, marginLeft: '8pt' } }, item.page)))),
        react_1.default.createElement("div", { style: { marginTop: '20pt', padding: '10pt 12pt', background: t.bg, borderRadius: '4pt', borderLeft: `3pt solid ${t.red}` } },
            react_1.default.createElement("p", { style: { fontSize: '10pt', color: t.text, marginBottom: '0', lineHeight: '1.5' } },
                react_1.default.createElement("strong", null, "Note:"),
                " This report is tailored specifically to your profile. Bookmark key sections for easy reference during your application journey."))));
}
