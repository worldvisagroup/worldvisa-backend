"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section6_Compensation = Section6_Compensation;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("../shared/SectionHeader");
const Table_1 = require("../shared/Table");
function Section6_Compensation({ data }) {
    return (react_1.default.createElement("div", { className: "section compensation" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "6", title: "Compensation Benchmarking" }),
        react_1.default.createElement("div", { className: "subsection", style: { marginTop: '8pt' } },
            react_1.default.createElement("h3", null, "6.1 Salary Ranges by City & Role Level"),
            react_1.default.createElement(Table_1.Table, { columns: [
                    { header: 'Level', key: 'level' },
                    { header: 'Location', key: 'location' },
                    { header: 'EUR (Annual)', key: 'eurAnnual' },
                    { header: 'INR Equivalent', key: 'inrEquivalent' },
                ], data: data.salaryRanges.map(salary => ({
                    level: salary.level,
                    location: salary.location,
                    eurAnnual: salary.eurAnnual,
                    inrEquivalent: salary.inrEquivalent,
                })) })),
        react_1.default.createElement("div", { className: "subsection", style: { marginTop: '8pt' } },
            react_1.default.createElement("h3", null, "6.2 City-wise Salary Comparison"),
            react_1.default.createElement(Table_1.Table, { columns: [
                    { header: 'Factor', key: 'factor' },
                    { header: 'Berlin', key: 'berlin' },
                    { header: 'Munich', key: 'munich' },
                    { header: 'Frankfurt', key: 'frankfurt' },
                    { header: 'Winner', key: 'winner' },
                ], data: data.cityComparison.map(comparison => ({
                    factor: comparison.factor,
                    berlin: comparison.berlin,
                    munich: comparison.munich,
                    frankfurt: comparison.frankfurt,
                    winner: comparison.winner,
                })) }))));
}
