"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const checklistDocument_1 = require("../constants/checklistDocument");
const checklistDocumentSchema = new mongoose_1.Schema({
    category: { type: String, required: true, trim: true },
    documentType: { type: String, required: true, trim: true },
    // max number of uploads client can upload for this template
    allowedDocument: { type: Number, required: true, min: 0 },
    sampleDocumentUrl: { type: String, default: null, trim: true },
    importantNote: { type: String, default: null, trim: true },
    format: { type: [String], default: [] },
    visaServiceType: { type: String, required: true, enum: checklistDocument_1.VISA_SERVICE_TYPE_VALUES },
    state: { type: String, required: true, enum: checklistDocument_1.CHECKLIST_DOCUMENT_STATES, default: 'active' },
    addedBy: { type: String, default: null, trim: true },
    updatedBy: { type: String, default: null, trim: true },
}, { timestamps: true });
// Fast filtering for admin list views
checklistDocumentSchema.index({ state: 1, visaServiceType: 1, category: 1 });
checklistDocumentSchema.index({ documentType: 1 });
checklistDocumentSchema.index({ createdAt: -1 });
// Prevent duplicate templates for a given service/category/type
checklistDocumentSchema.index({ visaServiceType: 1, category: 1, documentType: 1 }, { unique: true });
const MODEL_NAME = 'ChecklistDocument';
const ChecklistDocument = mongoose_1.default.models[MODEL_NAME] ??
    mongoose_1.default.model(MODEL_NAME, checklistDocumentSchema);
exports.default = ChecklistDocument;
