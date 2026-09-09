"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderTextWithLinks = renderTextWithLinks;
const react_1 = __importDefault(require("react"));
const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
function renderTextWithLinks(text) {
    if (typeof text !== 'string' || !text) {
        return text;
    }
    MARKDOWN_LINK_PATTERN.lastIndex = 0;
    if (!MARKDOWN_LINK_PATTERN.test(text)) {
        return text;
    }
    MARKDOWN_LINK_PATTERN.lastIndex = 0;
    const nodes = [];
    let lastIndex = 0;
    let match;
    let key = 0;
    while ((match = MARKDOWN_LINK_PATTERN.exec(text)) !== null) {
        if (match.index > lastIndex) {
            nodes.push(text.slice(lastIndex, match.index));
        }
        const [, label, url] = match;
        nodes.push(react_1.default.createElement("a", { key: key++, href: url, target: "_blank", rel: "noopener" }, label));
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
        nodes.push(text.slice(lastIndex));
    }
    return nodes;
}
