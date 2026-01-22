"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableOfContents = TableOfContents;
const react_1 = __importDefault(require("react"));
const Table_1 = require("./Table");
function TableOfContents({ sections, countries }) {
    // Default Australia sections if not provided (for backwards compatibility)
    const defaultSections = [
        { section: '1', title: 'Executive Summary', page: '3' },
        { section: '2', title: 'Professional Profile Assessment', page: '5' },
        { section: '3', title: 'Visa Pathways Without Job Offer', page: '7' },
        { section: '4', title: 'Global Skill Demand Mapping', page: '11' },
        { section: '5', title: 'Top 20 Target Employers', page: '13' },
        { section: '6', title: 'City-wise Salary Variation', page: '15' },
        { section: '7', title: 'End-to-End Timeline', page: '17' },
        { section: '8', title: 'Why Use a Regulated Advisor', page: '19' },
    ];
    const tocData = sections || defaultSections;
    const columns = [
        { header: 'Section', key: 'section', align: 'center' },
        { header: 'Content', key: 'title', align: 'left' },
        { header: 'Page', key: 'page', align: 'center' },
    ];
    // If multi-country, group by country
    if (countries && countries.length > 1) {
        return (react_1.default.createElement("div", null,
            react_1.default.createElement("div", { style: { marginBottom: '22pt' } },
                react_1.default.createElement("h2", { style: {
                        fontSize: '32pt',
                        fontWeight: '700',
                        color: '#0066CC',
                        marginBottom: '8pt',
                        marginTop: '0'
                    } }, "Table of Contents")),
            countries.map((country) => (react_1.default.createElement("div", { key: country },
                react_1.default.createElement("h3", { style: {
                        color: '#D52636',
                        fontSize: '18pt',
                        fontWeight: '700',
                        marginBottom: '4pt',
                        marginTop: '0'
                    } }, country),
                react_1.default.createElement(Table_1.Table, { columns: columns, data: tocData.filter(s => s.country === country).map(s => ({
                        section: s.section,
                        title: s.title,
                        page: s.page,
                    })) }))))));
    }
    // Single country - normal rendering
    return (react_1.default.createElement("div", { style: { padding: '8mm 10mm' } },
        react_1.default.createElement("div", { style: { marginBottom: '32pt' } },
            react_1.default.createElement("h2", { style: {
                    fontSize: '32pt',
                    fontWeight: '700',
                    color: '#0066CC',
                    marginBottom: '8pt',
                    marginTop: '0'
                } }, "Table of Contents")),
        react_1.default.createElement("div", { style: { fontSize: '13pt' } },
            react_1.default.createElement(Table_1.Table, { columns: columns, data: tocData.map(s => ({
                    section: s.section,
                    title: s.title,
                    page: s.page,
                })) })),
        react_1.default.createElement("div", { style: {
                marginTop: '32pt',
                padding: '16pt',
                background: '#EBF5FF',
                borderRadius: '8pt',
                border: '1pt solid #BFDBFE'
            } },
            react_1.default.createElement("p", { style: {
                    fontSize: '11pt',
                    color: '#4B5563',
                    marginBottom: '0',
                    lineHeight: '1.6'
                } },
                "\uD83D\uDCA1 ",
                react_1.default.createElement("strong", null, "Tip:"),
                " This report is tailored specifically to your profile and the ",
                countries?.[0] || 'immigration',
                " system. Bookmark key sections for easy reference during your application journey."))));
}
