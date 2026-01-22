"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section4_NoSponsor = Section4_NoSponsor;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("../shared/SectionHeader");
const Table_1 = require("../shared/Table");
function Section4_NoSponsor({ data }) {
    return (react_1.default.createElement("div", { className: "section no-sponsor" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "4", title: "You Can Move to WITHOUT a Sponsor / Employer" }),
        react_1.default.createElement("div", { className: "subsection" },
            react_1.default.createElement("h3", null, "4.1 Understanding Sponsor-Free / Self-Sponsored Routes"),
            react_1.default.createElement("p", null, data.concept),
            react_1.default.createElement("h4", null, "Self-Sponsored Routes in Canada:"),
            react_1.default.createElement(Table_1.Table, { columns: [
                    { header: 'Route', key: 'route' },
                    { header: 'Sponsor Required?', key: 'sponsorRequired' },
                    { header: 'Job Offer Required?', key: 'jobOfferRequired' },
                    { header: 'Viability for You', key: 'viability' },
                ], data: data.selfSponsoredRoutes.map(route => ({
                    route: route.route,
                    sponsorRequired: route.sponsorRequired,
                    jobOfferRequired: route.jobOfferRequired,
                    viability: route.viability,
                })) })),
        react_1.default.createElement("div", { className: "subsection" },
            react_1.default.createElement("h3", null, "4.2 Canada Matrix \u2013 No Employer Sponsorship Required"),
            data.matrix.map((item, index) => (react_1.default.createElement("div", { key: index, className: "card", style: { marginBottom: '12pt' } },
                react_1.default.createElement("h4", { style: { color: '#0066CC', marginTop: 0 } }, item.option),
                react_1.default.createElement("p", null,
                    react_1.default.createElement("strong", null, "Type:"),
                    " ",
                    item.type),
                react_1.default.createElement("p", null, item.details))))),
        react_1.default.createElement("div", { className: "subsection" },
            react_1.default.createElement("h3", null, "4.3 Long-Term Settlement & Citizenship Pathways"),
            react_1.default.createElement("p", null,
                react_1.default.createElement("strong", null, "PR to Citizenship Timeline:")),
            react_1.default.createElement(Table_1.Table, { columns: [
                    { header: 'Stage', key: 'stage' },
                    { header: 'Duration', key: 'duration' },
                    { header: 'Status', key: 'status' },
                ], data: data.settlementPathway.stages.map(stage => ({
                    stage: stage.stage,
                    duration: stage.duration,
                    status: stage.status,
                })) }))));
}
