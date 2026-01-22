"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section4_SkillDemand = Section4_SkillDemand;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("./shared/SectionHeader");
function Section4_SkillDemand({ data }) {
    const getDemandClass = (level) => {
        if (level.toLowerCase().includes('very high'))
            return 'demand-very-high';
        if (level.toLowerCase().includes('high'))
            return 'demand-high';
        return 'demand-medium';
    };
    return (react_1.default.createElement("div", { className: "section page" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "4", title: "Global Skill Demand Mapping \u2013 Where Your Skills Are in Demand" }),
        react_1.default.createElement("div", { className: "subsection" },
            react_1.default.createElement("h3", null, "4.1 Mapping Your Core Skills to Global Occupation Codes"),
            react_1.default.createElement("div", { style: {
                    background: '#EBF5FF',
                    border: '1pt solid #BFDBFE',
                    borderRadius: '6pt',
                    padding: '12pt',
                    marginBottom: '16pt'
                } },
                react_1.default.createElement("p", { style: { marginBottom: '0', fontSize: '11pt' } },
                    react_1.default.createElement("strong", { style: { color: '#0066CC' } }, "Your Primary Occupation Code:"),
                    ' ',
                    react_1.default.createElement("span", { style: { color: '#1F2937' } }, data.primaryOccupationCode))),
            react_1.default.createElement("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '10pt' } },
                react_1.default.createElement("thead", null,
                    react_1.default.createElement("tr", null,
                        react_1.default.createElement("th", { style: {
                                background: 'linear-gradient(135deg, #EBF5FF 0%, #DBEAFE 100%)',
                                padding: '12pt',
                                textAlign: 'left',
                                fontWeight: '600',
                                color: '#1F2937',
                                border: '1pt solid #E5E7EB',
                                width: '30%'
                            } }, "Your Skill"),
                        react_1.default.createElement("th", { style: {
                                background: 'linear-gradient(135deg, #EBF5FF 0%, #DBEAFE 100%)',
                                padding: '12pt',
                                textAlign: 'left',
                                fontWeight: '600',
                                color: '#1F2937',
                                border: '1pt solid #E5E7EB',
                                width: '40%'
                            } }, "ANZSCO Category"),
                        react_1.default.createElement("th", { style: {
                                background: 'linear-gradient(135deg, #EBF5FF 0%, #DBEAFE 100%)',
                                padding: '12pt',
                                textAlign: 'left',
                                fontWeight: '600',
                                color: '#1F2937',
                                border: '1pt solid #E5E7EB',
                                width: '30%'
                            } }, "Demand Level (Australia)"))),
                react_1.default.createElement("tbody", null, data.skillMappingTable.map((row, index) => (react_1.default.createElement("tr", { key: index },
                    react_1.default.createElement("td", { style: {
                            padding: '10pt 12pt',
                            border: '1pt solid #E5E7EB',
                            background: index % 2 === 0 ? '#F9FAFB' : '#FFFFFF',
                            verticalAlign: 'top'
                        } },
                        react_1.default.createElement("strong", { style: { color: '#1F2937' } }, row.skill)),
                    react_1.default.createElement("td", { style: {
                            padding: '10pt 12pt',
                            border: '1pt solid #E5E7EB',
                            background: index % 2 === 0 ? '#F9FAFB' : '#FFFFFF',
                            verticalAlign: 'top',
                            color: '#4B5563'
                        } }, row.anzscoCategory),
                    react_1.default.createElement("td", { style: {
                            padding: '10pt 12pt',
                            border: '1pt solid #E5E7EB',
                            background: index % 2 === 0 ? '#F9FAFB' : '#FFFFFF',
                            verticalAlign: 'top'
                        } },
                        react_1.default.createElement("span", { className: `demand-indicator ${getDemandClass(row.demandLevel)}` }, row.demandLevel)))))))),
        react_1.default.createElement("div", { className: "subsection" },
            react_1.default.createElement("h3", null, "4.2 Australia's Skilled Occupation Lists & Your Placement"),
            react_1.default.createElement("div", { style: {
                    background: '#D1FAE5',
                    border: '1pt solid #10B981',
                    borderRadius: '8pt',
                    padding: '14pt',
                    marginBottom: '20pt'
                } },
                react_1.default.createElement("p", { style: { marginBottom: '0', fontSize: '11pt', lineHeight: '1.6' } },
                    react_1.default.createElement("strong", { style: { color: '#065F46' } }, "\u2713 Good News:"),
                    ' ',
                    react_1.default.createElement("span", { style: { color: '#047857' } }, "Your occupation is on multiple Australian skilled migration lists, ensuring consistent visa processing opportunities."))),
            data.occupationLists.map((list, index) => (react_1.default.createElement("div", { key: index, style: {
                    background: '#F9FAFB',
                    border: '1pt solid #E5E7EB',
                    borderLeft: '4pt solid #0066CC',
                    borderRadius: '6pt',
                    padding: '14pt',
                    marginBottom: '14pt'
                } },
                react_1.default.createElement("p", { style: { fontSize: '12pt', fontWeight: '600', color: '#1F2937', marginBottom: '10pt' } }, list.listName),
                react_1.default.createElement("ul", { style: {
                        fontSize: '10pt',
                        color: '#4B5563',
                        marginLeft: '20pt',
                        marginBottom: '0'
                    } }, list.occupations.map((occ, occIndex) => (react_1.default.createElement("li", { key: occIndex, style: { marginBottom: '6pt' } },
                    react_1.default.createElement("strong", null, occ)))))))),
            react_1.default.createElement("h4", { style: { fontSize: '12pt', marginTop: '20pt', marginBottom: '12pt' } }, "State-Specific Priority Occupation Lists"),
            react_1.default.createElement("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '10pt' } }, data.statePriorityLists.map((state, stateIndex) => (react_1.default.createElement("div", { key: stateIndex, style: {
                    background: '#FFFFFF',
                    border: '1pt solid #E5E7EB',
                    borderRadius: '6pt',
                    padding: '12pt',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10pt'
                } },
                react_1.default.createElement("span", { style: {
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24pt',
                        height: '24pt',
                        background: '#10B981',
                        color: '#FFFFFF',
                        borderRadius: '50%',
                        fontSize: '12pt',
                        fontWeight: '700',
                        flexShrink: 0
                    } }, "\u2713"),
                react_1.default.createElement("div", { style: { flex: 1 } },
                    react_1.default.createElement("strong", { style: { fontSize: '11pt', color: '#1F2937' } },
                        state.state,
                        ":"),
                    ' ',
                    react_1.default.createElement("span", { style: { fontSize: '10pt', color: '#4B5563' } }, state.status)))))),
            react_1.default.createElement("div", { style: {
                    marginTop: '16pt',
                    background: '#FFFBEB',
                    border: '1pt solid #FCD34D',
                    borderRadius: '6pt',
                    padding: '12pt'
                } },
                react_1.default.createElement("p", { style: { marginBottom: '0', fontSize: '10pt', color: '#78350F' } },
                    react_1.default.createElement("strong", null, "Availability:"),
                    " ",
                    data.availabilityNote)))));
}
