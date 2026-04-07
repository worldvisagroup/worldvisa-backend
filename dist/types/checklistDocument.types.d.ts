import type { VisaServiceType, ChecklistDocumentState } from '../constants/checklistDocument';
export type ChecklistDocumentTemplateDTO = {
    _id: string;
    category: string;
    documentType: string;
    allowedDocument: number;
    sampleDocumentUrl?: string | null;
    importantNote?: string | null;
    format?: string[];
    visaServiceType: VisaServiceType;
    state: ChecklistDocumentState;
    addedBy?: string | null;
    updatedBy?: string | null;
    createdAt: string;
    updatedAt: string;
};
export type CreateChecklistDocumentTemplateBody = {
    category: string;
    documentType: string;
    allowedDocument: number;
    sampleDocumentUrl?: string | null;
    importantNote?: string | null;
    format?: string[];
    visaServiceType: VisaServiceType;
    state?: ChecklistDocumentState;
};
export type UpdateChecklistDocumentTemplateBody = Partial<CreateChecklistDocumentTemplateBody>;
export type PaginationMeta = {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    limit: number;
};
