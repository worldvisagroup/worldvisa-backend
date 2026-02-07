"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section6_SalaryVariation = Section6_SalaryVariation;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("./shared/SectionHeader");
function Section6_SalaryVariation({ data }) {
    const getSalaryBarWidth = (salaryRange) => {
        const match = salaryRange.match(/\$([0-9,]+)\s*–\s*\$([0-9,]+)/);
        if (match) {
            const maxSalary = parseInt(match[2].replace(/,/g, ''));
            return Math.min((maxSalary / 210000) * 100, 100);
        }
        return 50;
    };
    const introText = data.roleName
        ? `Salary variation for ${data.roleName} across Australian cities. This section provides comprehensive compensation data, including take-home estimates and living costs.`
        : 'Salary ranges can vary significantly across Australian cities, depending on the profession and local factors. This section provides comprehensive compensation data, including take-home estimates and living costs, to help you understand city-wise salary variation.';
    return (react_1.default.createElement("div", { className: "section salary-variation page" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "6", title: "City-wise Salary Variation (Capitals vs Tier-2)" }),
        react_1.default.createElement("p", { className: "salary-variation-intro" }, introText),
        data.cities.map((city, index) => (react_1.default.createElement("div", { key: index, className: "city-card" },
            react_1.default.createElement("div", { className: "city-card-header" },
                react_1.default.createElement("div", { className: "city-card-header-content" },
                    react_1.default.createElement("h4", { className: "city-name" }, city.cityName),
                    (city.techHub || city.nicheOpportunity) && (react_1.default.createElement("p", { className: "city-card-subtitle" }, city.techHub || city.nicheOpportunity)))),
            react_1.default.createElement("div", { className: "city-card-salary-block" },
                react_1.default.createElement("div", { className: "salary-range" },
                    react_1.default.createElement("span", { className: "salary-label" }, city.midLevelRoleName || 'Mid-level'),
                    react_1.default.createElement("div", { className: "salary-range-row" },
                        react_1.default.createElement("span", { className: "salary-value" }, city.midLevelRange),
                        city.premium && (react_1.default.createElement("span", { className: "salary-premium-badge" }, city.premium))),
                    react_1.default.createElement("div", { className: "salary-bar" },
                        react_1.default.createElement("div", { className: "salary-bar-fill", style: { width: `${getSalaryBarWidth(city.midLevelRange)}%` } }))),
                react_1.default.createElement("div", { className: "salary-range" },
                    react_1.default.createElement("span", { className: "salary-label" }, city.seniorLevelRoleName || 'Senior'),
                    react_1.default.createElement("span", { className: "salary-value" }, city.seniorLevelRange),
                    react_1.default.createElement("div", { className: "salary-bar" },
                        react_1.default.createElement("div", { className: "salary-bar-fill", style: { width: `${getSalaryBarWidth(city.seniorLevelRange)}%` } })))),
            react_1.default.createElement("div", { className: "city-details" },
                react_1.default.createElement("div", { className: "city-detail-item" },
                    react_1.default.createElement("div", { className: "city-detail-label" }, "Tax rate"),
                    react_1.default.createElement("div", { className: "city-detail-value" }, city.taxRate || 'N/A')),
                react_1.default.createElement("div", { className: "city-detail-item" },
                    react_1.default.createElement("div", { className: "city-detail-label" }, "Take-home"),
                    react_1.default.createElement("div", { className: "city-detail-value city-detail-value-accent" }, city.takeHomeSalary || 'N/A')),
                react_1.default.createElement("div", { className: "city-detail-item" },
                    react_1.default.createElement("div", { className: "city-detail-label" }, "Housing cost"),
                    react_1.default.createElement("div", { className: "city-detail-value" }, city.housingCost || 'N/A')),
                react_1.default.createElement("div", { className: "city-detail-item" },
                    react_1.default.createElement("div", { className: "city-detail-label" }, "Cost of living"),
                    react_1.default.createElement("div", { className: "city-detail-value" }, city.costOfLiving)),
                city.qualityOfLife && (react_1.default.createElement("div", { className: "city-detail-item" },
                    react_1.default.createElement("div", { className: "city-detail-label" }, "Quality of life"),
                    react_1.default.createElement("div", { className: "city-detail-value" }, city.qualityOfLife)))),
            (city.additionalNotes || city.yourAdvantage) && (react_1.default.createElement("div", { className: "city-notes" },
                react_1.default.createElement("p", { className: "city-notes-text" }, city.additionalNotes || city.yourAdvantage))))))));
}
