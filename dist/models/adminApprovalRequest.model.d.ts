import mongoose, { type InferSchemaType } from 'mongoose';
export declare const RECORD_TYPES: readonly ["visa_application", "spouse_skill_assessment"];
export declare const REQUEST_TYPES: readonly ["field_change"];
export declare const REQUEST_STATUSES: readonly ["pending", "approved", "rejected"];
declare const adminApprovalRequestSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    recordType: "visa_application" | "spouse_skill_assessment";
    status: "rejected" | "pending" | "approved";
    requestType: "field_change";
    leadId: string;
    fieldName: string;
    currentValue: string;
    requestedValue: string;
    reason: string;
    requestedBy: string;
    requestedTo: string;
    reviewedBy: string;
    reviewedAt: NativeDate;
    rejectionReason: string;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    recordType: "visa_application" | "spouse_skill_assessment";
    status: "rejected" | "pending" | "approved";
    requestType: "field_change";
    leadId: string;
    fieldName: string;
    currentValue: string;
    requestedValue: string;
    reason: string;
    requestedBy: string;
    requestedTo: string;
    reviewedBy: string;
    reviewedAt: NativeDate;
    rejectionReason: string;
} & mongoose.DefaultTimestampProps>, {}, mongoose.ResolveSchemaOptions<{
    timestamps: true;
}>> & mongoose.FlatRecord<{
    recordType: "visa_application" | "spouse_skill_assessment";
    status: "rejected" | "pending" | "approved";
    requestType: "field_change";
    leadId: string;
    fieldName: string;
    currentValue: string;
    requestedValue: string;
    reason: string;
    requestedBy: string;
    requestedTo: string;
    reviewedBy: string;
    reviewedAt: NativeDate;
    rejectionReason: string;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export type AdminApprovalRequestType = InferSchemaType<typeof adminApprovalRequestSchema>;
declare const AdminApprovalRequest: mongoose.Model<{
    recordType: "visa_application" | "spouse_skill_assessment";
    status: "rejected" | "pending" | "approved";
    requestType: "field_change";
    leadId: string;
    fieldName: string;
    currentValue: string;
    requestedValue: string;
    reason: string;
    requestedBy: string;
    requestedTo: string;
    reviewedBy: string;
    reviewedAt: NativeDate;
    rejectionReason: string;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    recordType: "visa_application" | "spouse_skill_assessment";
    status: "rejected" | "pending" | "approved";
    requestType: "field_change";
    leadId: string;
    fieldName: string;
    currentValue: string;
    requestedValue: string;
    reason: string;
    requestedBy: string;
    requestedTo: string;
    reviewedBy: string;
    reviewedAt: NativeDate;
    rejectionReason: string;
} & mongoose.DefaultTimestampProps, {}, {}> & {
    recordType: "visa_application" | "spouse_skill_assessment";
    status: "rejected" | "pending" | "approved";
    requestType: "field_change";
    leadId: string;
    fieldName: string;
    currentValue: string;
    requestedValue: string;
    reason: string;
    requestedBy: string;
    requestedTo: string;
    reviewedBy: string;
    reviewedAt: NativeDate;
    rejectionReason: string;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>;
export default AdminApprovalRequest;
