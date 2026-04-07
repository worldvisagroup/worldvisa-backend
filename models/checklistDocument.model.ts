import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import { CHECKLIST_DOCUMENT_STATES, VISA_SERVICE_TYPE_VALUES } from '../constants/checklistDocument';

const checklistDocumentSchema = new Schema(
  {
    category: { type: String, required: true, trim: true },
    documentType: { type: String, required: true, trim: true },

    // max number of uploads client can upload for this template
    allowedDocument: { type: Number, required: true, min: 0 },

    sampleDocumentUrl: { type: String, default: null, trim: true },
    importantNote: { type: String, default: null, trim: true },
    format: { type: [String], default: [] },

    visaServiceType: { type: String, required: true, enum: VISA_SERVICE_TYPE_VALUES },
    state: { type: String, required: true, enum: CHECKLIST_DOCUMENT_STATES, default: 'active' },

    addedBy: { type: String, default: null, trim: true },
    updatedBy: { type: String, default: null, trim: true },
  },
  { timestamps: true }
);

// Fast filtering for admin list views
checklistDocumentSchema.index({ state: 1, visaServiceType: 1, category: 1 });
checklistDocumentSchema.index({ documentType: 1 });
checklistDocumentSchema.index({ createdAt: -1 });

// Prevent duplicate templates for a given service/category/type
checklistDocumentSchema.index(
  { visaServiceType: 1, category: 1, documentType: 1 },
  { unique: true }
);

export type ChecklistDocumentModelType = InferSchemaType<typeof checklistDocumentSchema>;

const MODEL_NAME = 'ChecklistDocument';

const ChecklistDocument =
  (mongoose.models[MODEL_NAME] as mongoose.Model<ChecklistDocumentModelType> | undefined) ??
  mongoose.model<ChecklistDocumentModelType>(MODEL_NAME, checklistDocumentSchema);

export default ChecklistDocument;

