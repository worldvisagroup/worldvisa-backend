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
        react_1.default.createElement("div", { className: "subsection" },
            react_1.default.createElement("h3", null, "1.1 Purpose of This Report"),
            react_1.default.createElement("p", null, data.purpose)),
        react_1.default.createElement("div", { className: "subsection" },
            react_1.default.createElement("h3", null, "1.2 Why Canada"),
            react_1.default.createElement("p", null, data.whyCanada)),
        react_1.default.createElement("div", { className: "subsection", style: { marginTop: '8pt' } },
            react_1.default.createElement("h3", { style: { marginBottom: '10pt' } }, "1.3 Top 3 Recommended Canadian Provinces (Without Job Offer / Sponsor)"),
            react_1.default.createElement(Table_1.Table, { columns: [
                    { header: 'Rank', key: 'rank', align: 'center' },
                    { header: 'Province', key: 'province' },
                    { header: 'Pathway', key: 'pathway' },
                    { header: 'CRS Advantage', key: 'crsAdvantage' },
                    { header: 'Job Demand', key: 'jobDemand' },
                    { header: 'Cost of Living', key: 'costOfLiving' },
                    { header: 'Recommendation', key: 'recommendation' },
                ], data: data.topProvinces.map(province => ({
                    rank: province.rank,
                    province: province.province,
                    pathway: province.pathway,
                    crsAdvantage: province.crsAdvantage,
                    jobDemand: province.jobDemand,
                    costOfLiving: province.costOfLiving,
                    recommendation: province.recommendation,
                })) })),
        react_1.default.createElement("div", { className: "subsection" },
            react_1.default.createElement("h3", null, "1.4 High-Level Risk & Reward Overview"),
            react_1.default.createElement(Table_1.Table, { columns: [
                    { header: 'Factor', key: 'factor' },
                    { header: 'Risk Level', key: 'riskLevel' },
                    { header: 'Reward Level', key: 'rewardLevel' },
                    { header: 'Mitigation', key: 'mitigation' },
                ], data: data.riskReward.map(row => ({
                    factor: row.factor,
                    riskLevel: row.riskLevel,
                    rewardLevel: row.rewardLevel,
                    mitigation: row.mitigation,
                })) }))));
}
