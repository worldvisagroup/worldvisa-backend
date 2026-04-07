"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteChecklistDocument = exports.updateChecklistDocumentState = exports.bulkUpdateChecklistDocuments = exports.updateChecklistDocument = exports.bulkCreateChecklistDocuments = exports.createChecklistDocument = exports.getChecklistDocumentById = exports.listChecklistDocumentsGrouped = exports.listChecklistCategories = exports.listChecklistDocuments = exports.getChecklistDocumentsSummary = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const checklistDocument_model_1 = __importDefault(require("../../models/checklistDocument.model"));
const checklistDocument_1 = require("../../constants/checklistDocument");
const { uploadToR2 } = require('../../services/r2Client');
function escapeRegex(input) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function getActor(req) {
    const u = req.user;
    return String(u?.username ?? u?.name ?? u?.email ?? u?._id ?? 'unknown');
}
function getIdParam(req) {
    const raw = req.params.id;
    if (Array.isArray(raw))
        return String(raw[0] ?? '');
    return String(raw ?? '');
}
const ALL_REAL_VISA_TYPES = checklistDocument_1.VISA_SERVICE_TYPE_VALUES.filter(v => v !== 'All');
const BULK_UPDATE_ALLOWED_FIELDS = ['allowedDocument', 'format', 'sampleDocumentUrl', 'importantNote', 'state'];
function buildChecklistBulkUpsertOpsForUpdates(category, documentType, actor, updates) {
    return ALL_REAL_VISA_TYPES.map((visaServiceType) => {
        const $set = {
            category,
            documentType,
            visaServiceType,
            updatedBy: actor,
        };
        for (const f of BULK_UPDATE_ALLOWED_FIELDS) {
            if (updates[f] !== undefined)
                $set[f] = updates[f];
        }
        const $setOnInsert = { addedBy: actor };
        if (updates.state === undefined)
            $setOnInsert.state = 'active';
        if (updates.format === undefined)
            $setOnInsert.format = [];
        if (updates.sampleDocumentUrl === undefined)
            $setOnInsert.sampleDocumentUrl = null;
        if (updates.importantNote === undefined)
            $setOnInsert.importantNote = null;
        return {
            updateOne: {
                filter: { visaServiceType, category, documentType },
                update: { $set, $setOnInsert },
                upsert: true,
            },
        };
    });
}
function buildChecklistBulkUpsertOpsForCreate(category, documentType, actor, body) {
    const format = Array.isArray(body.format) ? body.format : [];
    const sampleDocumentUrl = body.sampleDocumentUrl ?? null;
    const importantNote = body.importantNote ?? null;
    const state = body.state ?? 'active';
    return ALL_REAL_VISA_TYPES.map((visaServiceType) => ({
        updateOne: {
            filter: { visaServiceType, category, documentType },
            update: {
                $set: {
                    category,
                    documentType,
                    visaServiceType,
                    allowedDocument: body.allowedDocument,
                    format,
                    sampleDocumentUrl,
                    importantNote,
                    state,
                    updatedBy: actor,
                },
                $setOnInsert: { addedBy: actor },
            },
            upsert: true,
        },
    }));
}
function bulkWriteResultPayload(result) {
    const matchedCount = result.matchedCount ?? 0;
    const modifiedCount = result.modifiedCount ?? 0;
    const upsertedCount = result.upsertedCount ?? 0;
    const insertedCount = result.insertedCount ?? 0;
    const deletedCount = result.deletedCount ?? 0;
    return {
        matchedCount,
        modifiedCount,
        upsertedCount,
        insertedCount,
        deletedCount,
        visaServiceTypes: [...ALL_REAL_VISA_TYPES],
        updated: modifiedCount,
        created: upsertedCount,
    };
}
const getChecklistDocumentsSummary = async (_req, res) => {
    try {
        const groups = await checklistDocument_model_1.default.aggregate([
            { $group: {
                    _id: '$visaServiceType',
                    documentCount: { $sum: 1 },
                    categories: { $addToSet: '$category' },
                } },
            { $project: {
                    visaServiceType: '$_id',
                    documentCount: 1,
                    categoryCount: { $size: '$categories' },
                    _id: 0,
                } },
            { $sort: { visaServiceType: 1 } },
        ]);
        res.status(200).json({ status: 'success', data: { summary: groups } });
    }
    catch (err) {
        res.status(500).json({ status: 'error', message: err.message || 'Failed to get summary' });
    }
};
exports.getChecklistDocumentsSummary = getChecklistDocumentsSummary;
const listChecklistDocuments = async (req, res) => {
    try {
        const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1);
        const limitRaw = parseInt(String(req.query.limit ?? '20'), 10) || 20;
        const limit = Math.min(Math.max(limitRaw, 1), 100);
        const skip = (page - 1) * limit;
        const state = req.query.state?.trim();
        const visaServiceType = req.query.visaServiceType?.trim();
        const category = req.query.category?.trim();
        const documentType = req.query.documentType?.trim();
        const search = req.query.search?.trim();
        const sortBy = req.query.sortBy?.trim() ?? 'createdAt';
        const sortOrder = (String(req.query.sortOrder ?? 'desc').toLowerCase() === 'asc') ? 1 : -1;
        const filter = {};
        if (state && checklistDocument_1.CHECKLIST_DOCUMENT_STATES.includes(state))
            filter.state = state;
        if (visaServiceType && checklistDocument_1.VISA_SERVICE_TYPE_VALUES.includes(visaServiceType)) {
            filter.visaServiceType = visaServiceType;
        }
        if (category)
            filter.category = category;
        if (documentType)
            filter.documentType = documentType;
        if (search) {
            const safe = escapeRegex(search.slice(0, 100));
            const rx = new RegExp(safe, 'i');
            filter.$or = [{ category: rx }, { documentType: rx }, { importantNote: rx }];
        }
        const sort = {};
        if (['createdAt', 'updatedAt', 'category', 'documentType', 'allowedDocument', 'state', 'visaServiceType'].includes(sortBy)) {
            sort[sortBy] = sortOrder;
        }
        else {
            sort.createdAt = -1;
        }
        const [items, totalRecords] = await Promise.all([
            checklistDocument_model_1.default.find(filter).sort(sort).skip(skip).limit(limit).lean(),
            checklistDocument_model_1.default.countDocuments(filter),
        ]);
        const totalPages = Math.ceil(totalRecords / limit);
        res.status(200).json({
            status: 'success',
            data: { items },
            pagination: { currentPage: page, totalPages, totalRecords, limit },
        });
    }
    catch (err) {
        res.status(500).json({ status: 'error', message: err.message || 'Failed to list checklist documents' });
    }
};
exports.listChecklistDocuments = listChecklistDocuments;
const listChecklistCategories = async (req, res) => {
    try {
        const visaServiceType = req.query.visaServiceType?.trim();
        const state = req.query.state?.trim();
        const filter = {};
        if (visaServiceType && checklistDocument_1.VISA_SERVICE_TYPE_VALUES.includes(visaServiceType)) {
            filter.visaServiceType = visaServiceType;
        }
        if (state && checklistDocument_1.CHECKLIST_DOCUMENT_STATES.includes(state)) {
            filter.state = state;
        }
        const categories = await checklistDocument_model_1.default.distinct('category', filter);
        categories.sort();
        res.status(200).json({ status: 'success', data: { categories } });
    }
    catch (err) {
        res.status(500).json({ status: 'error', message: err.message || 'Failed to list categories' });
    }
};
exports.listChecklistCategories = listChecklistCategories;
const listChecklistDocumentsGrouped = async (req, res) => {
    try {
        const visaServiceType = req.query.visaServiceType?.trim();
        const state = req.query.state?.trim();
        const filter = {};
        if (visaServiceType && checklistDocument_1.VISA_SERVICE_TYPE_VALUES.includes(visaServiceType)) {
            filter.visaServiceType = visaServiceType;
        }
        if (state && checklistDocument_1.CHECKLIST_DOCUMENT_STATES.includes(state)) {
            filter.state = state;
        }
        const groups = await checklistDocument_model_1.default.aggregate([
            { $match: filter },
            { $sort: { category: 1, documentType: 1 } },
            { $group: { _id: '$category', documents: { $push: '$$ROOT' } } },
            { $project: { _id: 0, category: '$_id', documents: 1 } },
            { $sort: { category: 1 } },
        ]);
        res.status(200).json({ status: 'success', data: { groups } });
    }
    catch (err) {
        res.status(500).json({ status: 'error', message: err.message || 'Failed to list grouped documents' });
    }
};
exports.listChecklistDocumentsGrouped = listChecklistDocumentsGrouped;
const getChecklistDocumentById = async (req, res) => {
    try {
        const id = getIdParam(req);
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ status: 'fail', message: 'Invalid id' });
            return;
        }
        const doc = await checklistDocument_model_1.default.findById(id).lean();
        if (!doc) {
            res.status(404).json({ status: 'fail', message: 'Checklist document not found' });
            return;
        }
        res.status(200).json({ status: 'success', data: { item: doc } });
    }
    catch (err) {
        res.status(500).json({ status: 'error', message: err.message || 'Failed to get checklist document' });
    }
};
exports.getChecklistDocumentById = getChecklistDocumentById;
const createChecklistDocument = async (req, res) => {
    try {
        const actor = getActor(req);
        const file = req.file;
        let sampleDocumentUrl = req.body.sampleDocumentUrl ?? null;
        if (file) {
            const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_').slice(0, 100);
            const key = `checklist-samples/${Date.now()}-${safeName}`;
            sampleDocumentUrl = await uploadToR2(key, file.buffer, file.mimetype);
        }
        const payload = {
            category: req.body.category,
            documentType: req.body.documentType,
            allowedDocument: req.body.allowedDocument,
            sampleDocumentUrl,
            importantNote: req.body.importantNote ?? null,
            format: req.body.format ?? [],
            visaServiceType: req.body.visaServiceType,
            state: req.body.state ?? 'active',
            addedBy: actor,
            updatedBy: actor,
        };
        const created = await checklistDocument_model_1.default.create(payload);
        res.status(201).json({ status: 'success', data: { item: created } });
    }
    catch (err) {
        if (err?.code === 11000) {
            res.status(409).json({ status: 'fail', message: 'Checklist document already exists for this visaServiceType/category/documentType' });
            return;
        }
        res.status(500).json({ status: 'error', message: err.message || 'Failed to create checklist document' });
    }
};
exports.createChecklistDocument = createChecklistDocument;
const bulkCreateChecklistDocuments = async (req, res) => {
    try {
        const { category, documentType, allowedDocument, format, importantNote, state } = req.body;
        let { sampleDocumentUrl } = req.body;
        const actor = getActor(req);
        const file = req.file;
        if (file) {
            const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_').slice(0, 100);
            const key = `checklist-samples/${Date.now()}-${safeName}`;
            sampleDocumentUrl = await uploadToR2(key, file.buffer, file.mimetype);
        }
        const ops = buildChecklistBulkUpsertOpsForCreate(category, documentType, actor, {
            allowedDocument,
            format,
            sampleDocumentUrl,
            importantNote,
            state,
        });
        const result = await checklistDocument_model_1.default.bulkWrite(ops, { ordered: false });
        const payload = bulkWriteResultPayload(result);
        res.status(201).json({
            status: 'success',
            data: {
                ...payload,
                skipped: 0,
            },
        });
    }
    catch (err) {
        res.status(500).json({ status: 'error', message: err.message || 'Failed to bulk create checklist documents' });
    }
};
exports.bulkCreateChecklistDocuments = bulkCreateChecklistDocuments;
const updateChecklistDocument = async (req, res) => {
    try {
        const id = getIdParam(req);
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ status: 'fail', message: 'Invalid id' });
            return;
        }
        const actor = getActor(req);
        const update = { updatedBy: actor };
        const file = req.file;
        if (file) {
            const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_').slice(0, 100);
            const key = `checklist-samples/${Date.now()}-${safeName}`;
            update.sampleDocumentUrl = await uploadToR2(key, file.buffer, file.mimetype);
        }
        const fields = ['category', 'documentType', 'allowedDocument', 'sampleDocumentUrl', 'importantNote', 'format', 'visaServiceType', 'state'];
        for (const f of fields) {
            if (req.body[f] !== undefined)
                update[f] = req.body[f];
        }
        const updated = await checklistDocument_model_1.default.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean();
        if (!updated) {
            res.status(404).json({ status: 'fail', message: 'Checklist document not found' });
            return;
        }
        res.status(200).json({ status: 'success', data: { item: updated } });
    }
    catch (err) {
        if (err?.code === 11000) {
            res.status(409).json({ status: 'fail', message: 'Checklist document already exists for this visaServiceType/category/documentType' });
            return;
        }
        res.status(500).json({ status: 'error', message: err.message || 'Failed to update checklist document' });
    }
};
exports.updateChecklistDocument = updateChecklistDocument;
const bulkUpdateChecklistDocuments = async (req, res) => {
    try {
        const { category, documentType, updates } = req.body;
        const actor = getActor(req);
        if (updates === null || typeof updates !== 'object' || Array.isArray(updates)) {
            res.status(400).json({ status: 'fail', message: 'updates must be a non-array object' });
            return;
        }
        const normalizedUpdates = { ...updates };
        delete normalizedUpdates.category;
        delete normalizedUpdates.documentType;
        for (const k of Object.keys(normalizedUpdates)) {
            if (!BULK_UPDATE_ALLOWED_FIELDS.includes(k)) {
                res.status(400).json({ status: 'fail', message: `Invalid key in updates: ${k}` });
                return;
            }
        }
        const file = req.file;
        if (file) {
            const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_').slice(0, 100);
            const key = `checklist-samples/${Date.now()}-${safeName}`;
            normalizedUpdates.sampleDocumentUrl = await uploadToR2(key, file.buffer, file.mimetype);
        }
        const existingTypes = await checklistDocument_model_1.default.distinct('visaServiceType', { category, documentType });
        const existingSet = new Set(existingTypes);
        const missingTypes = ALL_REAL_VISA_TYPES.filter((v) => !existingSet.has(v));
        if (missingTypes.length > 0 && normalizedUpdates.allowedDocument === undefined) {
            res.status(400).json({
                status: 'fail',
                message: 'updates.allowedDocument is required when some visa service types do not yet exist for this category and document type',
            });
            return;
        }
        const ops = buildChecklistBulkUpsertOpsForUpdates(category, documentType, actor, normalizedUpdates);
        const result = await checklistDocument_model_1.default.bulkWrite(ops, { ordered: false });
        const payload = bulkWriteResultPayload(result);
        res.status(200).json({ status: 'success', data: payload });
    }
    catch (err) {
        res.status(500).json({ status: 'error', message: err.message || 'Failed to bulk update checklist documents' });
    }
};
exports.bulkUpdateChecklistDocuments = bulkUpdateChecklistDocuments;
const updateChecklistDocumentState = async (req, res) => {
    try {
        const id = getIdParam(req);
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ status: 'fail', message: 'Invalid id' });
            return;
        }
        const actor = getActor(req);
        const updated = await checklistDocument_model_1.default.findByIdAndUpdate(id, { state: req.body.state, updatedBy: actor }, { new: true, runValidators: true }).lean();
        if (!updated) {
            res.status(404).json({ status: 'fail', message: 'Checklist document not found' });
            return;
        }
        res.status(200).json({ status: 'success', data: { item: updated } });
    }
    catch (err) {
        res.status(500).json({ status: 'error', message: err.message || 'Failed to update state' });
    }
};
exports.updateChecklistDocumentState = updateChecklistDocumentState;
const deleteChecklistDocument = async (req, res) => {
    try {
        const id = getIdParam(req);
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ status: 'fail', message: 'Invalid id' });
            return;
        }
        const deleted = await checklistDocument_model_1.default.findByIdAndDelete(id).lean();
        if (!deleted) {
            res.status(404).json({ status: 'fail', message: 'Checklist document not found' });
            return;
        }
        res.status(200).json({ status: 'success', message: 'Checklist document deleted successfully' });
    }
    catch (err) {
        res.status(500).json({ status: 'error', message: err.message || 'Failed to delete checklist document' });
    }
};
exports.deleteChecklistDocument = deleteChecklistDocument;
