"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThankYouPage = ThankYouPage;
const react_1 = __importDefault(require("react"));
const STATIC_THANK_YOU_DATA = {
    heading: "Your Journey to Global Opportunities Starts Here",
    thankYouMessage: "Congratulations on taking the first step toward your international career! This comprehensive report is designed to empower you with the knowledge and insights needed to make informed decisions about your migration journey. Your future awaits, and we're here to guide you every step of the way.",
    aboutWorldVisa: "WorldVisa is your trusted partner for immigration services, providing expert guidance for skilled professionals seeking opportunities worldwide. With years of experience and a team of MARA-certified advisors, we've helped thousands of clients successfully navigate complex immigration processes.",
    successStats: {
        yearsOfExperience: "21+",
        clientsServed: "150k+",
        successRate: "98%"
    },
    services: [
        "Comprehensive Eligibility Assessment",
        "Expert Skills Assessment Guidance",
        "Strategic Documentation & Case Preparation",
        "End-to-End Application Management",
        "Post-Landing & Settlement Services"
    ],
    contactInfo: {
        email: "contact@worldvisa.com",
        phone: "+91 7022090909",
        website: "https://worldvisagroup.com",
        office: "Manipal Center, Dickenson Rd, Bengaluru, Karnataka 560042"
    },
    socialMedia: ["LinkedIn", "Instagram", "Facebook"],
    ctaButton: {
        text: "Schedule Your Free Consultation",
        link: "/contact"
    },
    footer: {
        companyTagline: "WorldVisa - Your Global Immigration Partner",
        copyright: "\u00A9 2026 WorldVisa. All rights reserved."
    }
};
function ThankYouPage() {
    const data = STATIC_THANK_YOU_DATA;
    const contactInfo = data.contactInfo;
    const t = {
        dark: '#111827',
        text: '#4B5563',
        muted: '#9CA3AF',
        accent: '#1B2A4A',
        border: '#E5E7EB',
        bg: '#FAFAFA',
        green: '#059669',
    };
    return (react_1.default.createElement("div", { style: {
            minHeight: '297mm',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '14mm 16mm',
            color: t.dark
        } },
        react_1.default.createElement("div", { style: { textAlign: 'center', marginBottom: '20pt', marginTop: '10pt' } },
            react_1.default.createElement("img", { src: "https://res.cloudinary.com/djvvz62dw/image/upload/v1765014046/worldvisa/logo_uavsjh.svg", alt: "WorldVisa", style: { height: '28pt', marginBottom: '16pt' } }),
            react_1.default.createElement("h1", { style: { fontSize: '22pt', fontWeight: 700, color: t.dark, marginBottom: '8pt', lineHeight: '1.2' } }, data.heading),
            react_1.default.createElement("p", { style: { fontSize: '12pt', lineHeight: '1.6', color: t.text, maxWidth: '420pt', margin: '0 auto' } }, data.thankYouMessage)),
        data.successStats && (react_1.default.createElement("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8pt', marginBottom: '20pt' } }, [
            { label: 'Years of Experience', value: data.successStats.yearsOfExperience },
            { label: 'Clients Served', value: data.successStats.clientsServed },
            { label: 'Success Rate', value: data.successStats.successRate },
        ].map((item, idx) => (react_1.default.createElement("div", { key: idx, style: { border: `0.5pt solid ${t.border}`, borderRadius: '4pt', padding: '12pt', textAlign: 'center' } },
            react_1.default.createElement("div", { style: { fontSize: '20pt', fontWeight: 700, color: t.accent, marginBottom: '2pt' } }, item.value),
            react_1.default.createElement("div", { style: { fontSize: '10pt', textTransform: 'uppercase', letterSpacing: '0.04em', color: t.muted, fontWeight: 600 } }, item.label)))))),
        react_1.default.createElement("div", { style: { display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16pt', marginBottom: '16pt' } },
            react_1.default.createElement("div", null,
                react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: t.dark, marginBottom: '6pt', marginTop: 0, paddingBottom: '4pt', borderBottom: `1px solid ${t.border}` } }, "About WorldVisa"),
                react_1.default.createElement("p", { style: { fontSize: '12pt', lineHeight: '1.6', color: t.text, marginBottom: '12pt' } }, data.aboutWorldVisa),
                react_1.default.createElement("h4", { style: { fontSize: '12pt', fontWeight: 700, color: t.dark, marginBottom: '6pt', marginTop: 0 } }, "Our Services"),
                data.services.map((service, index) => (react_1.default.createElement("div", { key: index, style: { display: 'flex', alignItems: 'center', gap: '6pt', marginBottom: '4pt' } },
                    react_1.default.createElement("span", { style: { color: t.green, fontSize: '12pt', fontWeight: 700 } }, "\u2713"),
                    react_1.default.createElement("span", { style: { fontSize: '12pt', color: t.text } }, service))))),
            react_1.default.createElement("div", { style: { background: t.bg, border: `0.5pt solid ${t.border}`, borderRadius: '6pt', padding: '14pt' } },
                react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: t.dark, marginBottom: '10pt', marginTop: 0 } }, "Contact Us"),
                contactInfo?.email && (react_1.default.createElement("div", { style: { marginBottom: '8pt' } },
                    react_1.default.createElement("div", { style: { fontSize: '10pt', color: t.muted, marginBottom: '1pt', textTransform: 'uppercase' } }, "Email"),
                    react_1.default.createElement("div", { style: { fontSize: '12pt', fontWeight: 500, color: t.dark } }, contactInfo.email))),
                contactInfo?.phone && (react_1.default.createElement("div", { style: { marginBottom: '8pt' } },
                    react_1.default.createElement("div", { style: { fontSize: '10pt', color: t.muted, marginBottom: '1pt', textTransform: 'uppercase' } }, "Phone"),
                    react_1.default.createElement("div", { style: { fontSize: '12pt', fontWeight: 500, color: t.dark } }, contactInfo.phone))),
                contactInfo?.website && (react_1.default.createElement("div", { style: { marginBottom: '8pt' } },
                    react_1.default.createElement("div", { style: { fontSize: '10pt', color: t.muted, marginBottom: '1pt', textTransform: 'uppercase' } }, "Website"),
                    react_1.default.createElement("div", { style: { fontSize: '12pt', fontWeight: 500, color: t.dark } }, contactInfo.website))),
                contactInfo?.office && (react_1.default.createElement("div", { style: { marginBottom: '8pt' } },
                    react_1.default.createElement("div", { style: { fontSize: '10pt', color: t.muted, marginBottom: '1pt', textTransform: 'uppercase' } }, "Office"),
                    react_1.default.createElement("div", { style: { fontSize: '12pt', fontWeight: 500, color: t.dark, lineHeight: '1.4' } }, contactInfo.office))))),
        react_1.default.createElement("div", { style: { borderTop: `0.5pt solid ${t.border}`, paddingTop: '10pt', textAlign: 'center' } },
            react_1.default.createElement("p", { style: { fontSize: '10pt', color: t.muted, margin: 0 } },
                data.footer.companyTagline,
                " | ",
                data.footer.copyright))));
}
