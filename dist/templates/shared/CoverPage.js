"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoverPage = CoverPage;
const react_1 = __importDefault(require("react"));
function CoverPage({ data, meta, countries }) {
    // Determine countries list
    const targetCountries = countries && countries.length > 0
        ? countries
        : [meta.country];
    // Specific colors from request
    const theme = {
        red: '#D52636',
        dark: '#111827',
        text: '#4B5563',
        bg: '#F3F4F6'
    };
    return (react_1.default.createElement("div", { className: "cover-page", style: {
            height: '1123px',
            width: '100%',
            position: 'relative',
            overflow: 'hidden',
            padding: '0'
        } },
        react_1.default.createElement("div", { style: {
                position: 'absolute',
                top: 0,
                right: 0,
                width: '55%',
                height: '55%',
                zIndex: 1
            } },
            react_1.default.createElement("img", { src: "https://res.cloudinary.com/djvvz62dw/image/upload/v1767534963/coverpage_image_isdaf4.png", alt: "", style: {
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    position: 'absolute',
                    top: '-10%',
                    right: '-10%'
                } })),
        react_1.default.createElement("div", { style: {
                position: 'relative',
                zIndex: 10,
                padding: '36pt 32pt 28pt 32pt',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            } },
            react_1.default.createElement("div", { style: { marginTop: '16pt' } },
                react_1.default.createElement("img", { src: "https://res.cloudinary.com/djvvz62dw/image/upload/v1765014046/worldvisa/logo_uavsjh.svg", alt: "WorldVisa", style: { height: '36pt', marginBottom: '24pt', display: 'block' } }),
                react_1.default.createElement("p", { style: {
                        fontSize: '12pt',
                        fontWeight: '400',
                        color: theme.dark,
                        marginBottom: '16pt',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    } }, "Personalized for you"),
                react_1.default.createElement("h1", { style: {
                        fontSize: '52pt',
                        fontWeight: '700',
                        color: theme.dark,
                        lineHeight: '1.0',
                        marginBottom: '6pt'
                    } }, "Your Global Report"),
                react_1.default.createElement("h1", { style: {
                        fontSize: '52pt',
                        fontWeight: '700',
                        color: theme.red,
                        lineHeight: '1.0',
                        marginTop: '0'
                    } }, "Ready now")),
            react_1.default.createElement("div", { style: { marginTop: '32pt', maxWidth: '450pt' } },
                react_1.default.createElement("p", { style: {
                        fontSize: '12pt',
                        color: theme.text,
                        lineHeight: '1.6',
                        marginBottom: '24pt'
                    } },
                    "Built by visa experts, this report gives you a structured view of your global prospects.",
                    react_1.default.createElement("br", null),
                    "No guesswork \u2014 just clear insights to help you make informed decisions."),
                react_1.default.createElement("div", { style: {
                        width: '60pt',
                        height: '3px',
                        background: theme.red,
                        marginBottom: '30pt'
                    } })),
            react_1.default.createElement("div", { style: { marginBottom: '30pt' } },
                react_1.default.createElement("p", { style: {
                        fontSize: '12pt',
                        fontWeight: '500',
                        color: theme.text,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '12pt'
                    } }, "Target Destinations"),
                react_1.default.createElement("div", { style: { display: 'flex', gap: '10pt', flexWrap: 'wrap' } }, targetCountries.map((country, idx) => (react_1.default.createElement("div", { key: idx, style: {
                        padding: '8pt 24pt',
                        background: '#FFFFFF',
                        color: theme.dark,
                        borderRadius: '50pt',
                        fontSize: '12pt',
                        fontWeight: '600',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                        border: `1px solid ${theme.bg}`
                    } }, country))))),
            react_1.default.createElement("div", { style: {
                    display: 'flex',
                    gap: '50pt',
                } },
                react_1.default.createElement("div", null,
                    react_1.default.createElement("div", { style: { fontSize: '36pt', fontWeight: '600', color: theme.dark } }, "150+"),
                    react_1.default.createElement("div", { style: { fontSize: '12pt', color: theme.text, marginTop: '4pt', fontWeight: '500' } }, "options for you")),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("div", { style: { fontSize: '36pt', fontWeight: '600', color: theme.dark } }, "50k+"),
                    react_1.default.createElement("div", { style: { fontSize: '12pt', color: theme.text, marginTop: '4pt', fontWeight: '500' } }, "happy clients")),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("div", { style: { fontSize: '36pt', fontWeight: '600', color: theme.dark } }, "21+"),
                    react_1.default.createElement("div", { style: { fontSize: '12pt', color: theme.text, marginTop: '4pt', fontWeight: '500' } }, "in industry"))),
            react_1.default.createElement("div", { style: {
                    borderTop: `1px solid #D1D5DB`,
                    paddingTop: '16pt',
                    marginTop: 'auto',
                    paddingBottom: '8pt'
                } },
                react_1.default.createElement("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' } },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("p", { style: { fontSize: '12pt', color: theme.text, fontWeight: '600', marginBottom: '4pt', letterSpacing: '0.5px', textTransform: 'uppercase' } }, "Prepared Exclusively For"),
                        react_1.default.createElement("p", { style: { fontSize: '18pt', fontWeight: '600', color: theme.dark } }, meta.userName)),
                    react_1.default.createElement("div", { style: { textAlign: 'right' } },
                        react_1.default.createElement("p", { style: { fontSize: '12pt', color: theme.text, marginBottom: '2pt', fontWeight: '500' } },
                            "Date: ",
                            meta.generatedDate))),
                react_1.default.createElement("p", { style: { fontSize: '12pt', fontWeight: '600', color: theme.dark, marginTop: '10pt' } }, "Your 1:1 call will be followed up")))));
}
