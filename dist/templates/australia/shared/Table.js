"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Table = Table;
const react_1 = __importDefault(require("react"));
function Table({ columns, data }) {
    return (react_1.default.createElement("table", null,
        react_1.default.createElement("thead", null,
            react_1.default.createElement("tr", null, columns.map((col, index) => (react_1.default.createElement("th", { key: index, style: { textAlign: col.align || 'left' } }, col.header))))),
        react_1.default.createElement("tbody", null, data.map((row, rowIndex) => (react_1.default.createElement("tr", { key: rowIndex }, columns.map((col, colIndex) => (react_1.default.createElement("td", { key: colIndex, style: { textAlign: col.align || 'left' } }, row[col.key])))))))));
}
