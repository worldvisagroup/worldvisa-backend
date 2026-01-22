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
    maraNumber: "MARA 1234567",
    agentCredentials: [
        "Graduate Diploma in Australian Migration Law",
        "Member of Migration Institute of Australia (MIA)",
        "15+ years experience in skilled migration"
    ],
    successRate: "98% application approval rate",
    yearsOfExperience: "15+ years",
    whatIsMara: {
        heading: "What is MARA?",
        items: [
            "MARA: Migration Agents Registration Authority (Australia's regulatory body)",
            "RCIC: Regulated Canadian Immigration Consultant (for Canada; not applicable here)",
            "For Australia: MARA-registered migration agents are mandatory for most visa services"
        ]
    },
    whyRegulatedAgentsMatter: {
        heading: "Why Regulated Agents Matter",
        reasons: [
            {
                title: "Legal Authority",
                description: "Only MARA-registered agents can legally represent you in Australian visa applications"
            },
            {
                title: "Accountability",
                description: "MARA enforces code of conduct; complaints go to MARA (recourse if poor service)"
            },
            {
                title: "Professional Standards",
                description: "Agents must have insurance, professional indemnity, ongoing training"
            },
            {
                title: "Error Prevention",
                description: "Professional agents catch errors that could lead to visa rejection"
            },
            {
                title: "Knowledge",
                description: "Agents stay current on policy changes, processing times, state requirements"
            },
            {
                title: "Communication",
                description: "Agents handle all immigration correspondence; you don't have to decode official jargon"
            },
            {
                title: "Peace of Mind",
                description: "Professional guidance reduces risk and stress"
            }
        ]
    },
    whatMaraAgentDoes: {
        heading: "What a MARA Agent Does",
        services: [
            "Reviews your eligibility for visa pathways",
            "Advises which visa (189 vs 190 vs 491) best suits your profile",
            "Guides ACS skills assessment (prepares documents, project reports)",
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
    // Unified Professional Colors
    const colors = {
        primary: '#111827',
        secondary: '#4B5563',
        accent: '#059669',
        bgLight: '#F3F4F6',
        border: '#E5E7EB',
        cardBg: '#FFFFFF'
    };
    return (react_1.default.createElement("div", { className: "section regulatory-advisor page" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "8", title: data.sectionTitle }),
        react_1.default.createElement("div", { style: {
                background: `linear-gradient(to bottom right, ${colors.bgLight}, #F9FAFB)`,
                border: `1px solid ${colors.border}`,
                borderRadius: '12pt',
                padding: '24pt',
                marginBottom: '32pt',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24pt',
                alignItems: 'center'
            } },
            react_1.default.createElement("div", null,
                react_1.default.createElement("h4", { style: { fontSize: '14pt', fontWeight: '700', color: colors.primary, marginBottom: '20pt' } }, "Authorized & Regulated"),
                react_1.default.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '16pt' } },
                    react_1.default.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: '12pt' } },
                        react_1.default.createElement("div", { style: {
                                width: '32pt', height: '32pt', borderRadius: '50%', background: '#DEF7EC',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: colors.accent, fontWeight: 'bold'
                            } }, "\u2713"),
                        react_1.default.createElement("div", null,
                            react_1.default.createElement("div", { style: { fontSize: '9pt', color: colors.secondary, textTransform: 'uppercase', letterSpacing: '0.05em' } }, "MARA Number"),
                            react_1.default.createElement("div", { style: { fontSize: '14pt', fontWeight: '700', color: colors.primary } }, data.maraNumber))),
                    react_1.default.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: '12pt' } },
                        react_1.default.createElement("div", { style: {
                                width: '32pt', height: '32pt', borderRadius: '50%', background: '#DEF7EC',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: colors.accent, fontWeight: 'bold'
                            } }, "%"),
                        react_1.default.createElement("div", null,
                            react_1.default.createElement("div", { style: { fontSize: '9pt', color: colors.secondary, textTransform: 'uppercase', letterSpacing: '0.05em' } }, "Success Rate"),
                            react_1.default.createElement("div", { style: { fontSize: '14pt', fontWeight: '700', color: colors.primary } }, data.successRate?.split(' ')[0]))))),
            react_1.default.createElement("div", { style: { background: colors.cardBg, padding: '16pt', borderRadius: '8pt', border: `1px solid ${colors.border}` } },
                react_1.default.createElement("p", { style: { fontSize: '10pt', fontWeight: '600', color: colors.primary, marginBottom: '12pt' } }, "Professional Credentials"),
                react_1.default.createElement("ul", { style: { padding: 0, margin: 0, listStyle: 'none' } }, data.agentCredentials?.map((cred, idx) => (react_1.default.createElement("li", { key: idx, style: {
                        marginBottom: '8pt',
                        fontSize: '9.5pt',
                        color: colors.secondary,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8pt'
                    } },
                    react_1.default.createElement("span", { style: { color: colors.accent, marginTop: '1pt' } }, "\u2022"),
                    cred)))))),
        react_1.default.createElement("div", { style: { display: 'grid', gridTemplateColumns: '1fr', gap: '32pt' } },
            react_1.default.createElement("div", null,
                react_1.default.createElement("h3", { style: { fontSize: '16pt', fontWeight: '700', color: colors.primary, marginBottom: '16pt', borderBottom: `2px solid ${colors.border}`, paddingBottom: '8pt' } }, data.whyRegulatedAgentsMatter.heading),
                react_1.default.createElement("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12pt' } }, data.whyRegulatedAgentsMatter.reasons.map((reason, index) => (react_1.default.createElement("div", { key: index, style: {
                        background: colors.cardBg,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8pt',
                        padding: '16pt',
                        display: 'flex',
                        gap: '12pt'
                    } },
                    react_1.default.createElement("div", { style: {
                            marginTop: '2pt',
                            color: '#2563EB',
                            fontWeight: 'bold',
                            fontSize: '12pt'
                        } }, "\u2022"),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("div", { style: { fontSize: '11pt', fontWeight: '600', color: colors.primary, marginBottom: '4pt' } }, reason.title),
                        react_1.default.createElement("div", { style: { fontSize: '9.5pt', lineHeight: '1.5', color: colors.secondary } }, reason.description))))))),
            react_1.default.createElement("div", null,
                react_1.default.createElement("div", { style: {
                        background: '#F8FAFC',
                        borderLeft: `4px solid #2563EB`,
                        borderRadius: '4pt',
                        padding: '24pt'
                    } },
                    react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: '700', color: colors.primary, marginBottom: '16pt', marginTop: 0 } }, data.whatMaraAgentDoes.heading),
                    react_1.default.createElement("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'x 24pt' } },
                        react_1.default.createElement("ul", { style: { margin: 0, paddingLeft: '16pt', color: colors.secondary, fontSize: '10pt', lineHeight: '1.8' } }, data.whatMaraAgentDoes.services.slice(0, Math.ceil(data.whatMaraAgentDoes.services.length / 2)).map((item, i) => (react_1.default.createElement("li", { key: i }, item)))),
                        react_1.default.createElement("ul", { style: { margin: 0, paddingLeft: '16pt', color: colors.secondary, fontSize: '10pt', lineHeight: '1.8' } }, data.whatMaraAgentDoes.services.slice(Math.ceil(data.whatMaraAgentDoes.services.length / 2)).map((item, i) => (react_1.default.createElement("li", { key: i }, item))))))))));
}
