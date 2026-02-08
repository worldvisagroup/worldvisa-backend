"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CountryIntroPage = CountryIntroPage;
const react_1 = __importDefault(require("react"));
function CountryIntroPage({ countryName, flagImagePath, usps, }) {
    const t = {
        dark: '#111827',
        text: '#4B5563',
        accent: '#1B2A4A',
        border: '#E5E7EB',
        bg: '#FAFAFA',
    };
    return (react_1.default.createElement("div", { style: {
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '10mm 14mm',
            textAlign: 'center'
        } },
        react_1.default.createElement("div", { style: {
                width: '240pt',
                height: '120pt',
                marginBottom: '20pt',
                borderRadius: '6pt',
                overflow: 'hidden',
            } },
            react_1.default.createElement("img", { src: flagImagePath, alt: `${countryName} flag`, style: { width: '100%', height: '100%', objectFit: 'cover' } })),
        react_1.default.createElement("h1", { style: {
                fontSize: '32pt',
                fontWeight: 700,
                color: t.dark,
                marginBottom: '4pt',
                lineHeight: 1.1,
            } }, countryName),
        react_1.default.createElement("p", { style: {
                fontSize: '14pt',
                color: t.accent,
                fontWeight: 600,
                marginBottom: '20pt',
            } }, "Visa Opportunities Report"),
        react_1.default.createElement("div", { style: { width: '40pt', height: '2px', background: t.accent, marginBottom: '20pt' } }),
        react_1.default.createElement("div", { style: {
                background: t.bg,
                borderRadius: '8pt',
                padding: '16pt 20pt',
                maxWidth: '400pt',
                width: '100%',
                border: `0.5pt solid ${t.border}`,
                textAlign: 'left',
            } },
            react_1.default.createElement("h3", { style: {
                    fontSize: '11pt',
                    fontWeight: 700,
                    color: t.dark,
                    marginBottom: '10pt',
                    marginTop: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5pt',
                    textAlign: 'center',
                } },
                "Why ",
                countryName,
                "?"),
            usps.map((usp, index) => (react_1.default.createElement("div", { key: index, style: {
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8pt',
                    marginBottom: '6pt',
                    fontSize: '11pt',
                    lineHeight: '1.5',
                    color: t.text,
                } },
                react_1.default.createElement("span", { style: { color: t.accent, fontWeight: 700, flexShrink: 0, marginTop: '1pt' } }, "\u2713"),
                react_1.default.createElement("span", null, usp))))),
        react_1.default.createElement("div", { style: {
                marginTop: '20pt',
                fontSize: '10pt',
                color: t.text,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '2pt',
            } }, "Comprehensive Migration Assessment")));
}
