"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section7_Timeline = Section7_Timeline;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("./shared/SectionHeader");
const STATIC_TIMELINE_DATA = {
    pathwayName: "End-to-End Timeline per Country (Application to Landing)", // Note: Used as title or similar if needed, though title is hardcoded in component
    phases: [
        {
            phaseName: "Month 0–1: Initial Preparation",
            duration: "Around 1 month",
            steps: [
                "Appear for an English language test (IELTS or PTE)",
                "Collect essential personal, educational, and work-related documents",
                "Consult and engage a registered migration professional if required"
            ]
        },
        {
            phaseName: "Month 1–2: Skills Assessment",
            duration: "6–8 weeks",
            steps: [
                "Submit skills assessment application with the relevant assessing authority",
                "Provide additional documents if requested",
                "Receive the skills assessment outcome"
            ]
        },
        {
            phaseName: "Month 2–3: Expression of Interest (EOI)",
            duration: "Up to 1 month",
            steps: [
                "Create and submit an Expression of Interest (EOI) through SkillSelect",
                "Identify suitable Australian states or territories based on eligibility",
                "Update and optimise the EOI to align with state requirements"
            ]
        },
        {
            phaseName: "Month 3–6: State Nomination Stage",
            duration: "Approximately 3–4 months",
            steps: [
                "EOI is reviewed by the selected state or territory",
                "Additional information or documents may be requested",
                "Receive invitation to apply for state nomination",
                "Submit the state nomination application",
                "State assesses the application and issues nomination approval"
            ]
        },
        {
            phaseName: "Month 6–7: Visa Application Submission",
            duration: "2–3 weeks",
            steps: [
                "Receive state nomination confirmation",
                "Apply for the Subclass 190 visa within the given timeframe",
                "Prepare and submit the complete visa application"
            ]
        },
        {
            phaseName: "Month 7–12: Visa Processing & Grant",
            duration: "3–4 months",
            steps: [
                "Application undergoes initial assessment",
                "Background, employment, and character checks are conducted",
                "Complete medical examinations and police clearance",
                "Visa decision and grant notification"
            ]
        }
    ],
    totalTimeline: "Approximately 12–18 months",
    optimisticTimeline: "As early as 10 months",
    pessimisticTimeline: "Up to 20 months, depending on case complexity and processing times"
};
function Section7_Timeline() {
    const data = STATIC_TIMELINE_DATA;
    // Unified Colors
    const colors = {
        primary: '#111827',
        secondary: '#4B5563',
        accent: '#2563EB', // Blue for timeline
        bgLight: '#F3F4F6',
        border: '#E5E7EB',
        cardBg: '#FFFFFF'
    };
    return (react_1.default.createElement("div", { className: "section timeline-section page" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "7", title: "End-to-End Timeline per Country (Application to Landing)" }),
        react_1.default.createElement("div", { className: "subsection" },
            react_1.default.createElement("div", { className: "timeline-container", style: { position: 'relative' } },
                react_1.default.createElement("div", { style: {
                        position: 'absolute',
                        left: '24pt',
                        top: '8pt', // Align with center of first node
                        bottom: '40pt', // Stop before the last gap
                        width: '2px',
                        background: '#E2E8F0',
                        zIndex: 0
                    } }),
                data.phases.map((phase, index) => (react_1.default.createElement("div", { key: index, style: {
                        marginBottom: '32pt',
                        position: 'relative',
                        paddingLeft: '60pt' // Clear space for line and node
                    } },
                    react_1.default.createElement("div", { style: {
                            position: 'absolute',
                            left: '16pt', // Center on line at 24pt (16 + 8)
                            top: '0',
                            width: '16pt',
                            height: '16pt',
                            borderRadius: '50%',
                            background: colors.accent,
                            border: '4px solid #fff',
                            boxShadow: '0 0 0 2px #E2E8F0',
                            zIndex: 2
                        } }),
                    react_1.default.createElement("div", { style: {
                            background: colors.cardBg,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '8pt',
                            padding: '16pt 20pt'
                        } },
                        react_1.default.createElement("div", { style: {
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '12pt',
                                borderBottom: `1px solid ${colors.bgLight}`,
                                paddingBottom: '8pt'
                            } },
                            react_1.default.createElement("div", { style: { fontSize: '13pt', fontWeight: '700', color: colors.primary } }, phase.phaseName),
                            react_1.default.createElement("div", { style: {
                                    background: '#EFF6FF',
                                    color: colors.accent,
                                    fontSize: '9pt',
                                    fontWeight: '700',
                                    padding: '4pt 10pt',
                                    borderRadius: '12pt',
                                    whiteSpace: 'nowrap'
                                } }, phase.duration)),
                        react_1.default.createElement("ul", { style: { margin: 0, paddingLeft: '16pt' } }, phase.steps.map((step, stepIndex) => (react_1.default.createElement("li", { key: stepIndex, style: {
                                fontSize: '10pt',
                                color: colors.secondary,
                                marginBottom: '6pt',
                                lineHeight: '1.5'
                            } }, step))))))))),
            react_1.default.createElement("div", { style: {
                    marginTop: '40pt',
                    background: `linear-gradient(to right, #F8FAFC, #FFFFFF)`,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '12pt',
                    padding: '24pt'
                } },
                react_1.default.createElement("h4", { style: {
                        fontSize: '14pt',
                        fontWeight: '700',
                        color: colors.primary,
                        marginBottom: '20pt',
                        textAlign: 'center'
                    } }, "Estimated Total Processing Time"),
                react_1.default.createElement("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16pt' } },
                    react_1.default.createElement("div", { style: { textAlign: 'center' } },
                        react_1.default.createElement("div", { style: { fontSize: '9pt', textTransform: 'uppercase', color: '#059669', fontWeight: '700', letterSpacing: '0.05em' } }, "Fastest Case"),
                        react_1.default.createElement("div", { style: { fontSize: '16pt', fontWeight: '800', color: colors.primary, marginTop: '4pt' } }, data.optimisticTimeline)),
                    react_1.default.createElement("div", { style: { textAlign: 'center', borderLeft: `1px solid ${colors.border}`, borderRight: `1px solid ${colors.border}` } },
                        react_1.default.createElement("div", { style: { fontSize: '9pt', textTransform: 'uppercase', color: colors.accent, fontWeight: '700', letterSpacing: '0.05em' } }, "Typical Timeline"),
                        react_1.default.createElement("div", { style: { fontSize: '18pt', fontWeight: '800', color: colors.primary, marginTop: '4pt' } }, data.totalTimeline)),
                    react_1.default.createElement("div", { style: { textAlign: 'center' } },
                        react_1.default.createElement("div", { style: { fontSize: '9pt', textTransform: 'uppercase', color: '#D97706', fontWeight: '700', letterSpacing: '0.05em' } }, "Complex Cases"),
                        react_1.default.createElement("div", { style: { fontSize: '16pt', fontWeight: '800', color: colors.primary, marginTop: '4pt' } }, data.pessimisticTimeline)))))));
}
