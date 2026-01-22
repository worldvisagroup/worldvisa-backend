"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageFooter = PageFooter;
const react_1 = __importDefault(require("react"));
function PageFooter() {
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("style", { dangerouslySetInnerHTML: { __html: `
        @page {
          @bottom-center {
            content: "Page " counter(page) " of " counter(pages);
            font-size: 9pt;
            color: #6B7280;
          }
        }
        
        /* Hide page number on cover page */
        .cover-page {
          counter-reset: page 0;
        }
      ` } })));
}
