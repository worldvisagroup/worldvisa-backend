import mongoose, { type InferSchemaType } from 'mongoose';
declare const checklistDocumentSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    format: string[];
    category: string;
    documentType: string;
    allowedDocument: number;
    sampleDocumentUrl: string;
    importantNote: string;
    visaServiceType: "All" | "University Admission" | "Work Permit" | "Investor Migration" | "College Admission" | "Student Visa" | "Business Visa" | "Permanent Residency" | "Dependent Spouse" | "Intra Office" | "Visit Visa" | "Tourist Visa" | "Oppurtunity Card" | "Job Seeker Visa" | "Germany Opportunity Card" | "Parent Visa RRV" | "Australia GTI" | "Australia Parent Visa" | "Australia Child Visa" | "Australia Partner Visa" | "Parent Visa Australia SC804" | "Australia RRV" | "Child Visa Agreement Australia" | "Retainer Agreement JSV Germany" | "Parent Visa Australia retainer agreement" | "EOI & Visa Stage 2" | "Australia GTI Agreement" | "Temporary Dependent Visa" | "Australian Student Visa" | "Visitor Visa Rejection" | "Australia Work in Holiday Visa" | "Germany Family Re-Union Visa" | "Partner of Student Work Visa" | "Business Visitor Visa" | "Super Visa" | "SC 403 Visa Application" | "SC 400 Visa Application" | "National Innovation Visa(NIV)";
    state: "active" | "inactive";
    addedBy: string;
    updatedBy: string;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    format: string[];
    category: string;
    documentType: string;
    allowedDocument: number;
    sampleDocumentUrl: string;
    importantNote: string;
    visaServiceType: "All" | "University Admission" | "Work Permit" | "Investor Migration" | "College Admission" | "Student Visa" | "Business Visa" | "Permanent Residency" | "Dependent Spouse" | "Intra Office" | "Visit Visa" | "Tourist Visa" | "Oppurtunity Card" | "Job Seeker Visa" | "Germany Opportunity Card" | "Parent Visa RRV" | "Australia GTI" | "Australia Parent Visa" | "Australia Child Visa" | "Australia Partner Visa" | "Parent Visa Australia SC804" | "Australia RRV" | "Child Visa Agreement Australia" | "Retainer Agreement JSV Germany" | "Parent Visa Australia retainer agreement" | "EOI & Visa Stage 2" | "Australia GTI Agreement" | "Temporary Dependent Visa" | "Australian Student Visa" | "Visitor Visa Rejection" | "Australia Work in Holiday Visa" | "Germany Family Re-Union Visa" | "Partner of Student Work Visa" | "Business Visitor Visa" | "Super Visa" | "SC 403 Visa Application" | "SC 400 Visa Application" | "National Innovation Visa(NIV)";
    state: "active" | "inactive";
    addedBy: string;
    updatedBy: string;
} & mongoose.DefaultTimestampProps>, {}, mongoose.ResolveSchemaOptions<{
    timestamps: true;
}>> & mongoose.FlatRecord<{
    format: string[];
    category: string;
    documentType: string;
    allowedDocument: number;
    sampleDocumentUrl: string;
    importantNote: string;
    visaServiceType: "All" | "University Admission" | "Work Permit" | "Investor Migration" | "College Admission" | "Student Visa" | "Business Visa" | "Permanent Residency" | "Dependent Spouse" | "Intra Office" | "Visit Visa" | "Tourist Visa" | "Oppurtunity Card" | "Job Seeker Visa" | "Germany Opportunity Card" | "Parent Visa RRV" | "Australia GTI" | "Australia Parent Visa" | "Australia Child Visa" | "Australia Partner Visa" | "Parent Visa Australia SC804" | "Australia RRV" | "Child Visa Agreement Australia" | "Retainer Agreement JSV Germany" | "Parent Visa Australia retainer agreement" | "EOI & Visa Stage 2" | "Australia GTI Agreement" | "Temporary Dependent Visa" | "Australian Student Visa" | "Visitor Visa Rejection" | "Australia Work in Holiday Visa" | "Germany Family Re-Union Visa" | "Partner of Student Work Visa" | "Business Visitor Visa" | "Super Visa" | "SC 403 Visa Application" | "SC 400 Visa Application" | "National Innovation Visa(NIV)";
    state: "active" | "inactive";
    addedBy: string;
    updatedBy: string;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export type ChecklistDocumentModelType = InferSchemaType<typeof checklistDocumentSchema>;
declare const ChecklistDocument: mongoose.Model<{
    format: string[];
    category: string;
    documentType: string;
    allowedDocument: number;
    sampleDocumentUrl: string;
    importantNote: string;
    visaServiceType: "All" | "University Admission" | "Work Permit" | "Investor Migration" | "College Admission" | "Student Visa" | "Business Visa" | "Permanent Residency" | "Dependent Spouse" | "Intra Office" | "Visit Visa" | "Tourist Visa" | "Oppurtunity Card" | "Job Seeker Visa" | "Germany Opportunity Card" | "Parent Visa RRV" | "Australia GTI" | "Australia Parent Visa" | "Australia Child Visa" | "Australia Partner Visa" | "Parent Visa Australia SC804" | "Australia RRV" | "Child Visa Agreement Australia" | "Retainer Agreement JSV Germany" | "Parent Visa Australia retainer agreement" | "EOI & Visa Stage 2" | "Australia GTI Agreement" | "Temporary Dependent Visa" | "Australian Student Visa" | "Visitor Visa Rejection" | "Australia Work in Holiday Visa" | "Germany Family Re-Union Visa" | "Partner of Student Work Visa" | "Business Visitor Visa" | "Super Visa" | "SC 403 Visa Application" | "SC 400 Visa Application" | "National Innovation Visa(NIV)";
    state: "active" | "inactive";
    addedBy: string;
    updatedBy: string;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    format: string[];
    category: string;
    documentType: string;
    allowedDocument: number;
    sampleDocumentUrl: string;
    importantNote: string;
    visaServiceType: "All" | "University Admission" | "Work Permit" | "Investor Migration" | "College Admission" | "Student Visa" | "Business Visa" | "Permanent Residency" | "Dependent Spouse" | "Intra Office" | "Visit Visa" | "Tourist Visa" | "Oppurtunity Card" | "Job Seeker Visa" | "Germany Opportunity Card" | "Parent Visa RRV" | "Australia GTI" | "Australia Parent Visa" | "Australia Child Visa" | "Australia Partner Visa" | "Parent Visa Australia SC804" | "Australia RRV" | "Child Visa Agreement Australia" | "Retainer Agreement JSV Germany" | "Parent Visa Australia retainer agreement" | "EOI & Visa Stage 2" | "Australia GTI Agreement" | "Temporary Dependent Visa" | "Australian Student Visa" | "Visitor Visa Rejection" | "Australia Work in Holiday Visa" | "Germany Family Re-Union Visa" | "Partner of Student Work Visa" | "Business Visitor Visa" | "Super Visa" | "SC 403 Visa Application" | "SC 400 Visa Application" | "National Innovation Visa(NIV)";
    state: "active" | "inactive";
    addedBy: string;
    updatedBy: string;
} & mongoose.DefaultTimestampProps, {}, {}> & {
    format: string[];
    category: string;
    documentType: string;
    allowedDocument: number;
    sampleDocumentUrl: string;
    importantNote: string;
    visaServiceType: "All" | "University Admission" | "Work Permit" | "Investor Migration" | "College Admission" | "Student Visa" | "Business Visa" | "Permanent Residency" | "Dependent Spouse" | "Intra Office" | "Visit Visa" | "Tourist Visa" | "Oppurtunity Card" | "Job Seeker Visa" | "Germany Opportunity Card" | "Parent Visa RRV" | "Australia GTI" | "Australia Parent Visa" | "Australia Child Visa" | "Australia Partner Visa" | "Parent Visa Australia SC804" | "Australia RRV" | "Child Visa Agreement Australia" | "Retainer Agreement JSV Germany" | "Parent Visa Australia retainer agreement" | "EOI & Visa Stage 2" | "Australia GTI Agreement" | "Temporary Dependent Visa" | "Australian Student Visa" | "Visitor Visa Rejection" | "Australia Work in Holiday Visa" | "Germany Family Re-Union Visa" | "Partner of Student Work Visa" | "Business Visitor Visa" | "Super Visa" | "SC 403 Visa Application" | "SC 400 Visa Application" | "National Innovation Visa(NIV)";
    state: "active" | "inactive";
    addedBy: string;
    updatedBy: string;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>;
export default ChecklistDocument;
