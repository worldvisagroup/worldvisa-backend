"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section6_TopEmployers = Section6_TopEmployers;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("../shared/SectionHeader");
const Table_1 = require("../shared/Table");
function Section6_TopEmployers({ data }) {
    return (react_1.default.createElement("div", { className: "section top-employers" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "6", title: "Top 20 Target Employers (by Province & Sector)" }),
        data.provinces.map((provinceData, index) => (react_1.default.createElement("div", { key: index, className: "subsection" },
            react_1.default.createElement("h3", null,
                provinceData.province,
                " / ",
                provinceData.city,
                " \u2013 TOP ",
                provinceData.employers.length,
                " TARGET EMPLOYERS"),
            react_1.default.createElement(Table_1.Table, { columns: [
                    { header: 'Rank', key: 'rank', align: 'center' },
                    { header: 'Company', key: 'company' },
                    { header: 'Industry', key: 'industry' },
                    { header: 'Salary (CAD)', key: 'salary' },
                    { header: 'Visa Sponsorship', key: 'visaSponsorship' },
                    { header: 'Why Hire You', key: 'whyHireYou' },
                ], data: provinceData.employers.map(employer => ({
                    rank: employer.rank,
                    company: employer.company,
                    industry: employer.industry,
                    salary: employer.salary,
                    visaSponsorship: employer.visaSponsorship,
                    whyHireYou: employer.whyHireYou,
                })) }))))));
}
