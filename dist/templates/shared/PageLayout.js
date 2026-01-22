"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageLayout = PageLayout;
const react_1 = __importDefault(require("react"));
function PageLayout({ children, showHeader = false, showFooter = false, headerTitle }) {
    return (react_1.default.createElement("div", { className: "page" },
        showHeader && (react_1.default.createElement("div", { className: "page-header" },
            react_1.default.createElement("div", { className: "page-header-title" }, headerTitle || 'Report'),
            react_1.default.createElement("img", { src: "/images/logo.svg", alt: "WorldVisa", className: "page-header-logo" }))),
        children,
        showFooter && (react_1.default.createElement("div", { className: "page-footer" }, "WorldVisa - Your Global Immigration Partner"))));
}
