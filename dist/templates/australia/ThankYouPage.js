"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThankYouPage = ThankYouPage;
const react_1 = __importDefault(require("react"));
function ThankYouPage({ data }) {
    // Logo URL - using same as CoverPage for consistency
    const logoUrl = "https://res.cloudinary.com/djvvz62dw/image/upload/v1765014046/worldvisa/logo_uavsjh.svg";
    // CTA Button validation and URL normalization for PDF compatibility
    const ctaLink = data.ctaButton?.link || '#';
    const ctaText = data.ctaButton?.text || 'Get Started';
    // Ensure absolute URL for PDF clickability
    let finalCtaLink = '#';
    if (ctaLink && ctaLink !== '#') {
        if (ctaLink.startsWith('http://') || ctaLink.startsWith('https://')) {
            finalCtaLink = ctaLink;
        }
        else if (ctaLink.startsWith('/')) {
            finalCtaLink = `https://worldvisa.com${ctaLink}`;
        }
        else if (ctaLink.startsWith('mailto:') || ctaLink.startsWith('tel:')) {
            finalCtaLink = ctaLink;
        }
        else {
            finalCtaLink = `https://worldvisa.com/${ctaLink}`;
        }
    }
    return (react_1.default.createElement("div", { className: "thank-you-page" },
        react_1.default.createElement("div", { className: "thank-you-logo-container" },
            react_1.default.createElement("img", { src: logoUrl, alt: "WorldVisa", className: "thank-you-logo", onError: (e) => {
                    const target = e.target;
                    if (target && 'style' in target) {
                        target.style.display = 'none';
                    }
                } })),
        react_1.default.createElement("div", { className: "thank-you-hero" },
            react_1.default.createElement("div", { style: { fontSize: '36pt', marginBottom: '16pt' } }, "\uD83C\uDF1F"),
            react_1.default.createElement("h1", { className: "thank-you-heading" }, data.heading),
            react_1.default.createElement("p", { className: "thank-you-message" }, data.thankYouMessage)),
        data.successStats && (react_1.default.createElement("div", { className: "trust-indicators" },
            react_1.default.createElement("div", { className: "trust-item" },
                react_1.default.createElement("span", { className: "trust-number" }, data.successStats.yearsOfExperience),
                react_1.default.createElement("span", { className: "trust-label" }, "Years of Experience")),
            react_1.default.createElement("div", { className: "trust-item" },
                react_1.default.createElement("span", { className: "trust-number" }, data.successStats.clientsServed),
                react_1.default.createElement("span", { className: "trust-label" }, "Clients Served")),
            react_1.default.createElement("div", { className: "trust-item" },
                react_1.default.createElement("span", { className: "trust-number" }, data.successStats.successRate),
                react_1.default.createElement("span", { className: "trust-label" }, "Success Rate")))),
        finalCtaLink !== '#' && (react_1.default.createElement("a", { href: finalCtaLink, className: "cta-button", target: "_blank", rel: "noopener noreferrer", "aria-label": ctaText }, ctaText)),
        react_1.default.createElement("div", { className: "about-worldvisa" },
            react_1.default.createElement("h3", { style: { fontSize: '18pt', color: '#0066CC', marginTop: '0', marginBottom: '16pt' } }, "About WorldVisa"),
            react_1.default.createElement("p", { style: { fontSize: '11pt', lineHeight: '1.7', color: '#4B5563', marginBottom: '16pt' } }, data.aboutWorldVisa),
            react_1.default.createElement("h4", { style: { fontSize: '12pt', color: '#1F2937', marginBottom: '12pt' } }, "Our Services:"),
            react_1.default.createElement("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10pt' } }, data.services.map((service, index) => (react_1.default.createElement("div", { key: index, style: {
                    background: '#EBF5FF',
                    borderRadius: '6pt',
                    padding: '10pt',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8pt'
                } },
                react_1.default.createElement("span", { style: { color: '#0066CC', fontSize: '14pt', fontWeight: '700' } }, "\u2713"),
                react_1.default.createElement("span", { style: { fontSize: '10pt', color: '#1F2937' } }, service)))))),
        react_1.default.createElement("div", { className: "contact-info" },
            react_1.default.createElement("h3", { style: {
                    fontSize: '14pt',
                    color: '#0066CC',
                    marginTop: '0',
                    marginBottom: '16pt',
                    textAlign: 'center'
                } }, "Get in Touch"),
            react_1.default.createElement("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12pt' } },
                react_1.default.createElement("div", { className: "contact-item" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("p", { style: { fontSize: '9pt', color: '#6B7280', marginBottom: '2pt' } }, "Email"),
                        react_1.default.createElement("p", { style: { fontSize: '11pt', color: '#1F2937', marginBottom: '0', fontWeight: '600' } }, data.contactInfo.email))),
                react_1.default.createElement("div", { className: "contact-item" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("p", { style: { fontSize: '9pt', color: '#6B7280', marginBottom: '2pt' } }, "Phone"),
                        react_1.default.createElement("p", { style: { fontSize: '11pt', color: '#1F2937', marginBottom: '0', fontWeight: '600' } }, data.contactInfo.phone))),
                react_1.default.createElement("div", { className: "contact-item" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("p", { style: { fontSize: '9pt', color: '#6B7280', marginBottom: '2pt' } }, "Website"),
                        react_1.default.createElement("p", { style: { fontSize: '11pt', color: '#1F2937', marginBottom: '0', fontWeight: '600' } }, data.contactInfo.website))),
                data.contactInfo.office && (react_1.default.createElement("div", { className: "contact-item" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("p", { style: { fontSize: '9pt', color: '#6B7280', marginBottom: '2pt' } }, "Office"),
                        react_1.default.createElement("p", { style: { fontSize: '11pt', color: '#1F2937', marginBottom: '0', fontWeight: '600' } }, data.contactInfo.office))))),
            react_1.default.createElement("div", { style: {
                    marginTop: '16pt',
                    paddingTop: '16pt',
                    borderTop: '1pt solid #E5E7EB',
                    textAlign: 'center'
                } },
                react_1.default.createElement("p", { style: { fontSize: '10pt', color: '#6B7280', marginBottom: '0' } },
                    react_1.default.createElement("strong", null, "Follow us:"),
                    " ",
                    data.socialMedia.join(' • ')))),
        react_1.default.createElement("div", { className: "footer-text" },
            react_1.default.createElement("div", { style: {
                    width: '100pt',
                    height: '2pt',
                    background: 'linear-gradient(90deg, transparent 0%, #0066CC 50%, transparent 100%)',
                    margin: '0 auto 16pt'
                } }),
            react_1.default.createElement("p", { style: { fontSize: '12pt', fontWeight: '600', color: '#0066CC', marginBottom: '8pt' } }, data.footer.companyTagline),
            react_1.default.createElement("p", { style: { fontSize: '9pt', color: '#9CA3AF', marginBottom: '0' } }, data.footer.copyright))));
}
