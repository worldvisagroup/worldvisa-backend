"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section7_Timeline = Section7_Timeline;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("./shared/SectionHeader");
const STATIC_TIMELINE_DATA = {
    pathwayName: "End-to-End Timeline per Country (Application to Landing)",
    phases: [
        {
            phaseName: "Month 0-1: Initial Preparation",
            duration: "Around 1 month",
            steps: [
                "Appear for an English language test (IELTS or PTE)",
                "Collect essential personal, educational, and work-related documents",
                "Consult and engage a registered migration professional if required"
            ]
        },
        {
            phaseName: "Month 1-2: Skills Assessment",
            duration: "6-8 weeks",
            steps: [
                "Submit skills assessment application with the relevant assessing authority",
                "Provide additional documents if requested",
                "Receive the skills assessment outcome"
            ]
        },
        {
            phaseName: "Month 2-3: Expression of Interest (EOI)",
            duration: "Up to 1 month",
            steps: [
                "Create and submit an Expression of Interest (EOI) through SkillSelect",
                "Identify suitable Australian states or territories based on eligibility",
                "Update and optimise the EOI to align with state requirements"
            ]
        },
        {
            phaseName: "Month 3-6: State Nomination Stage",
            duration: "Approximately 3-4 months",
            steps: [
                "EOI is reviewed by the selected state or territory",
                "Additional information or documents may be requested",
                "Receive invitation to apply for state nomination",
                "Submit the state nomination application",
                "State assesses the application and issues nomination approval"
            ]
        },
        {
            phaseName: "Month 6-7: Visa Application Submission",
            duration: "2-3 weeks",
            steps: [
                "Receive state nomination confirmation",
                "Apply for the Subclass 190 visa within the given timeframe",
                "Prepare and submit the complete visa application"
            ]
        },
        {
            phaseName: "Month 7-12: Visa Processing & Grant",
            duration: "3-4 months",
            steps: [
                "Application undergoes initial assessment",
                "Background, employment, and character checks are conducted",
                "Complete medical examinations and police clearance",
                "Visa decision and grant notification"
            ]
        }
    ],
    totalTimeline: "Approximately 12-18 months",
    optimisticTimeline: "As early as 10 months",
    pessimisticTimeline: "Up to 20 months, depending on case complexity and processing times"
};
function Section7_Timeline() {
    const data = STATIC_TIMELINE_DATA;
    return (react_1.default.createElement("div", { className: "section page" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "7", title: "End-to-End Timeline (Application to Landing)" }),
        react_1.default.createElement("div", { className: "timeline" }, data.phases.map((phase, index) => (react_1.default.createElement("div", { key: index, className: "timeline-phase" },
            react_1.default.createElement("div", { className: "timeline-phase-name" }, phase.phaseName),
            react_1.default.createElement("div", { className: "timeline-phase-duration" }, phase.duration),
            react_1.default.createElement("ul", { className: "timeline-steps" }, phase.steps.map((step, stepIndex) => (react_1.default.createElement("li", { key: stepIndex }, step)))))))),
        react_1.default.createElement("div", { style: { marginTop: '10pt', border: '0.5pt solid #E5E7EB', borderRadius: '4pt', padding: '10pt' } },
            react_1.default.createElement("h4", { style: { fontSize: '12pt', fontWeight: 700, color: '#111827', marginBottom: '8pt', marginTop: 0, textAlign: 'center' } }, "Estimated Total Processing Time"),
            react_1.default.createElement("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8pt' } },
                react_1.default.createElement("div", { style: { textAlign: 'center' } },
                    react_1.default.createElement("div", { style: { fontSize: '10pt', textTransform: 'uppercase', color: '#059669', fontWeight: 700, letterSpacing: '0.04em' } }, "Fastest Case"),
                    react_1.default.createElement("div", { style: { fontSize: '12pt', fontWeight: 700, color: '#111827', marginTop: '2pt' } }, data.optimisticTimeline)),
                react_1.default.createElement("div", { style: { textAlign: 'center', borderLeft: '0.5pt solid #E5E7EB', borderRight: '0.5pt solid #E5E7EB' } },
                    react_1.default.createElement("div", { style: { fontSize: '10pt', textTransform: 'uppercase', color: '#1B2A4A', fontWeight: 700, letterSpacing: '0.04em' } }, "Typical Timeline"),
                    react_1.default.createElement("div", { style: { fontSize: '14pt', fontWeight: 700, color: '#111827', marginTop: '2pt' } }, data.totalTimeline)),
                react_1.default.createElement("div", { style: { textAlign: 'center' } },
                    react_1.default.createElement("div", { style: { fontSize: '10pt', textTransform: 'uppercase', color: '#D97706', fontWeight: 700, letterSpacing: '0.04em' } }, "Complex Cases"),
                    react_1.default.createElement("div", { style: { fontSize: '12pt', fontWeight: 700, color: '#111827', marginTop: '2pt' } }, data.pessimisticTimeline))))));
}
