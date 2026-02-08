"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoverPage = CoverPage;
const react_1 = __importDefault(require("react"));
function CoverPage({ data, meta }) {
    return (react_1.default.createElement("div", { className: "cover-page" },
        react_1.default.createElement("img", { src: "https://res.cloudinary.com/djvvz62dw/image/upload/v1765014046/worldvisa/logo_uavsjh.svg", alt: "WorldVisa", className: "cover-logo" }),
        react_1.default.createElement("div", { style: { marginBottom: '70pt' } },
            react_1.default.createElement("h1", { className: "cover-title" }, data.title),
            react_1.default.createElement("p", { className: "cover-subtitle" }, data.subtitle)),
        react_1.default.createElement("div", { style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16pt',
                maxWidth: '400pt',
                margin: '0 auto'
            } },
            react_1.default.createElement("div", { style: {
                    background: '#F9FAFB',
                    border: '1pt solid #E5E7EB',
                    borderRadius: '8pt',
                    padding: '16pt',
                    textAlign: 'left'
                } },
                react_1.default.createElement("p", { style: {
                        fontSize: '12pt',
                        color: '#6B7280',
                        marginBottom: '6pt',
                        fontWeight: '600'
                    } }, "Prepared For"),
                react_1.default.createElement("p", { style: {
                        fontSize: '14pt',
                        fontWeight: '700',
                        color: '#1F2937',
                        marginBottom: '0'
                    } }, meta.userName || 'John Doe')),
            react_1.default.createElement("div", { style: {
                    background: '#F9FAFB',
                    border: '1pt solid #E5E7EB',
                    borderRadius: '8pt',
                    padding: '16pt',
                    textAlign: 'left'
                } },
                react_1.default.createElement("p", { style: {
                        fontSize: '12pt',
                        color: '#6B7280',
                        marginBottom: '6pt',
                        fontWeight: '600'
                    } }, "Report Date"),
                react_1.default.createElement("p", { style: {
                        fontSize: '14pt',
                        fontWeight: '700',
                        color: '#1F2937',
                        marginBottom: '0'
                    } }, meta.generatedDate || new Date().toLocaleDateString('en-AU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })))),
        react_1.default.createElement("div", { style: {
                marginTop: '40pt',
                display: 'inline-block',
                background: '#EBF5FF',
                color: '#0066CC',
                padding: '8pt 16pt',
                borderRadius: '20pt',
                fontSize: '12pt',
                fontWeight: '600'
            } },
            "Version ",
            meta.reportVersion || '1.0'),
        react_1.default.createElement("div", { style: {
                position: 'absolute',
                bottom: '40pt',
                left: '0',
                right: '0',
                textAlign: 'center',
                color: '#9CA3AF',
                fontSize: '12pt'
            } },
            react_1.default.createElement("div", { style: {
                    width: '100pt',
                    height: '2pt',
                    background: 'linear-gradient(90deg, transparent 0%, #0066CC 50%, transparent 100%)',
                    margin: '0 auto 12pt'
                } }),
            react_1.default.createElement("p", { style: { margin: '0' } }, "Confidential Migration Assessment Report"))));
}
