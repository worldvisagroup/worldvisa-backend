"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SectionHeader = SectionHeader;
const react_1 = __importDefault(require("react"));
function SectionHeader({ number, title }) {
    return (react_1.default.createElement("div", { className: "section-header" },
        react_1.default.createElement("span", { className: "section-number" }, number),
        react_1.default.createElement("span", { className: "section-title" }, title)));
}
