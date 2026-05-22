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
    requestedValue: string;
    reason: string;
    requestedBy: string;
    requestedTo: string;
    currentValue?: string | null | undefined;
    reviewedBy?: string | null | undefined;
    reviewedAt?: NativeDate | null | undefined;
    rejectionReason?: string | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    recordType: "visa_application" | "spouse_skill_assessment";
    status: "rejected" | "pending" | "approved";
    requestType: "field_change";
    leadId: string;
    fieldName: string;
    requestedValue: string;
    reason: string;
    requestedBy: string;
    requestedTo: string;
    currentValue?: string | null | undefined;
    reviewedBy?: string | null | undefined;
    reviewedAt?: NativeDate | null | undefined;
    rejectionReason?: string | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    recordType: "visa_application" | "spouse_skill_assessment";
    status: "rejected" | "pending" | "approved";
    requestType: "field_change";
    leadId: string;
    fieldName: string;
    requestedValue: string;
    reason: string;
    requestedBy: string;
    requestedTo: string;
    currentValue?: string | null | undefined;
    reviewedBy?: string | null | undefined;
    reviewedAt?: NativeDate | null | undefined;
    rejectionReason?: string | null | undefined;
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
    requestedValue: string;
    reason: string;
    requestedBy: string;
    requestedTo: string;
    currentValue?: string | null | undefined;
    reviewedBy?: string | null | undefined;
    reviewedAt?: NativeDate | null | undefined;
    rejectionReason?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    recordType: "visa_application" | "spouse_skill_assessment";
    status: "rejected" | "pending" | "approved";
    requestType: "field_change";
    leadId: string;
    fieldName: string;
    requestedValue: string;
    reason: string;
    requestedBy: string;
    requestedTo: string;
    currentValue?: string | null | undefined;
    reviewedBy?: string | null | undefined;
    reviewedAt?: NativeDate | null | undefined;
    rejectionReason?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}> & {
    recordType: "visa_application" | "spouse_skill_assessment";
    status: "rejected" | "pending" | "approved";
    requestType: "field_change";
    leadId: string;
    fieldName: string;
    requestedValue: string;
    reason: string;
    requestedBy: string;
    requestedTo: string;
    currentValue?: string | null | undefined;
    reviewedBy?: string | null | undefined;
    reviewedAt?: NativeDate | null | undefined;
    rejectionReason?: string | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>;
export default AdminApprovalRequest;
