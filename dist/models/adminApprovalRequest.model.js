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
exports.REQUEST_STATUSES = exports.REQUEST_TYPES = exports.RECORD_TYPES = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.RECORD_TYPES = ['visa_application', 'spouse_skill_assessment'];
exports.REQUEST_TYPES = ['field_change']; // extend as needed
exports.REQUEST_STATUSES = ['pending', 'approved', 'rejected'];
const adminApprovalRequestSchema = new mongoose_1.Schema({
    requestType: { type: String, required: true, enum: exports.REQUEST_TYPES },
    leadId: { type: String, required: true },
    recordType: { type: String, required: true, enum: exports.RECORD_TYPES },
    fieldName: { type: String, required: true }, // e.g. 'Deadline_For_Lodgment'
    currentValue: { type: String, default: null }, // snapshot at request time
    requestedValue: { type: String, required: true },
    reason: { type: String, required: true, maxlength: 1000 },
    requestedBy: { type: String, required: true }, // username of submitting admin
    requestedTo: { type: String, required: true }, // username of target master_admin
    status: { type: String, enum: exports.REQUEST_STATUSES, default: 'pending' },
    reviewedBy: { type: String, default: null },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null, maxlength: 1000 },
}, { timestamps: true });
adminApprovalRequestSchema.index({ leadId: 1 });
adminApprovalRequestSchema.index({ status: 1, createdAt: -1 });
adminApprovalRequestSchema.index({ leadId: 1, status: 1 });
adminApprovalRequestSchema.index({ requestedBy: 1 });
adminApprovalRequestSchema.index({ requestedTo: 1 });
adminApprovalRequestSchema.index({ requestedTo: 1, status: 1 });
adminApprovalRequestSchema.index({ requestType: 1, status: 1 });
const MODEL_NAME = 'AdminApprovalRequest';
const AdminApprovalRequest = mongoose_1.default.models[MODEL_NAME] ??
    mongoose_1.default.model(MODEL_NAME, adminApprovalRequestSchema);
exports.default = AdminApprovalRequest;
