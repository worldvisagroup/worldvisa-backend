"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section3_VisaCategories = Section3_VisaCategories;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("../shared/SectionHeader");
function Section3_VisaCategories({ data }) {
    return (react_1.default.createElement("div", { className: "section visa-categories" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "3", title: "German Visa Categories & Pathways" }),
        react_1.default.createElement("div", { className: "subsection", style: { marginTop: '8pt' } },
            react_1.default.createElement("h3", null, "3.1 Concept Overview"),
            react_1.default.createElement("p", null, data.conceptOverview)),
        react_1.default.createElement("div", { className: "subsection", style: { marginTop: '8pt' } },
            react_1.default.createElement("h3", null,
                "3.2 PRIMARY PATHWAY: ",
                data.opportunityCard.title),
            react_1.default.createElement("div", { style: {
                    background: 'linear-gradient(135deg, #EBF5FF 0%, #DBEAFE 100%)',
                    border: '2pt solid #0066CC',
                    borderRadius: '8pt',
                    padding: '16pt',
                    marginBottom: '16pt'
                } },
                react_1.default.createElement("p", null,
                    react_1.default.createElement("strong", null, "What It Is:")),
                react_1.default.createElement("p", null, data.opportunityCard.description),
                react_1.default.createElement("p", { style: { marginTop: '12pt' } },
                    react_1.default.createElement("strong", null, "Advantages:")),
                react_1.default.createElement("ul", { style: { marginLeft: '20pt', marginBottom: '12pt' } }, data.opportunityCard.advantages.map((advantage, index) => (react_1.default.createElement("li", { key: index, style: { marginBottom: '6pt' } }, advantage)))),
                react_1.default.createElement("p", { style: { marginTop: '12pt' } },
                    react_1.default.createElement("strong", null, "Success Probability:"),
                    " ",
                    data.opportunityCard.successProbability))),
        react_1.default.createElement("div", { className: "subsection", style: { marginTop: '8pt' } },
            react_1.default.createElement("h3", null,
                "3.3 SECONDARY PATHWAY: ",
                data.euBlueCard.title),
            react_1.default.createElement("div", { style: {
                    background: '#F9FAFB',
                    border: '2pt solid #10B981',
                    borderRadius: '8pt',
                    padding: '16pt',
                    marginBottom: '0'
                } },
                react_1.default.createElement("p", null,
                    react_1.default.createElement("strong", null, "What It Is:")),
                react_1.default.createElement("p", null, data.euBlueCard.description),
                react_1.default.createElement("p", { style: { marginTop: '12pt' } },
                    react_1.default.createElement("strong", null, "Advantages:")),
                react_1.default.createElement("ul", { style: { marginLeft: '20pt', marginBottom: '12pt' } }, data.euBlueCard.advantages.map((advantage, index) => (react_1.default.createElement("li", { key: index, style: { marginBottom: '6pt' } }, advantage)))),
                react_1.default.createElement("p", { style: { marginTop: '12pt' } },
                    react_1.default.createElement("strong", null, "Success Probability:"),
                    " ",
                    data.euBlueCard.successProbability)))));
}
