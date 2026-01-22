"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section11_AboutWorldVisa = Section11_AboutWorldVisa;
const react_1 = __importDefault(require("react"));
const SectionHeader_1 = require("../shared/SectionHeader");
function Section11_AboutWorldVisa({ data }) {
    return (react_1.default.createElement("div", { className: "section about-worldvisa" },
        react_1.default.createElement(SectionHeader_1.SectionHeader, { number: "", title: "About Canada PR & Work Visa with WorldVisa" }),
        react_1.default.createElement("div", { className: "subsection" },
            react_1.default.createElement("h3", null, "Canada PR Visa Services"),
            react_1.default.createElement("div", { className: "card" },
                react_1.default.createElement("p", null, data.prVisa))),
        react_1.default.createElement("div", { className: "subsection" },
            react_1.default.createElement("h3", null, "Canada Work Visa Services"),
            react_1.default.createElement("div", { className: "card" },
                react_1.default.createElement("p", null, data.workVisa)))));
}
