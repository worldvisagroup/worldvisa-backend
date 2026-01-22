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
    // Unified Colors
    const colors = {
        primary: '#111827',
        secondary: '#4B5563',
        accent: '#2563EB', // Blue for timeline
        bgLight: '#F3F4F6',
        border: '#E5E7EB',
        cardBg: '#FFFFFF'
    };
    return (react_1.default.createElement("div", { className: "section worldvisa-timeline" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "8", title: "WorldVisa Immigration Timeline" }),
        react_1.default.createElement("p", { style: { marginBottom: '32pt', color: colors.secondary, fontSize: '11pt' } }, "Your step-by-step journey to German permanent residency with WorldVisa's comprehensive support."),
        react_1.default.createElement("div", { className: "timeline-container", style: { position: 'relative', marginBottom: '40pt' } },
            react_1.default.createElement("div", { style: {
                    position: 'absolute',
                    left: '24pt',
                    top: '8pt',
                    bottom: '40pt',
                    width: '2px',
                    background: '#E2E8F0',
                    zIndex: 0
                } }),
            data.phases.map((phase, index) => (react_1.default.createElement("div", { key: index, style: {
                    marginBottom: '32pt',
                    position: 'relative',
                    paddingLeft: '60pt'
                } },
                react_1.default.createElement("div", { style: {
                        position: 'absolute',
                        left: '16pt',
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
                        react_1.default.createElement("div", { style: { fontSize: '12pt', fontWeight: '700', color: colors.primary } }, phase.name),
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
                marginTop: '24pt',
                padding: '24pt',
                background: '#ECFDF5', // Lighter emerald bg
                borderRadius: '12pt',
                border: '1px solid #10B981',
                boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.1)'
            } },
            react_1.default.createElement("h4", { style: {
                    fontSize: '14pt',
                    fontWeight: '700',
                    color: '#065F46',
                    marginTop: '0',
                    marginBottom: '20pt',
                    textAlign: 'center'
                } }, "WorldVisa's Success Track Record"),
            react_1.default.createElement("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '24pt'
                } },
                react_1.default.createElement("div", { style: { textAlign: 'center' } },
                    react_1.default.createElement("div", { style: { fontSize: '24pt', fontWeight: '800', color: '#059669' } }, "95%"),
                    react_1.default.createElement("div", { style: { fontSize: '10pt', fontWeight: '600', color: '#064E3B', textTransform: 'uppercase', letterSpacing: '0.05em' } }, "Success Rate")),
                react_1.default.createElement("div", { style: { textAlign: 'center', borderLeft: '1px solid #A7F3D0', borderRight: '1px solid #A7F3D0' } },
                    react_1.default.createElement("div", { style: { fontSize: '24pt', fontWeight: '800', color: '#059669' } }, "5,000+"),
                    react_1.default.createElement("div", { style: { fontSize: '10pt', fontWeight: '600', color: '#064E3B', textTransform: 'uppercase', letterSpacing: '0.05em' } }, "Clients Served")),
                react_1.default.createElement("div", { style: { textAlign: 'center' } },
                    react_1.default.createElement("div", { style: { fontSize: '24pt', fontWeight: '800', color: '#059669' } }, "15+"),
                    react_1.default.createElement("div", { style: { fontSize: '10pt', fontWeight: '600', color: '#064E3B', textTransform: 'uppercase', letterSpacing: '0.05em' } }, "Years Experience")))),
        react_1.default.createElement("div", { style: {
                marginTop: '24pt',
                padding: '20pt',
                background: '#EFF6FF',
                borderRadius: '12pt',
                border: '1px solid #BFDBFE',
                textAlign: 'center'
            } },
            react_1.default.createElement("p", { style: {
                    fontSize: '13pt',
                    fontWeight: '700',
                    color: '#1E3A8A',
                    marginBottom: '8pt'
                } }, "Ready to begin your German immigration journey?"),
            react_1.default.createElement("p", { style: {
                    fontSize: '11pt',
                    color: '#4B5563',
                    marginBottom: '0',
                    lineHeight: '1.6'
                } }, "Contact WorldVisa today to schedule your free consultation and get started on your pathway to permanent residency."))));
}
