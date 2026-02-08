"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section4_SkillDemand = Section4_SkillDemand;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("./shared/SectionHeader");
function Section4_SkillDemand({ data }) {
    const getDemandColor = (level) => {
        const lower = level.toLowerCase();
        if (lower.includes('very high'))
            return '#059669';
        if (lower.includes('high'))
            return '#2563EB';
        return '#9CA3AF';
    };
    const getDemandBg = (level) => {
        const lower = level.toLowerCase();
        if (lower.includes('very high'))
            return '#ECFDF5';
        if (lower.includes('high'))
            return '#EFF6FF';
        return '#F8F9FB';
    };
    return (react_1.default.createElement("div", { className: "section page" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "4", title: "Global Skill Demand Mapping - Where Your Skills Are in Demand" }),
        react_1.default.createElement("div", { style: { marginBottom: '20pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 } }, "4.1 Core Skills to Occupation Codes"),
            react_1.default.createElement("p", { style: { fontSize: '12pt', color: '#4B5563', margin: '0 0 6pt 0' } },
                react_1.default.createElement("strong", { style: { color: '#2563EB' } }, "Primary Occupation Code:"),
                " ",
                data.primaryOccupationCode),
            react_1.default.createElement("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '12pt' } },
                react_1.default.createElement("thead", null,
                    react_1.default.createElement("tr", null,
                        react_1.default.createElement("th", { style: { background: '#F8F9FB', padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#111827', border: '1pt solid #E5E7EB', width: '30%' } }, "Your Skill"),
                        react_1.default.createElement("th", { style: { background: '#F8F9FB', padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#111827', border: '1pt solid #E5E7EB', width: '40%' } }, "ANZSCO Category"),
                        react_1.default.createElement("th", { style: { background: '#F8F9FB', padding: '6pt 8pt', textAlign: 'left', fontWeight: 600, color: '#111827', border: '1pt solid #E5E7EB', width: '30%' } }, "Demand Level"))),
                react_1.default.createElement("tbody", null, data.skillMappingTable.map((row, index) => (react_1.default.createElement("tr", { key: index },
                    react_1.default.createElement("td", { style: { padding: '5pt 8pt', border: '1pt solid #E5E7EB', color: '#111827', fontWeight: 600, verticalAlign: 'top', background: index % 2 === 0 ? '#FFFFFF' : '#F8F9FB' } }, row.skill),
                    react_1.default.createElement("td", { style: { padding: '5pt 8pt', border: '1pt solid #E5E7EB', color: '#4B5563', verticalAlign: 'top', background: index % 2 === 0 ? '#FFFFFF' : '#F8F9FB' } }, row.anzscoCategory),
                    react_1.default.createElement("td", { style: { padding: '5pt 8pt', border: '1pt solid #E5E7EB', verticalAlign: 'top', background: index % 2 === 0 ? '#FFFFFF' : '#F8F9FB' } },
                        react_1.default.createElement("span", { style: {
                                display: 'inline-block',
                                padding: '2pt 8pt',
                                fontSize: '10pt',
                                fontWeight: 600,
                                color: getDemandColor(row.demandLevel),
                                background: getDemandBg(row.demandLevel),
                                border: `1pt solid ${getDemandColor(row.demandLevel)}`,
                                borderRadius: '2pt'
                            } }, row.demandLevel)))))))),
        react_1.default.createElement("div", { style: { marginBottom: '20pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 } }, "4.2 Skilled Occupation Lists & Your Placement"),
            data.occupationLists.map((list, index) => (react_1.default.createElement("div", { key: index, style: {
                    borderLeft: '3pt solid #1B2A4A',
                    padding: '6pt 10pt',
                    marginBottom: '6pt',
                    background: '#F8F9FB'
                } },
                react_1.default.createElement("p", { style: { fontSize: '12pt', fontWeight: 600, color: '#111827', margin: '0 0 4pt 0' } }, list.listName),
                react_1.default.createElement("ul", { style: { fontSize: '12pt', color: '#4B5563', margin: 0, paddingLeft: '14pt' } }, list.occupations.map((occ, occIndex) => (react_1.default.createElement("li", { key: occIndex, style: { marginBottom: '2pt', lineHeight: '1.4' } },
                    react_1.default.createElement("strong", null, occ))))))))),
        react_1.default.createElement("div", { style: { marginBottom: '20pt' } },
            react_1.default.createElement("h3", { style: { fontSize: '14pt', fontWeight: 700, color: '#111827', marginBottom: '4pt', marginTop: 0 } }, "4.3 State-Specific Priority Occupation Lists"),
            react_1.default.createElement("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '12pt' } },
                react_1.default.createElement("thead", null,
                    react_1.default.createElement("tr", null,
                        react_1.default.createElement("th", { style: { background: '#F8F9FB', padding: '5pt 8pt', textAlign: 'left', fontWeight: 600, color: '#111827', border: '1pt solid #E5E7EB', width: '30%' } }, "State"),
                        react_1.default.createElement("th", { style: { background: '#F8F9FB', padding: '5pt 8pt', textAlign: 'left', fontWeight: 600, color: '#111827', border: '1pt solid #E5E7EB' } }, "Status"))),
                react_1.default.createElement("tbody", null, data.statePriorityLists.map((state, stateIndex) => (react_1.default.createElement("tr", { key: stateIndex },
                    react_1.default.createElement("td", { style: { padding: '5pt 8pt', border: '1pt solid #E5E7EB', color: '#111827', fontWeight: 600, background: stateIndex % 2 === 0 ? '#FFFFFF' : '#F8F9FB' } }, state.state),
                    react_1.default.createElement("td", { style: { padding: '5pt 8pt', border: '1pt solid #E5E7EB', color: '#4B5563', background: stateIndex % 2 === 0 ? '#FFFFFF' : '#F8F9FB' } }, state.status))))))),
        react_1.default.createElement("div", { style: { borderLeft: '3pt solid #1B2A4A', padding: '6pt 10pt', background: '#F8F9FB' } },
            react_1.default.createElement("p", { style: { margin: 0, fontSize: '12pt', color: '#4B5563', lineHeight: '1.5' } },
                react_1.default.createElement("strong", { style: { color: '#111827' } }, "Availability:"),
                " ",
                data.availabilityNote))));
}
