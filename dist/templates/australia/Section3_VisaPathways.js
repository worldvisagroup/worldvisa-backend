"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section3_VisaPathways = Section3_VisaPathways;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("./shared/SectionHeader");
function Section3_VisaPathways({ data }) {
    return (react_1.default.createElement("div", { className: "section visa-pathways page" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "3", title: "You Can Move to Without a Job Offer" }),
        react_1.default.createElement("div", { className: "subsection" },
            react_1.default.createElement("h3", null, "3.1 Concept Overview \u2013 'Job-Offer-Free' Migration Pathways"),
            react_1.default.createElement("div", { style: {
                    background: 'linear-gradient(135deg, #EBF5FF 0%, #DBEAFE 100%)',
                    border: '1pt solid #BFDBFE',
                    borderRadius: '8pt',
                    padding: '16pt',
                    marginBottom: '20pt'
                } },
                react_1.default.createElement("p", { style: { marginBottom: '0', fontSize: '11pt', lineHeight: '1.5' } }, data.conceptOverview))),
        react_1.default.createElement("div", { className: "subsection" },
            react_1.default.createElement("h3", null, "3.2 Australia-Specific Visa Routes (No Job Offer Required)"),
            react_1.default.createElement("p", { style: { fontSize: '10pt', color: '#6B7280', marginBottom: '4pt' } }, "Below are the three main skilled migration pathways available to you. Each has distinct requirements and advantages:"),
            react_1.default.createElement("div", { style: { display: 'flex', flexDirection: 'column' } }, data.pathways.map((pathway, index) => (react_1.default.createElement("div", { key: index, style: {
                    background: '#FFFFFF',
                    border: '2pt solid #E5E7EB',
                    borderRadius: '10pt',
                    padding: '16pt',
                    marginTop: index === 0 ? '0' : '40pt',
                    marginBottom: '0',
                    pageBreakInside: 'avoid'
                } },
                react_1.default.createElement("div", { style: {
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '12pt',
                        paddingBottom: '12pt',
                        borderBottom: '2pt solid #E5E7EB'
                    } },
                    react_1.default.createElement("div", { style: {
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32pt',
                            height: '32pt',
                            background: '#0066CC',
                            color: '#FFFFFF',
                            borderRadius: '50%',
                            fontSize: '16pt',
                            fontWeight: '700',
                            marginRight: '12pt',
                            flexShrink: 0
                        } }, String.fromCharCode(65 + index)),
                    react_1.default.createElement("div", { style: { flex: 1 } },
                        react_1.default.createElement("h4", { style: {
                                fontSize: '15pt',
                                fontWeight: '700',
                                color: '#1F2937',
                                marginBottom: '4pt',
                                marginTop: '0'
                            } }, pathway.name),
                        react_1.default.createElement("div", { style: { display: 'flex', gap: '8pt', alignItems: 'center' } },
                            react_1.default.createElement("span", { style: {
                                    background: '#DBEAFE',
                                    color: '#1E40AF',
                                    padding: '3pt 10pt',
                                    borderRadius: '12pt',
                                    fontSize: '9pt',
                                    fontWeight: '600'
                                } },
                                "Subclass ",
                                pathway.subclass),
                            react_1.default.createElement("span", { style: {
                                    background: '#D1FAE5',
                                    color: '#065F46',
                                    padding: '3pt 10pt',
                                    borderRadius: '12pt',
                                    fontSize: '9pt',
                                    fontWeight: '600'
                                } }, "Permanent Residency")))),
                react_1.default.createElement("div", { style: {
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '12pt',
                        marginBottom: '12pt',
                        alignItems: 'stretch'
                    } },
                    react_1.default.createElement("div", { style: {
                            background: '#F9FAFB',
                            padding: '10pt',
                            borderRadius: '6pt',
                            border: '1pt solid #E5E7EB'
                        } },
                        react_1.default.createElement("p", { style: { fontSize: '9pt', color: '#6B7280', marginBottom: '4pt', fontWeight: '600' } }, "Points Requirement"),
                        react_1.default.createElement("p", { style: { fontSize: '12pt', fontWeight: '700', color: '#0066CC', marginBottom: '0' } }, pathway.pointsRequirement)),
                    react_1.default.createElement("div", { style: {
                            background: '#F9FAFB',
                            padding: '10pt',
                            borderRadius: '6pt',
                            border: '1pt solid #E5E7EB'
                        } },
                        react_1.default.createElement("p", { style: { fontSize: '9pt', color: '#6B7280', marginBottom: '4pt', fontWeight: '600' } }, "Age Requirement"),
                        react_1.default.createElement("p", { style: { fontSize: '12pt', fontWeight: '700', color: '#0066CC', marginBottom: '0' } }, pathway.ageRequirement)),
                    react_1.default.createElement("div", { style: {
                            background: '#F9FAFB',
                            padding: '10pt',
                            borderRadius: '6pt',
                            border: '1pt solid #E5E7EB'
                        } },
                        react_1.default.createElement("p", { style: { fontSize: '9pt', color: '#6B7280', marginBottom: '4pt', fontWeight: '600' } }, "Employer Sponsorship"),
                        react_1.default.createElement("p", { style: { fontSize: '12pt', fontWeight: '700', color: '#0066CC', marginBottom: '0' } }, pathway.employerSponsorship)),
                    react_1.default.createElement("div", { style: {
                            background: '#F9FAFB',
                            padding: '10pt',
                            borderRadius: '6pt',
                            border: '1pt solid #E5E7EB'
                        } },
                        react_1.default.createElement("p", { style: { fontSize: '9pt', color: '#6B7280', marginBottom: '4pt', fontWeight: '600' } }, "State Sponsorship"),
                        react_1.default.createElement("p", { style: { fontSize: '12pt', fontWeight: '700', color: '#0066CC', marginBottom: '0' } }, pathway.stateSponsorship))),
                pathway.keyRequirements && pathway.keyRequirements.length > 0 && (react_1.default.createElement("div", { style: { marginBottom: '12pt' } },
                    react_1.default.createElement("p", { style: { fontSize: '10pt', fontWeight: '600', color: '#1F2937', marginBottom: '6pt' } }, "\u2713 Key Requirements:"),
                    react_1.default.createElement("ul", { style: {
                            fontSize: '10pt',
                            color: '#4B5563',
                            marginLeft: '20pt',
                            marginBottom: '0',
                            lineHeight: '1.6'
                        } }, pathway.keyRequirements.map((req, reqIndex) => (react_1.default.createElement("li", { key: reqIndex, style: { marginBottom: '4pt' } }, req)))))),
                pathway.keyStates && pathway.keyStates.length > 0 && (react_1.default.createElement("div", { style: { marginBottom: '12pt' } },
                    react_1.default.createElement("p", { style: { fontSize: '10pt', fontWeight: '600', color: '#1F2937', marginBottom: '6pt' } }, "Key States Actively Nominating:"),
                    react_1.default.createElement("ul", { style: { fontSize: '10pt', color: '#4B5563', marginLeft: '20pt', marginBottom: '0' } }, pathway.keyStates.map((state, stateIndex) => (react_1.default.createElement("li", { key: stateIndex, style: { marginBottom: '4pt' } }, state)))))),
                pathway.duration && (react_1.default.createElement("div", { style: {
                        background: '#FEF3C7',
                        border: '1pt solid #FCD34D',
                        borderRadius: '6pt',
                        padding: '10pt',
                        marginBottom: '12pt'
                    } },
                    react_1.default.createElement("p", { style: { fontSize: '10pt', marginBottom: '4pt' } },
                        react_1.default.createElement("strong", null, "Duration:"),
                        " ",
                        pathway.duration),
                    pathway.prPathway && (react_1.default.createElement("p", { style: { fontSize: '10pt', marginBottom: '0' } },
                        react_1.default.createElement("strong", null, "PR Pathway:"),
                        " ",
                        pathway.prPathway)))),
                react_1.default.createElement("div", { style: { marginBottom: '12pt' } },
                    react_1.default.createElement("div", { style: { marginBottom: '8pt' } },
                        react_1.default.createElement("p", { style: { fontSize: '9pt', color: '#6B7280', marginBottom: '4pt' } }, "Processing Time:"),
                        react_1.default.createElement("p", { style: { fontSize: '11pt', fontWeight: '600', color: '#1F2937', marginBottom: '0' } }, pathway.processingTime)),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("p", { style: { fontSize: '9pt', color: '#6B7280', marginBottom: '4pt' } }, "Application Pathway:"),
                        react_1.default.createElement("p", { style: { fontSize: '11pt', fontWeight: '600', color: '#1F2937', marginBottom: '0' } }, pathway.pathway))),
                react_1.default.createElement("div", { style: {
                        background: '#EBF5FF',
                        borderLeft: '4pt solid #0066CC',
                        borderRadius: '6pt',
                        padding: '12pt'
                    } },
                    react_1.default.createElement("p", { style: { fontSize: '10pt', marginBottom: '0', lineHeight: '1.6' } },
                        react_1.default.createElement("strong", { style: { color: '#0066CC' } }, "Why Suitable for You:"),
                        ' ',
                        react_1.default.createElement("span", { style: { color: '#1F2937' } }, pathway.whySuitable))))))))));
}
