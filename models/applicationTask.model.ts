import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import { RECORD_TYPES } from './adminApprovalRequest.model';
import {
  FOLLOWUP_SOURCES,
  FOLLOWUP_TRIGGER_TYPES,
  NOTIFICATION_REF_MODELS,
  TASK_LINK_TYPES,
  TASK_STATUSES,
} from '../constants/applicationTask';

const taskLinkSchema = new Schema(
  {
    url:   { type: String, required: true, trim: true },
    label: { type: String, default: '', trim: true, maxlength: 200 },
    type:  { type: String, enum: TASK_LINK_TYPES, default: 'general' },
  },
  { _id: false }
);

const notificationRefSchema = new Schema(
  {
    model: { type: String, enum: NOTIFICATION_REF_MODELS, required: true },
    id:    { type: Schema.Types.ObjectId, required: true },
  },
  { _id: false }
);

const followUpDeliverySchema = new Schema(
  {
    source:              { type: String, required: true, enum: FOLLOWUP_SOURCES },
    sentAt:              { type: Date, required: true, default: Date.now },
    triggeredBy:         { type: String, enum: FOLLOWUP_TRIGGER_TYPES, default: 'system' },
    triggeredByUsername: { type: String, default: null },
    notificationRef:     { type: notificationRefSchema, default: null },
  },
  { _id: true, timestamps: false }
);

const applicationTaskSchema = new Schema(
  {
    leadId:          { type: String, required: true },
    recordType:      { type: String, required: true, enum: RECORD_TYPES },
    leadOwner:       { type: String, required: true },
    title:           { type: String, required: true, trim: true, maxlength: 200 },
    description:     { type: String, default: null, maxlength: 5000 },
    status:          { type: String, enum: TASK_STATUSES, default: 'todo' },
    date:            { type: Date, default: null },
    scheduledFrom:   { type: Date, default: null },
    scheduledTo:     { type: Date, default: null },
    createdBy:       { type: String, required: true },
    completedAt:     { type: Date, default: null },
    completedBy:     { type: String, default: null },
    cancelledAt:     { type: Date, default: null },
    cancelledBy:     { type: String, default: null },
    deletedAt:       { type: Date, default: null },
    deletedBy:       { type: String, default: null },
    links:           { type: [taskLinkSchema], default: [] },
    followUpDeliveries: { type: [followUpDeliverySchema], default: [] },
  },
  { timestamps: true }
);

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

export type ApplicationTaskType = Omit<
  InferSchemaType<typeof applicationTaskSchema>,
  | 'date'
  | 'scheduledFrom'
  | 'scheduledTo'
  | 'completedAt'
  | 'completedBy'
  | 'cancelledAt'
  | 'cancelledBy'
  | 'deletedAt'
  | 'deletedBy'
> & {
  date: Date | null;
  scheduledFrom: Date | null;
  scheduledTo: Date | null;
  completedAt: Date | null;
  completedBy: string | null;
  cancelledAt: Date | null;
  cancelledBy: string | null;
  deletedAt: Date | null;
  deletedBy: string | null;
  _id: mongoose.Types.ObjectId;
};

const MODEL_NAME = 'ApplicationTask';

const ApplicationTask =
  (mongoose.models[MODEL_NAME] as mongoose.Model<ApplicationTaskType> | undefined) ??
  mongoose.model<ApplicationTaskType>(MODEL_NAME, applicationTaskSchema);

export default ApplicationTask;
