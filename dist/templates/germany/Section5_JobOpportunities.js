"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section5_JobOpportunities = Section5_JobOpportunities;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("../shared/SectionHeader");
function Section5_JobOpportunities({ data }) {
    const cityEntries = Object.entries(data.cities);
    const totalCities = cityEntries.length;
    return (react_1.default.createElement("div", { className: "section page" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "5", title: "Job Opportunities by Role & City" }),
        cityEntries.map(([cityKey, city], cityIndex) => {
            const sectionNumber = cityIndex + 1;
            return (react_1.default.createElement("div", { key: cityKey, style: { marginBottom: '20pt', pageBreakInside: 'avoid' } },
                react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 } },
                    "5.",
                    sectionNumber,
                    " ",
                    city.name),
                react_1.default.createElement("div", { style: { marginBottom: '6pt' } },
                    react_1.default.createElement("div", { style: { fontSize: '12pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '3pt' } }, "Typical Job Titles"),
                    react_1.default.createElement("ul", { style: { margin: 0, paddingLeft: '14pt' } }, city.jobTitles.map((title, index) => (react_1.default.createElement("li", { key: index, style: { fontSize: '12pt', color: '#4B5563', marginBottom: '2pt', lineHeight: '1.4' } }, title))))),
                city.specializedRoles && city.specializedRoles.length > 0 && (react_1.default.createElement("div", { style: { marginBottom: '6pt' } },
                    react_1.default.createElement("div", { style: { fontSize: '12pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '3pt' } }, "Specialized Roles"),
                    react_1.default.createElement("ul", { style: { margin: 0, paddingLeft: '14pt' } }, city.specializedRoles.map((role, index) => (react_1.default.createElement("li", { key: index, style: { fontSize: '12pt', color: '#4B5563', marginBottom: '2pt', lineHeight: '1.4' } }, role)))))),
                react_1.default.createElement("div", { style: { marginBottom: '6pt' } },
                    react_1.default.createElement("div", { style: { fontSize: '12pt', fontWeight: 600, color: '#1B2A4A', marginBottom: '3pt' } }, "Target Companies"),
                    react_1.default.createElement("ul", { style: { margin: 0, paddingLeft: '14pt' } }, city.targetCompanies.map((company, index) => (react_1.default.createElement("li", { key: index, style: { fontSize: '12pt', color: '#4B5563', marginBottom: '2pt', lineHeight: '1.4' } }, company))))),
                city.advantage && (react_1.default.createElement("div", { style: {
                        borderLeft: '3pt solid #1B2A4A',
                        padding: '6pt 10pt',
                        background: '#F8F9FB',
                        marginBottom: '4pt',
                    } },
                    react_1.default.createElement("p", { style: { fontSize: '12pt', color: '#4B5563', margin: 0, lineHeight: '1.4' } },
                        react_1.default.createElement("strong", { style: { color: '#111827' } }, "Advantage:"),
                        " ",
                        city.advantage)))));
        }),
        react_1.default.createElement("div", { style: { marginTop: '8pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 } },
                "5.",
                totalCities + 1,
                " Key Industries Hiring for Your Skill Set"),
            react_1.default.createElement("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '12pt' } },
                react_1.default.createElement("thead", null,
                    react_1.default.createElement("tr", { style: { background: '#F8F9FB' } },
                        react_1.default.createElement("th", { style: { padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' } }, "Industry"),
                        react_1.default.createElement("th", { style: { padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' } }, "Demand"),
                        react_1.default.createElement("th", { style: { padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' } }, "Growth"),
                        react_1.default.createElement("th", { style: { padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' } }, "Example Companies"),
                        react_1.default.createElement("th", { style: { padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1.5pt solid #D1D5DB', fontSize: '12pt' } }, "Your Fit"))),
                react_1.default.createElement("tbody", null, data.keyIndustries.map((industry, index) => (react_1.default.createElement("tr", { key: index, style: { background: index % 2 === 0 ? '#FFFFFF' : '#F8F9FB' } },
                    react_1.default.createElement("td", { style: { padding: '5pt 8pt', fontWeight: 600, color: '#111827', borderBottom: '0.5pt solid #E5E7EB', verticalAlign: 'top' } }, industry.industry),
                    react_1.default.createElement("td", { style: { padding: '5pt 8pt', color: '#4B5563', borderBottom: '0.5pt solid #E5E7EB', verticalAlign: 'top' } }, industry.demand),
                    react_1.default.createElement("td", { style: { padding: '5pt 8pt', color: '#4B5563', borderBottom: '0.5pt solid #E5E7EB', verticalAlign: 'top' } }, industry.growth),
                    react_1.default.createElement("td", { style: { padding: '5pt 8pt', color: '#4B5563', borderBottom: '0.5pt solid #E5E7EB', verticalAlign: 'top' } }, industry.exampleCompanies),
                    react_1.default.createElement("td", { style: { padding: '5pt 8pt', color: '#4B5563', borderBottom: '0.5pt solid #E5E7EB', verticalAlign: 'top' } }, industry.yourFit)))))))));
}
