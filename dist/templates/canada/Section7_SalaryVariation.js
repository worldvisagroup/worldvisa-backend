"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section7_SalaryVariation = Section7_SalaryVariation;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("../shared/SectionHeader");
const Table_1 = require("../shared/Table");
function Section7_SalaryVariation({ data }) {
    return (react_1.default.createElement("div", { className: "section salary-variation" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "7", title: "City-wise Salary Variation (Toronto vs Vancouver vs Montreal)" }),
        react_1.default.createElement("div", { className: "subsection" },
            react_1.default.createElement("h3", null, "SALARY COMPARISON: TORONTO vs VANCOUVER vs MONTREAL"),
            data.cities.map((city, index) => (react_1.default.createElement("div", { key: index },
                react_1.default.createElement(Table_1.Table, { columns: [
                        { header: 'Factor', key: 'factor' },
                        { header: 'Toronto', key: 'toronto' },
                        { header: 'Vancouver', key: 'vancouver' },
                        { header: 'Montreal', key: 'montreal' },
                        { header: 'Winner for You', key: 'winner' },
                    ], data: city.factors.map(factor => ({
                        factor: factor.factor,
                        toronto: factor.toronto,
                        vancouver: factor.vancouver,
                        montreal: factor.montreal,
                        winner: factor.winner,
                    })) }))))),
        react_1.default.createElement("div", { className: "subsection" },
            react_1.default.createElement("h3", null, "RECOMMENDATION SUMMARY"),
            react_1.default.createElement(Table_1.Table, { columns: [
                    { header: 'Priority', key: 'priority' },
                    { header: 'Toronto (Ontario)', key: 'toronto' },
                    { header: 'Vancouver (BC)', key: 'vancouver' },
                    { header: 'Montreal (Quebec)', key: 'montreal' },
                ], data: data.recommendation.priorities.map(priority => ({
                    priority: priority.priority,
                    toronto: priority.toronto,
                    vancouver: priority.vancouver,
                    montreal: priority.montreal,
                })) }))));
}
