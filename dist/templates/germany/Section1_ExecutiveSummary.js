"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section1_ExecutiveSummary = Section1_ExecutiveSummary;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("../shared/SectionHeader");
const Table_1 = require("../shared/Table");
function Section1_ExecutiveSummary({ data }) {
    return (react_1.default.createElement("div", { className: "section executive-summary" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "1", title: "Executive Summary" }),
        react_1.default.createElement("div", { className: "subsection", style: { marginTop: '8pt' } },
            react_1.default.createElement("h3", null, "1.1 Purpose of This Report"),
            react_1.default.createElement("p", null, data.purpose)),
        react_1.default.createElement("div", { className: "subsection", style: { marginTop: '8pt' } },
            react_1.default.createElement("h3", null, "1.2 Snapshot of Your Global Mobility Options"),
            react_1.default.createElement("p", null,
                react_1.default.createElement("strong", null, "Your Key Advantages:")),
            react_1.default.createElement("ul", { style: { marginLeft: '20pt', marginBottom: '12pt' } }, data.globalMobility.keyAdvantages.map((advantage, index) => (react_1.default.createElement("li", { key: index, style: { marginBottom: '6pt' } }, advantage))))),
        react_1.default.createElement("div", { className: "subsection", style: { marginTop: '8pt' } },
            react_1.default.createElement("h3", null, "1.3 Top 3 Recommended German Cities"),
            react_1.default.createElement(Table_1.Table, { columns: [
                    { header: 'Rank', key: 'rank', align: 'center' },
                    { header: 'City', key: 'city' },
                    { header: 'Tech Hub', key: 'techHub' },
                    { header: 'Job Demand', key: 'jobDemand' },
                    { header: 'Salary Range', key: 'salaryRange' },
                    { header: 'Recommendation', key: 'recommendation' },
                ], data: data.topCities.map(city => ({
                    rank: city.rank,
                    city: city.city,
                    techHub: city.techHub,
                    jobDemand: city.jobDemand,
                    salaryRange: city.salaryRange,
                    recommendation: city.recommendation,
                })) }))));
}
