"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section5_TopEmployers = Section5_TopEmployers;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("./shared/SectionHeader");
function Section5_TopEmployers({ data }) {
    return (react_1.default.createElement("div", { className: "section top-employers page" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "5", title: "Top 20 Target Employers (by Sector, Australia)" }),
        react_1.default.createElement("p", { style: { fontSize: '11pt', color: '#6B7280', marginBottom: '24pt', lineHeight: '1.6' } }, "Based on your profile as a Full Stack Developer, these companies represent the best opportunities for your skills and experience. They are organized by tier based on fit with your background."),
        data.tiers.map((tier, tierIndex) => (react_1.default.createElement("div", { key: tierIndex, className: "company-tier" },
            react_1.default.createElement("div", { className: "company-tier-header" },
                react_1.default.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: '10pt' } },
                    react_1.default.createElement("span", { style: {
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32pt',
                            height: '32pt',
                            background: '#FFFFFF',
                            color: '#0066CC',
                            borderRadius: '50%',
                            fontSize: '16pt',
                            fontWeight: '700'
                        } }, tierIndex + 1),
                    react_1.default.createElement("div", { style: { flex: 1 } },
                        react_1.default.createElement("div", { className: "company-tier-title" }, tier.tierName),
                        react_1.default.createElement("div", { className: "company-tier-description" }, tier.tierDescription)))),
            react_1.default.createElement("ul", { className: "company-list" }, tier.companies.map((company, companyIndex) => (react_1.default.createElement("li", { key: companyIndex, className: "company-item" },
                react_1.default.createElement("div", null,
                    react_1.default.createElement("span", { style: {
                            display: 'inline-block',
                            width: '24pt',
                            height: '24pt',
                            background: '#0066CC',
                            color: '#FFFFFF',
                            borderRadius: '50%',
                            textAlign: 'center',
                            lineHeight: '24pt',
                            fontSize: '10pt',
                            fontWeight: '700',
                            marginRight: '8pt',
                            verticalAlign: 'middle'
                        } }, tierIndex * 8 + companyIndex + 1),
                    react_1.default.createElement("span", { className: "company-name" }, company.name)),
                react_1.default.createElement("span", { className: "company-location" },
                    "\uD83D\uDCCD ",
                    company.location),
                react_1.default.createElement("div", { className: "company-description" }, company.description)))))))),
        react_1.default.createElement("div", { style: { marginTop: '28pt' } },
            react_1.default.createElement("div", { style: {
                    background: 'linear-gradient(135deg, #EBF5FF 0%, #DBEAFE 100%)',
                    border: '2pt solid #BFDBFE',
                    borderRadius: '10pt',
                    padding: '20pt'
                } },
                react_1.default.createElement("h4", { style: {
                        fontSize: '14pt',
                        color: '#0066CC',
                        marginTop: '0',
                        marginBottom: '16pt',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8pt'
                    } },
                    react_1.default.createElement("span", { style: { fontSize: '18pt' } }, "\uD83D\uDCA1"),
                    "Why These Companies?"),
                react_1.default.createElement("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14pt' } },
                    react_1.default.createElement("div", { style: {
                            background: '#FFFFFF',
                            borderRadius: '6pt',
                            padding: '12pt',
                            border: '1pt solid #E5E7EB'
                        } },
                        react_1.default.createElement("p", { style: { fontSize: '10pt', fontWeight: '600', color: '#1F2937', marginBottom: '6pt' } }, "\u2713 Actively Hiring"),
                        react_1.default.createElement("p", { style: { fontSize: '9pt', color: '#4B5563', marginBottom: '0', lineHeight: '1.5' } }, data.whyTheseCompanies.activelyHiring)),
                    react_1.default.createElement("div", { style: {
                            background: '#FFFFFF',
                            borderRadius: '6pt',
                            padding: '12pt',
                            border: '1pt solid #E5E7EB'
                        } },
                        react_1.default.createElement("p", { style: { fontSize: '10pt', fontWeight: '600', color: '#1F2937', marginBottom: '6pt' } }, "\u2713 Sponsor Migrants"),
                        react_1.default.createElement("p", { style: { fontSize: '9pt', color: '#4B5563', marginBottom: '0', lineHeight: '1.5' } }, data.whyTheseCompanies.sponsorMigrants)),
                    react_1.default.createElement("div", { style: {
                            background: '#FFFFFF',
                            borderRadius: '6pt',
                            padding: '12pt',
                            border: '1pt solid #E5E7EB'
                        } },
                        react_1.default.createElement("p", { style: { fontSize: '10pt', fontWeight: '600', color: '#1F2937', marginBottom: '6pt' } }, "\u2713 Growth Trajectory"),
                        react_1.default.createElement("p", { style: { fontSize: '9pt', color: '#4B5563', marginBottom: '0', lineHeight: '1.5' } }, data.whyTheseCompanies.growthTrajectory)),
                    react_1.default.createElement("div", { style: {
                            background: '#FFFFFF',
                            borderRadius: '6pt',
                            padding: '12pt',
                            border: '1pt solid #E5E7EB'
                        } },
                        react_1.default.createElement("p", { style: { fontSize: '10pt', fontWeight: '600', color: '#1F2937', marginBottom: '6pt' } }, "\u2713 Your Fit"),
                        react_1.default.createElement("p", { style: { fontSize: '9pt', color: '#4B5563', marginBottom: '0', lineHeight: '1.5' } }, data.whyTheseCompanies.yourFit))),
                react_1.default.createElement("div", { style: {
                        marginTop: '14pt',
                        background: '#FFFBEB',
                        borderRadius: '6pt',
                        padding: '12pt',
                        border: '1pt solid #FCD34D'
                    } },
                    react_1.default.createElement("p", { style: { fontSize: '10pt', marginBottom: '0', lineHeight: '1.6' } },
                        react_1.default.createElement("strong", { style: { color: '#92400E' } }, "\uD83C\uDF93 Learning Opportunity:"),
                        ' ',
                        react_1.default.createElement("span", { style: { color: '#78350F' } }, data.whyTheseCompanies.learningOpportunity)))))));
}
