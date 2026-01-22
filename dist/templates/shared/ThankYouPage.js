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
        clientsServed: "50k+",
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
        copyright: "© 2026 WorldVisa. All rights reserved."
    }
};
function ThankYouPage() {
    // Use static data
    const data = STATIC_THANK_YOU_DATA;
    const contactInfo = data.contactInfo;
    // Professional Color Palette
    const colors = {
        primary: '#111827', // Dark Gray/Black for main text
        accent: '#0F766E', // Teal/Emerald for trust/success
        brand: '#1D4ED8', // Professional Blue
        textLight: '#6B7280',
        bgLight: '#F3F4F6',
        border: '#E5E7EB',
        red: '#D52636'
    };
    return (react_1.default.createElement("div", { className: "thank-you-page", style: { color: colors.primary, padding: '20mm 25mm' } },
        react_1.default.createElement("div", { style: { textAlign: 'center', maxWidth: '600pt', margin: '0 auto 32pt auto' } },
            react_1.default.createElement("h1", { style: {
                    fontSize: '28pt',
                    fontWeight: '700',
                    marginBottom: '16pt',
                    color: colors.primary,
                    letterSpacing: '-0.5px'
                } }, data.heading),
            react_1.default.createElement("p", { style: {
                    fontSize: '12pt',
                    lineHeight: '1.6',
                    color: colors.textLight,
                    maxWidth: '500pt',
                    margin: '0 auto'
                } }, data.thankYouMessage)),
        data.successStats && (react_1.default.createElement("div", { style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12pt',
                marginBottom: '32pt'
            } }, [
            { label: 'Years of Experience', value: data.successStats.yearsOfExperience },
            { label: 'Clients Served', value: data.successStats.clientsServed },
            { label: 'Success Rate', value: data.successStats.successRate },
        ].map((item, idx) => (react_1.default.createElement("div", { key: idx, style: {
                background: '#FFFFFF',
                border: `1px solid ${colors.border}`,
                borderRadius: '8pt',
                padding: '16pt',
                textAlign: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
            } },
            react_1.default.createElement("div", { style: {
                    fontSize: '24pt',
                    fontWeight: '600',
                    color: colors.red,
                    marginBottom: '4pt'
                } }, item.value),
            react_1.default.createElement("div", { style: {
                    fontSize: '9pt',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: colors.textLight,
                    fontWeight: '600'
                } }, item.label)))))),
        react_1.default.createElement("div", { style: { display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24pt' } },
            react_1.default.createElement("div", null,
                react_1.default.createElement("h3", { style: {
                        fontSize: '16pt',
                        fontWeight: '700',
                        marginBottom: '12pt',
                        borderBottom: `2px solid ${colors.bgLight}`,
                        paddingBottom: '8pt'
                    } }, "About WorldVisa"),
                react_1.default.createElement("p", { style: { fontSize: '10.5pt', lineHeight: '1.7', color: '#374151', marginBottom: '24pt' } }, data.aboutWorldVisa),
                react_1.default.createElement("h4", { style: { fontSize: '12pt', fontWeight: '700', marginBottom: '12pt' } }, "Our Services"),
                react_1.default.createElement("div", { style: { display: 'grid', gridTemplateColumns: '1fr', gap: '8pt' } }, data.services.map((service, index) => (react_1.default.createElement("div", { key: index, style: { display: 'flex', alignItems: 'center', gap: '8pt' } },
                    react_1.default.createElement("span", { style: { color: colors.accent, fontSize: '12pt', fontWeight: 'bold' } }, "\u2713"),
                    react_1.default.createElement("span", { style: { fontSize: '10.5pt', color: '#374151' } }, service)))))),
            react_1.default.createElement("div", null,
                react_1.default.createElement("div", { style: {
                        background: '#F8FAFC',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '12pt',
                        padding: '20pt',
                        height: '100%'
                    } },
                    react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: '700', marginBottom: '16pt', color: colors.primary } }, "Contact Us"),
                    react_1.default.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '12pt' } },
                        contactInfo?.email && (react_1.default.createElement("div", null,
                            react_1.default.createElement("div", { style: { fontSize: '9pt', color: colors.textLight, marginBottom: '2pt' } }, "Email"),
                            react_1.default.createElement("div", { style: { fontSize: '11pt', fontWeight: '500' } }, contactInfo.email))),
                        contactInfo?.phone && (react_1.default.createElement("div", null,
                            react_1.default.createElement("div", { style: { fontSize: '9pt', color: colors.textLight, marginBottom: '2pt' } }, "Phone"),
                            react_1.default.createElement("div", { style: { fontSize: '11pt', fontWeight: '500' } }, contactInfo.phone))),
                        contactInfo?.website && (react_1.default.createElement("div", null,
                            react_1.default.createElement("div", { style: { fontSize: '9pt', color: colors.textLight, marginBottom: '2pt' } }, "Website"),
                            react_1.default.createElement("div", { style: { fontSize: '11pt', fontWeight: '500' } }, contactInfo.website))),
                        contactInfo?.office && (react_1.default.createElement("div", null,
                            react_1.default.createElement("div", { style: { fontSize: '9pt', color: colors.textLight, marginBottom: '2pt' } }, "Office"),
                            react_1.default.createElement("div", { style: { fontSize: '10pt', fontWeight: '500', lineHeight: '1.5' } }, contactInfo.office)))),
                    react_1.default.createElement("div", { style: { marginTop: '24pt', textAlign: 'center' } },
                        react_1.default.createElement("p", { style: { fontSize: '9pt', color: colors.textLight } },
                            "Follow us: ",
                            react_1.default.createElement("strong", null, data.socialMedia.join('  •  '))))))),
        react_1.default.createElement("div", { style: {
                borderTop: `1px solid ${colors.border}`,
                paddingTop: '16pt',
                textAlign: 'center',
                paddingBottom: '16pt',
                marginTop: '1pt'
            } },
            react_1.default.createElement("p", { style: { fontSize: '8pt', color: colors.textLight } },
                data.footer.companyTagline,
                " . ",
                data.footer.copyright))));
}
