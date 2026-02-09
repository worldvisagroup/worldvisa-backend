"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section8_RegulatoryAdvisor = Section8_RegulatoryAdvisor;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("./shared/SectionHeader");
const STATIC_REGULATORY_ADVISOR_DATA = {
    sectionTitle: "Why Use a Regulated Advisor (MARA)",
    maraNumber: "MARA 1800119",
    agentCredentials: [
        "Graduate Diploma in Australian Migration Law",
        "Member of Migration Institute of Australia (MIA)",
        "21+ years experience in skilled migration"
    ],
    successRate: "98% application approval rate",
    yearsOfExperience: "15+ years",
    whatIsMara: {
        heading: "What is MARA?",
        items: [
            "MARA: Migration Agents Registration Authority (Australia's regulatory body)",
            "For Australia: MARA-registered migration agents are mandatory for most visa services"
        ]
    },
    whyRegulatedAgentsMatter: {
        heading: "Why Regulated Agents Matter",
        reasons: [
            { title: "Legal Authority", description: "Only MARA-registered agents can legally represent you in Australian visa applications" },
            { title: "Accountability", description: "MARA enforces code of conduct" },
            { title: "Professional Standards", description: "Agents must have insurance, professional indemnity, ongoing training" },
            { title: "Error Prevention", description: "Professional agents catch errors that could lead to visa rejection" },
            { title: "Knowledge", description: "Agents stay current on policy changes, processing times, state requirements" },
            { title: "Communication", description: "Agents handle all immigration correspondence; you don't have to decode official jargon" },
            { title: "Peace of Mind", description: "Professional guidance reduces risk and stress" }
        ]
    },
    whatMaraAgentDoes: {
        heading: "What a MARA Agent Does",
        services: [
            "Reviews your eligibility for visa pathways",
            "Advises which visa (189 vs 190 vs 491) best suits your profile",
            "Guides skills assessment (prepares documents, project reports)",
            "Prepares Expression of Interest (EOI) for SkillSelect",
            "Coordinates state sponsorship applications (if needed)",
            "Prepares comprehensive visa application documents",
            "Submits visa application on your behalf",
            "Tracks application progress",
            "Communicates with immigration when they request additional info",
            "Advises on character/health clearance requirements",
            "Available for questions throughout process"
        ]
    }
};
function Section8_RegulatoryAdvisor() {
    const data = STATIC_REGULATORY_ADVISOR_DATA;
    return (react_1.default.createElement("div", { className: "section page" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "8", title: data.sectionTitle }),
        react_1.default.createElement("div", { style: { borderLeft: '3pt solid #1B2A4A', padding: '8pt 10pt', marginBottom: '20pt', background: '#F8F9FB' } },
            react_1.default.createElement("div", { style: { display: 'flex', gap: '16pt', alignItems: 'center', flexWrap: 'wrap' } },
                data.maraNumber && (react_1.default.createElement("div", null,
                    react_1.default.createElement("div", { style: { fontSize: '10pt', color: '#9CA3AF', textTransform: 'uppercase' } }, "MARA Number"),
                    react_1.default.createElement("div", { style: { fontSize: '12pt', fontWeight: 700, color: '#111827' } }, data.maraNumber))),
                data.successRate && (react_1.default.createElement("div", null,
                    react_1.default.createElement("div", { style: { fontSize: '10pt', color: '#9CA3AF', textTransform: 'uppercase' } }, "Success Rate"),
                    react_1.default.createElement("div", { style: { fontSize: '12pt', fontWeight: 700, color: '#059669' } }, data.successRate)))),
            data.agentCredentials && data.agentCredentials.length > 0 && (react_1.default.createElement("div", { style: { marginTop: '6pt', paddingTop: '6pt', borderTop: '0.5pt solid #E5E7EB' } },
                react_1.default.createElement("div", { style: { fontSize: '10pt', fontWeight: 600, color: '#111827', marginBottom: '3pt' } }, "Professional Credentials:"),
                data.agentCredentials.map((cred, idx) => (react_1.default.createElement("div", { key: idx, style: { fontSize: '12pt', color: '#4B5563', marginBottom: '1pt' } },
                    react_1.default.createElement("span", { dangerouslySetInnerHTML: { __html: '&#10003;' }, style: { color: '#059669', marginRight: '4pt' } }),
                    " ",
                    cred)))))),
        react_1.default.createElement("div", { style: { marginBottom: '20pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 } }, data.whatIsMara.heading),
            react_1.default.createElement("ul", { style: { margin: 0, paddingLeft: '14pt' } }, data.whatIsMara.items.map((item, idx) => (react_1.default.createElement("li", { key: idx, style: { fontSize: '12pt', color: '#4B5563', marginBottom: '3pt', lineHeight: '1.4' } }, item))))),
        react_1.default.createElement("div", { style: { marginBottom: '20pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 } }, data.whyRegulatedAgentsMatter.heading),
            data.whyRegulatedAgentsMatter.reasons.map((reason, index) => (react_1.default.createElement("div", { key: index, style: { marginBottom: '4pt', fontSize: '12pt', lineHeight: '1.4' } },
                react_1.default.createElement("strong", { style: { color: '#111827' } },
                    reason.title,
                    ":"),
                ' ',
                react_1.default.createElement("span", { style: { color: '#4B5563' } }, reason.description))))),
        react_1.default.createElement("div", { style: { marginBottom: '16pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 } }, data.whatMaraAgentDoes.heading),
            react_1.default.createElement("div", { style: { borderLeft: '3pt solid #1B2A4A', padding: '6pt 10pt', background: '#F8F9FB' } },
                react_1.default.createElement("ul", { style: { margin: 0, paddingLeft: '14pt', columns: 2, columnGap: '16pt' } }, data.whatMaraAgentDoes.services.map((service, idx) => (react_1.default.createElement("li", { key: idx, style: { fontSize: '12pt', color: '#4B5563', marginBottom: '3pt', lineHeight: '1.4' } }, service))))))));
}
