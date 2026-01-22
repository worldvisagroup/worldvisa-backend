"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section1_ExecutiveSummary = Section1_ExecutiveSummary;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("./shared/SectionHeader");
function Section1_ExecutiveSummary({ data }) {
    return (react_1.default.createElement("div", { className: "section executive-summary page" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "1", title: "Executive Summary" }),
        react_1.default.createElement("div", { className: "subsection" },
            react_1.default.createElement("h3", null, "1.1 Purpose of This Report"),
            react_1.default.createElement("p", null, data.purpose)),
        data.whyAustralia && data.whyAustralia.length > 0 && (react_1.default.createElement("div", { className: "subsection" },
            react_1.default.createElement("h3", null, "1.2 Why Australia?"),
            react_1.default.createElement("ul", { className: "checkmark-list" }, data.whyAustralia.map((reason, index) => (react_1.default.createElement("li", { key: index }, reason)))))),
        data.keyHighlights && data.keyHighlights.length > 0 && (react_1.default.createElement("div", { className: "subsection" },
            react_1.default.createElement("h3", null, "1.3 Key Highlights"),
            react_1.default.createElement("div", { style: {
                    background: '#EBF5FF',
                    padding: '16pt',
                    borderRadius: '8pt',
                    borderLeft: '4pt solid #0066CC'
                } },
                react_1.default.createElement("ul", { style: { marginLeft: '20pt', marginBottom: '0' } }, data.keyHighlights.map((highlight, index) => (react_1.default.createElement("li", { key: index, style: { marginBottom: '8pt', color: '#1F2937' } },
                    react_1.default.createElement("strong", null, highlight)))))))),
        data.profileStrengths && data.profileStrengths.length > 0 && (react_1.default.createElement("div", { className: "subsection" },
            react_1.default.createElement("h3", null, "1.4 Your Profile Strengths"),
            react_1.default.createElement("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12pt' } }, data.profileStrengths.map((strength, index) => (react_1.default.createElement("div", { key: index, style: {
                    background: '#F9FAFB',
                    border: '1pt solid #E5E7EB',
                    borderRadius: '6pt',
                    padding: '16pt',
                    display: 'flex',
                    alignItems: 'flex-start'
                } },
                react_1.default.createElement("span", { style: { color: '#10B981', fontSize: '16pt', marginRight: '12pt', flexShrink: 0 } }, "\u2713"),
                react_1.default.createElement("span", { style: { fontSize: '10pt', color: '#4B5563', lineHeight: '1.5' } }, strength))))))),
        data.marketTrends && (react_1.default.createElement("div", { className: "subsection" },
            react_1.default.createElement("h3", { style: { marginBottom: '10pt' } }, "1.5 Australian Tech Market Trends"),
            react_1.default.createElement("div", { style: {
                    background: '#FFFBEB',
                    border: '1pt solid #FCD34D',
                    borderRadius: '8pt',
                    padding: '16pt',
                } },
                react_1.default.createElement("p", { style: { marginBottom: '0', fontSize: '11pt', lineHeight: '1.6' } },
                    "\uD83D\uDCC8 ",
                    react_1.default.createElement("strong", null, "Market Insight:"),
                    " ",
                    data.marketTrends)))),
        react_1.default.createElement("div", { className: "subsection" },
            react_1.default.createElement("h3", null, "1.6 Top Visa Pathways for Australia (Without Job Offer)"),
            react_1.default.createElement("p", { style: { marginBottom: '16pt', color: '#6B7280', fontSize: '10pt' } }, "These are the primary skilled migration pathways available to you based on your profile:"),
            react_1.default.createElement("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '16pt' } }, data.topVisaPathways.map((pathway, index) => (react_1.default.createElement("div", { key: index, style: {
                    background: 'linear-gradient(135deg, #F9FAFB 0%, #FFFFFF 100%)',
                    border: '1pt solid #E5E7EB',
                    borderLeft: '4pt solid #0066CC',
                    borderRadius: '6pt',
                    padding: '16pt',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12pt',
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid'
                } },
                react_1.default.createElement("div", { style: {
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36pt',
                        height: '36pt',
                        background: '#0066CC',
                        color: '#FFFFFF',
                        borderRadius: '50%',
                        fontSize: '16pt',
                        fontWeight: '700',
                        flexShrink: 0
                    } }, index + 1),
                react_1.default.createElement("div", { style: { flex: 1 } },
                    react_1.default.createElement("div", { style: { display: 'flex', alignItems: 'center', marginBottom: '12pt' } },
                        react_1.default.createElement("strong", { style: { fontSize: '13pt', color: '#1F2937' } }, pathway.name),
                        react_1.default.createElement("span", { style: {
                                marginLeft: '12pt',
                                background: '#DBEAFE',
                                color: '#1E40AF',
                                padding: '3pt 10pt',
                                borderRadius: '12pt',
                                fontSize: '9pt',
                                fontWeight: '600'
                            } },
                            "Subclass ",
                            pathway.subclass)),
                    react_1.default.createElement("p", { style: {
                            marginBottom: '0',
                            fontSize: '11pt',
                            color: '#4B5563',
                            lineHeight: '1.6'
                        } }, pathway.description)))))))));
}
