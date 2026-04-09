import mongoose, { Schema, type InferSchemaType } from 'mongoose';

export const RECORD_TYPES = ['visa_application', 'spouse_skill_assessment'] as const;
export const REQUEST_TYPES = ['field_change'] as const; // extend as needed
export const REQUEST_STATUSES = ['pending', 'approved', 'rejected'] as const;

const adminApprovalRequestSchema = new Schema(
  {
    requestType:     { type: String, required: true, enum: REQUEST_TYPES },
    leadId:          { type: String, required: true },
    recordType:      { type: String, required: true, enum: RECORD_TYPES },
    fieldName:       { type: String, required: true },      // e.g. 'Deadline_For_Lodgment'
    currentValue:    { type: String, default: null },       // snapshot at request time
    requestedValue:  { type: String, required: true },
    reason:          { type: String, required: true, maxlength: 1000 },
    requestedBy:     { type: String, required: true },      // username of submitting admin
    requestedTo:     { type: String, required: true },      // username of target master_admin
    status:          { type: String, enum: REQUEST_STATUSES, default: 'pending' },
    reviewedBy:      { type: String, default: null },
    reviewedAt:      { type: Date, default: null },
    rejectionReason: { type: String, default: null, maxlength: 1000 },
  },
  { timestamps: true }
);

adminApprovalRequestSchema.index({ leadId: 1 });
adminApprovalRequestSchema.index({ status: 1, createdAt: -1 });
adminApprovalRequestSchema.index({ leadId: 1, status: 1 });
adminApprovalRequestSchema.index({ requestedBy: 1 });
adminApprovalRequestSchema.index({ requestedTo: 1 });
adminApprovalRequestSchema.index({ requestedTo: 1, status: 1 });
adminApprovalRequestSchema.index({ requestType: 1, status: 1 });

export type AdminApprovalRequestType = InferSchemaType<typeof adminApprovalRequestSchema>;

const MODEL_NAME = 'AdminApprovalRequest';

const AdminApprovalRequest =
  (mongoose.models[MODEL_NAME] as mongoose.Model<AdminApprovalRequestType> | undefined) ??
  mongoose.model<AdminApprovalRequestType>(MODEL_NAME, adminApprovalRequestSchema);

export default AdminApprovalRequest;
