"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section6_SalaryVariation = Section6_SalaryVariation;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("./shared/SectionHeader");
function Section6_SalaryVariation({ data }) {
    // Function to get a percentage width for salary bar visualization
    const getSalaryBarWidth = (salaryRange) => {
        // Extract the max value from the range (e.g., "AUD $140,000 – $165,000" -> 165000)
        const match = salaryRange.match(/\$([0-9,]+)\s*–\s*\$([0-9,]+)/);
        if (match) {
            const maxSalary = parseInt(match[2].replace(/,/g, ''));
            // Normalize to 210000 as max (100%)
            return Math.min((maxSalary / 210000) * 100, 100);
        }
        return 50;
    };
    return (react_1.default.createElement("div", { className: "section salary-variation page" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "6", title: "City-wise Salary Variation (Capitals vs Tier-2)" }),
        react_1.default.createElement("p", { style: { fontSize: '11pt', color: '#6B7280', marginBottom: '20pt', lineHeight: '1.6' } }, "Salary ranges for Full Stack Developers vary significantly across Australian cities. This section provides comprehensive compensation data including take-home estimates and living costs."),
        data.cities.map((city, index) => (react_1.default.createElement("div", { key: index, className: "city-card" },
            react_1.default.createElement("div", { className: "city-card-header" },
                react_1.default.createElement("div", { style: { flex: 1 } },
                    react_1.default.createElement("h4", { className: "city-name" }, city.cityName),
                    (city.techHub || city.nicheOpportunity) && (react_1.default.createElement("p", { style: { fontSize: '9pt', color: '#6B7280', marginTop: '4pt', marginBottom: '0' } }, city.techHub || city.nicheOpportunity))),
                react_1.default.createElement("span", { className: "city-icon" }, "\uD83C\uDFD9\uFE0F")),
            react_1.default.createElement("div", { style: { marginBottom: '16pt' } },
                react_1.default.createElement("div", { className: "salary-range" },
                    react_1.default.createElement("span", { className: "salary-label" }, "Mid-Level Developer"),
                    react_1.default.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: '10pt' } },
                        react_1.default.createElement("span", { className: "salary-value" }, city.midLevelRange),
                        city.premium && (react_1.default.createElement("span", { style: {
                                background: '#FEF3C7',
                                color: '#92400E',
                                padding: '2pt 8pt',
                                borderRadius: '10pt',
                                fontSize: '8pt',
                                fontWeight: '600'
                            } }, city.premium))),
                    react_1.default.createElement("div", { className: "salary-bar" },
                        react_1.default.createElement("div", { className: "salary-bar-fill", style: { width: `${getSalaryBarWidth(city.midLevelRange)}%` } }))),
                react_1.default.createElement("div", { className: "salary-range" },
                    react_1.default.createElement("span", { className: "salary-label" }, "Senior Developer"),
                    react_1.default.createElement("span", { className: "salary-value" }, city.seniorLevelRange),
                    react_1.default.createElement("div", { className: "salary-bar" },
                        react_1.default.createElement("div", { className: "salary-bar-fill", style: { width: `${getSalaryBarWidth(city.seniorLevelRange)}%` } })))),
            react_1.default.createElement("div", { className: "city-details" },
                react_1.default.createElement("div", { className: "city-detail-item" },
                    react_1.default.createElement("div", { className: "city-detail-label" }, "\uD83D\uDCB0 Tax Rate"),
                    react_1.default.createElement("div", { className: "city-detail-value" }, city.taxRate || 'N/A')),
                react_1.default.createElement("div", { className: "city-detail-item" },
                    react_1.default.createElement("div", { className: "city-detail-label" }, "\uD83D\uDCB5 Take-Home"),
                    react_1.default.createElement("div", { className: "city-detail-value", style: { color: '#10B981' } }, city.takeHomeSalary || 'N/A')),
                react_1.default.createElement("div", { className: "city-detail-item" },
                    react_1.default.createElement("div", { className: "city-detail-label" }, "\uD83C\uDFE0 Housing Cost"),
                    react_1.default.createElement("div", { className: "city-detail-value" }, city.housingCost || 'N/A')),
                react_1.default.createElement("div", { className: "city-detail-item" },
                    react_1.default.createElement("div", { className: "city-detail-label" }, "\uD83D\uDCCA Cost of Living"),
                    react_1.default.createElement("div", { className: "city-detail-value" }, city.costOfLiving)),
                city.qualityOfLife && (react_1.default.createElement(react_1.default.Fragment, null,
                    react_1.default.createElement("div", { className: "city-detail-item" },
                        react_1.default.createElement("div", { className: "city-detail-label" }, "\u2B50 Quality of Life"),
                        react_1.default.createElement("div", { className: "city-detail-value" }, city.qualityOfLife))))),
            (city.additionalNotes || city.yourAdvantage) && (react_1.default.createElement("div", { style: {
                    marginTop: '12pt',
                    background: '#EBF5FF',
                    borderRadius: '6pt',
                    padding: '10pt'
                } },
                react_1.default.createElement("p", { style: { fontSize: '9pt', color: '#1E40AF', marginBottom: '0', lineHeight: '1.5' } },
                    "\uD83D\uDCA1 ",
                    city.additionalNotes || city.yourAdvantage))))))));
}
