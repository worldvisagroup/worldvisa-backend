"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableOfContents = TableOfContents;
const react_1 = __importDefault(require("react"));
const Table_1 = require("./shared/Table");
function TableOfContents() {
    const tocData = [
        { section: '1', title: 'Executive Summary', page: '3' },
        { section: '2', title: 'Professional Profile Assessment', page: '5' },
        { section: '3', title: 'Visa Pathways Without Job Offer', page: '7' },
        { section: '4', title: 'Global Skill Demand Mapping', page: '11' },
        { section: '5', title: 'Top 20 Target Employers', page: '13' },
        { section: '6', title: 'City-wise Salary Variation', page: '15' },
        { section: '7', title: 'End-to-End Timeline', page: '17' },
        { section: '8', title: 'Why Use a Regulated Advisor', page: '19' },
    ];
    const columns = [
        { header: 'Section', key: 'section', align: 'center' },
        { header: 'Content', key: 'title', align: 'left' },
        { header: 'Page', key: 'page', align: 'center' },
    ];
    return (react_1.default.createElement("div", { style: { padding: '2mm 2mm' } },
        react_1.default.createElement("div", { style: { marginBottom: '40pt' } },
            react_1.default.createElement("h2", { style: {
                    fontSize: '32pt',
                    fontWeight: '700',
                    color: '#0066CC',
                    marginBottom: '8pt',
                    marginTop: '0'
                } }, "Table of Contents"),
            react_1.default.createElement("p", { style: {
                    fontSize: '12pt',
                    color: '#6B7280',
                    marginBottom: '0'
                } }, "Your comprehensive migration assessment guide")),
        react_1.default.createElement("div", { style: { fontSize: '13pt' } },
            react_1.default.createElement(Table_1.Table, { columns: columns, data: tocData })),
        react_1.default.createElement("div", { style: {
                marginTop: '40pt',
                padding: '18pt',
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
                " This report is tailored specifically to your profile and the Australian immigration system. Bookmark key sections for easy reference during your application journey."))));
}
