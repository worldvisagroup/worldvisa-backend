"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CountryIntroPage = CountryIntroPage;
const react_1 = __importDefault(require("react"));
function CountryIntroPage({ countryName, flagImagePath, usps, colors }) {
    return (react_1.default.createElement("div", { style: {
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#222222',
            padding: '0mm 0mm',
            textAlign: 'center'
        } },
        react_1.default.createElement("div", { style: {
                width: '200pt',
                height: '120pt',
                marginBottom: '32pt',
                borderRadius: '12pt',
                overflow: 'hidden',
            } },
            react_1.default.createElement("img", { src: flagImagePath, alt: `${countryName} flag`, style: {
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                } })),
        react_1.default.createElement("h1", { style: {
                fontSize: '42pt',
                fontWeight: '700',
                marginBottom: '16pt',
                letterSpacing: '0.5pt',
                margin: '0 0 16pt 0'
            } },
            countryName,
            " Visa Opportunities Report"),
        react_1.default.createElement("div", { style: {
                background: '#FFFFFF',
                backdropFilter: 'blur(10pt)',
                borderRadius: '16pt',
                padding: '24pt 32pt',
                maxWidth: '500pt',
                border: '1pt solid #222222'
            } },
            react_1.default.createElement("h3", { style: {
                    fontSize: '16pt',
                    fontWeight: '700',
                    marginBottom: '16pt',
                    marginTop: '0',
                    textTransform: 'uppercase',
                    letterSpacing: '1pt'
                } },
                "Why ",
                countryName,
                "?"),
            react_1.default.createElement("ul", { style: {
                    listStyle: 'none',
                    padding: '0',
                    margin: '0',
                    textAlign: 'left'
                } }, usps.map((usp, index) => (react_1.default.createElement("li", { key: index, style: {
                    fontSize: '12pt',
                    lineHeight: '1.7',
                    marginBottom: '8pt',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12pt'
                } },
                react_1.default.createElement("span", { style: {
                        fontSize: '18pt',
                        fontWeight: '700',
                        marginTop: '-2pt',
                        flexShrink: 0
                    } }, "\u2713"),
                react_1.default.createElement("span", null, usp)))))),
        react_1.default.createElement("div", { style: {
                marginTop: '32pt',
                fontSize: '11pt',
                opacity: '0.9',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '2pt'
            } }, "Comprehensive Migration Assessment")));
}
