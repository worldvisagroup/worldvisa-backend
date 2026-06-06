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
const adminApprovalRequest_model_1 = require("./adminApprovalRequest.model");
const applicationTask_1 = require("../constants/applicationTask");
const taskLinkSchema = new mongoose_1.Schema({
    url: { type: String, required: true, trim: true },
    label: { type: String, default: '', trim: true, maxlength: 200 },
    type: { type: String, enum: applicationTask_1.TASK_LINK_TYPES, default: 'general' },
}, { _id: false });
const notificationRefSchema = new mongoose_1.Schema({
    model: { type: String, enum: applicationTask_1.NOTIFICATION_REF_MODELS, required: true },
    id: { type: mongoose_1.Schema.Types.ObjectId, required: true },
}, { _id: false });
const followUpDeliverySchema = new mongoose_1.Schema({
    source: { type: String, required: true, enum: applicationTask_1.FOLLOWUP_SOURCES },
    sentAt: { type: Date, required: true, default: Date.now },
    triggeredBy: { type: String, enum: applicationTask_1.FOLLOWUP_TRIGGER_TYPES, default: 'system' },
    triggeredByUsername: { type: String, default: null },
    notificationRef: { type: notificationRefSchema, default: null },
}, { _id: true, timestamps: false });
const applicationTaskSchema = new mongoose_1.Schema({
    leadId: { type: String, required: true },
    recordType: { type: String, required: true, enum: adminApprovalRequest_model_1.RECORD_TYPES },
    leadOwner: { type: String, required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: null, maxlength: 5000 },
    status: { type: String, enum: applicationTask_1.TASK_STATUSES, default: 'todo' },
    date: { type: Date, default: null },
    scheduledFrom: { type: Date, default: null },
    scheduledTo: { type: Date, default: null },
    createdBy: { type: String, required: true },
    completedAt: { type: Date, default: null },
    completedBy: { type: String, default: null },
    cancelledAt: { type: Date, default: null },
    cancelledBy: { type: String, default: null },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: String, default: null },
    links: { type: [taskLinkSchema], default: [] },
    followUpDeliveries: { type: [followUpDeliverySchema], default: [] },
}, { timestamps: true });
applicationTaskSchema.index({ leadId: 1, date: 1, status: 1 });
// Application detail page — staff & client
applicationTaskSchema.index({ leadId: 1, status: 1, scheduledTo: 1 });
applicationTaskSchema.index({ leadId: 1, status: 1, scheduledFrom: 1 });
// PE dashboard — my applications' tasks
applicationTaskSchema.index({ leadOwner: 1, status: 1, scheduledTo: 1 });
// Creator views
applicationTaskSchema.index({ createdBy: 1, status: 1, createdAt: -1 });
// Overdue & expiry sweeps
applicationTaskSchema.index({ status: 1, scheduledTo: 1 });
// Master admin list default sort
applicationTaskSchema.index({ createdAt: -1 });
// Text search fallback
applicationTaskSchema.index({ title: 'text', description: 'text' });
const MODEL_NAME = 'ApplicationTask';
const ApplicationTask = mongoose_1.default.models[MODEL_NAME] ??
    mongoose_1.default.model(MODEL_NAME, applicationTaskSchema);
exports.default = ApplicationTask;
