"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section8_WorldVisaTimeline = Section8_WorldVisaTimeline;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("../shared/SectionHeader");
const STATIC_WORLD_VISA_TIMELINE_DATA = {
    phases: [
        {
            name: "Phase 1: Initial Consultation (Week 1)",
            duration: "1 week",
            steps: [
                "Profile assessment and eligibility evaluation",
                "Pathway recommendation (Opportunity Card vs EU Blue Card)",
                "Document checklist preparation",
                "Contract signing and onboarding"
            ]
        },
        {
            name: "Phase 2: Documentation (Weeks 2-4)",
            duration: "3 weeks",
            steps: [
                "Document collection and verification",
                "Credential recognition application (Anabin database)",
                "Language test registration and preparation",
                "Financial proof documentation (blocked account setup)",
                "Apostille and translation services"
            ]
        },
        {
            name: "Phase 3: Application Preparation (Weeks 5-8)",
            duration: "4 weeks",
            steps: [
                "Visa application form completion",
                "Embassy appointment scheduling",
                "Cover letter and motivation statement preparation",
                "Job search strategy (for Opportunity Card)",
                "Final document review and submission"
            ]
        },
        {
            name: "Phase 4: Post-Submission Support (Months 3-6)",
            duration: "3-4 months",
            steps: [
                "Application tracking and status monitoring",
                "Responding to additional documentation requests",
                "Interview preparation (if required)",
                "Health insurance arrangement",
                "Regular status updates and consultation"
            ]
        },
        {
            name: "Phase 5: Landing and Settlement (Month 6+)",
            duration: "Ongoing",
            steps: [
                "Pre-arrival guidance and checklist",
                "Registration (Anmeldung) assistance",
                "Tax ID and health insurance registration",
                "Banking setup guidance",
                "Job search and networking support (Opportunity Card holders)",
                "Post-landing follow-up and advisory"
            ]
        }
    ]
};
function Section8_WorldVisaTimeline() {
    const data = STATIC_WORLD_VISA_TIMELINE_DATA;
    return (react_1.default.createElement("div", { className: "section page" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "8", title: "WorldVisa Immigration Timeline" }),
        react_1.default.createElement("p", { style: { fontSize: '12pt', color: '#4B5563', marginBottom: '20pt', lineHeight: '1.5', marginTop: 0 } }, "Your step-by-step journey to German permanent residency with WorldVisa's comprehensive support."),
        data.phases.map((phase, index) => (react_1.default.createElement("div", { key: index, style: { marginBottom: '20pt', pageBreakInside: 'avoid' } },
            react_1.default.createElement("div", { style: { borderLeft: '3pt solid #1B2A4A', padding: '6pt 10pt', background: '#FFFFFF', border: '0.5pt solid #E5E7EB', borderLeftWidth: '3pt', borderLeftColor: '#1B2A4A' } },
                react_1.default.createElement("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4pt', paddingBottom: '4pt', borderBottom: '0.5pt solid #E5E7EB' } },
                    react_1.default.createElement("span", { style: { fontSize: '12pt', fontWeight: 700, color: '#111827' } }, phase.name),
                    react_1.default.createElement("span", { style: { fontSize: '10pt', fontWeight: 600, color: '#1B2A4A', background: '#EFF6FF', padding: '2pt 6pt' } }, phase.duration)),
                react_1.default.createElement("ul", { style: { margin: 0, paddingLeft: '14pt', fontSize: '12pt', color: '#4B5563', lineHeight: '1.4' } }, phase.steps.map((step, stepIndex) => (react_1.default.createElement("li", { key: stepIndex, style: { marginBottom: '2pt' } }, step)))))))),
        react_1.default.createElement("div", { style: { marginTop: '10pt', padding: '10pt', background: '#F0FDF4', border: '0.5pt solid #059669' } },
            react_1.default.createElement("h4", { style: { fontSize: '12pt', fontWeight: 700, color: '#065F46', marginTop: 0, marginBottom: '6pt', textAlign: 'center' } }, "WorldVisa's Success Track Record"),
            react_1.default.createElement("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10pt' } },
                react_1.default.createElement("div", { style: { textAlign: 'center' } },
                    react_1.default.createElement("div", { style: { fontSize: '14pt', fontWeight: 700, color: '#059669' } }, "95%"),
                    react_1.default.createElement("div", { style: { fontSize: '10pt', fontWeight: 600, color: '#064E3B', textTransform: 'uppercase' } }, "Success Rate")),
                react_1.default.createElement("div", { style: { textAlign: 'center', borderLeft: '0.5pt solid #A7F3D0', borderRight: '0.5pt solid #A7F3D0' } },
                    react_1.default.createElement("div", { style: { fontSize: '14pt', fontWeight: 700, color: '#059669' } }, "5,000+"),
                    react_1.default.createElement("div", { style: { fontSize: '10pt', fontWeight: 600, color: '#064E3B', textTransform: 'uppercase' } }, "Clients Served")),
                react_1.default.createElement("div", { style: { textAlign: 'center' } },
                    react_1.default.createElement("div", { style: { fontSize: '14pt', fontWeight: 700, color: '#059669' } }, "15+"),
                    react_1.default.createElement("div", { style: { fontSize: '10pt', fontWeight: 600, color: '#064E3B', textTransform: 'uppercase' } }, "Years Experience")))),
        react_1.default.createElement("div", { style: { marginTop: '10pt', padding: '8pt 10pt', background: '#EFF6FF', border: '0.5pt solid #BFDBFE', textAlign: 'center' } },
            react_1.default.createElement("p", { style: { fontSize: '12pt', fontWeight: 700, color: '#1E3A8A', marginBottom: '4pt', marginTop: 0 } }, "Ready to begin your German immigration journey?"),
            react_1.default.createElement("p", { style: { fontSize: '12pt', color: '#4B5563', marginBottom: 0, lineHeight: '1.5' } }, "Contact WorldVisa today to schedule your free consultation and get started on your pathway to permanent residency."))));
}
