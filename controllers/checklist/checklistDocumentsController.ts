import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import ChecklistDocument from '../../models/checklistDocument.model';
import { CHECKLIST_DOCUMENT_STATES, VISA_SERVICE_TYPE_VALUES } from '../../constants/checklistDocument';
const { uploadToR2 } = require('../../services/r2Client');

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getActor(req: Request): string {
  const u: any = (req as any).user;
  return String(u?.username ?? u?.name ?? u?.email ?? u?._id ?? 'unknown');
}

function getIdParam(req: Request): string {
  const raw: unknown = (req.params as any).id;
  if (Array.isArray(raw)) return String(raw[0] ?? '');
  return String(raw ?? '');
}

const ALL_REAL_VISA_TYPES = (VISA_SERVICE_TYPE_VALUES as readonly string[]).filter(v => v !== 'All');

const BULK_UPDATE_ALLOWED_FIELDS = ['allowedDocument', 'format', 'sampleDocumentUrl', 'importantNote', 'state'] as const;

function buildChecklistBulkUpsertOpsForUpdates(
  category: string,
  documentType: string,
  actor: string,
  updates: Record<string, any>
): Parameters<typeof ChecklistDocument.bulkWrite>[0] {
  return ALL_REAL_VISA_TYPES.map((visaServiceType) => {
    const $set: Record<string, any> = {
      category,
      documentType,
      visaServiceType,
      updatedBy: actor,
    };
    for (const f of BULK_UPDATE_ALLOWED_FIELDS) {
      if (updates[f] !== undefined) $set[f] = updates[f];
    }

    const $setOnInsert: Record<string, any> = { addedBy: actor };
    if (updates.state === undefined) $setOnInsert.state = 'active';
    if (updates.format === undefined) $setOnInsert.format = [];
    if (updates.sampleDocumentUrl === undefined) $setOnInsert.sampleDocumentUrl = null;
    if (updates.importantNote === undefined) $setOnInsert.importantNote = null;

    return {
      updateOne: {
        filter: { visaServiceType, category, documentType },
        update: { $set, $setOnInsert },
        upsert: true,
      },
    };
  });
}

function buildChecklistBulkUpsertOpsForCreate(
  category: string,
  documentType: string,
  actor: string,
  body: {
    allowedDocument: number;
    format?: unknown;
    sampleDocumentUrl?: string | null;
    importantNote?: string | null;
    state?: string;
  }
): Parameters<typeof ChecklistDocument.bulkWrite>[0] {
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

function bulkWriteResultPayload(result: mongoose.mongo.BulkWriteResult) {
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

export const getChecklistDocumentsSummary = async (_req: Request, res: Response): Promise<void> => {
  try {
    const groups = await ChecklistDocument.aggregate([
      { $group: {
          _id: '$visaServiceType',
          documentCount: { $sum: 1 },
          categories: { $addToSet: '$category' },
      }},
      { $project: {
          visaServiceType: '$_id',
          documentCount: 1,
          categoryCount: { $size: '$categories' },
          _id: 0,
      }},
      { $sort: { visaServiceType: 1 } },
    ]);

    res.status(200).json({ status: 'success', data: { summary: groups } });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message || 'Failed to get summary' });
  }
};

export const listChecklistDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1);
    const limitRaw = parseInt(String(req.query.limit ?? '20'), 10) || 20;
    const limit = Math.min(Math.max(limitRaw, 1), 100);
    const skip = (page - 1) * limit;

    const state = (req.query.state as string | undefined)?.trim();
    const visaServiceType = (req.query.visaServiceType as string | undefined)?.trim();
    const category = (req.query.category as string | undefined)?.trim();
    const documentType = (req.query.documentType as string | undefined)?.trim();
    const search = (req.query.search as string | undefined)?.trim();

    const sortBy = (req.query.sortBy as string | undefined)?.trim() ?? 'createdAt';
    const sortOrder = (String(req.query.sortOrder ?? 'desc').toLowerCase() === 'asc') ? 1 : -1;

    const filter: Record<string, any> = {};

    if (state && (CHECKLIST_DOCUMENT_STATES as readonly string[]).includes(state)) filter.state = state;
    if (visaServiceType && (VISA_SERVICE_TYPE_VALUES as readonly string[]).includes(visaServiceType)) {
      filter.visaServiceType = visaServiceType;
    }
    if (category) filter.category = category;
    if (documentType) filter.documentType = documentType;

    if (search) {
      const safe = escapeRegex(search.slice(0, 100));
      const rx = new RegExp(safe, 'i');
      filter.$or = [{ category: rx }, { documentType: rx }, { importantNote: rx }];
    }

    const sort: Record<string, 1 | -1> = {};
    if (['createdAt', 'updatedAt', 'category', 'documentType', 'allowedDocument', 'state', 'visaServiceType'].includes(sortBy)) {
      sort[sortBy] = sortOrder as 1 | -1;
    } else {
      sort.createdAt = -1;
    }

    const [items, totalRecords] = await Promise.all([
      ChecklistDocument.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      ChecklistDocument.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      status: 'success',
      data: { items },
      pagination: { currentPage: page, totalPages, totalRecords, limit },
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message || 'Failed to list checklist documents' });
  }
};

export const listChecklistCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const visaServiceType = (req.query.visaServiceType as string | undefined)?.trim();
    const state = (req.query.state as string | undefined)?.trim();

    const filter: Record<string, any> = {};
    if (visaServiceType && (VISA_SERVICE_TYPE_VALUES as readonly string[]).includes(visaServiceType)) {
      filter.visaServiceType = visaServiceType;
    }
    if (state && (CHECKLIST_DOCUMENT_STATES as readonly string[]).includes(state)) {
      filter.state = state;
    }

    const categories: string[] = await ChecklistDocument.distinct('category', filter);
    categories.sort();

    res.status(200).json({ status: 'success', data: { categories } });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message || 'Failed to list categories' });
  }
};

export const listChecklistDocumentsGrouped = async (req: Request, res: Response): Promise<void> => {
  try {
    const visaServiceType = (req.query.visaServiceType as string | undefined)?.trim();
    const state = (req.query.state as string | undefined)?.trim();

    const filter: Record<string, any> = {};
    if (visaServiceType && (VISA_SERVICE_TYPE_VALUES as readonly string[]).includes(visaServiceType)) {
      filter.visaServiceType = visaServiceType;
    }
    if (state && (CHECKLIST_DOCUMENT_STATES as readonly string[]).includes(state)) {
      filter.state = state;
    }

    const groups = await ChecklistDocument.aggregate([
      { $match: filter },
      { $sort: { category: 1, documentType: 1 } },
      { $group: { _id: '$category', documents: { $push: '$$ROOT' } } },
      { $project: { _id: 0, category: '$_id', documents: 1 } },
      { $sort: { category: 1 } },
    ]);

    res.status(200).json({ status: 'success', data: { groups } });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message || 'Failed to list grouped documents' });
  }
};

export const getChecklistDocumentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = getIdParam(req);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ status: 'fail', message: 'Invalid id' });
      return;
    }

    const doc = await ChecklistDocument.findById(id).lean();
    if (!doc) {
      res.status(404).json({ status: 'fail', message: 'Checklist document not found' });
      return;
    }

    res.status(200).json({ status: 'success', data: { item: doc } });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message || 'Failed to get checklist document' });
  }
};

export const createChecklistDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const actor = getActor(req);

    const file = (req as any).file;
    let sampleDocumentUrl: string | null = req.body.sampleDocumentUrl ?? null;
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

    const created = await ChecklistDocument.create(payload);
    res.status(201).json({ status: 'success', data: { item: created } });
  } catch (err: any) {
    if (err?.code === 11000) {
      res.status(409).json({ status: 'fail', message: 'Checklist document already exists for this visaServiceType/category/documentType' });
      return;
    }
    res.status(500).json({ status: 'error', message: err.message || 'Failed to create checklist document' });
  }
};

export const bulkCreateChecklistDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, documentType, allowedDocument, format, importantNote, state } = req.body;
    let { sampleDocumentUrl } = req.body;
    const actor = getActor(req);

    const file = (req as any).file;
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

    const result = await ChecklistDocument.bulkWrite(ops, { ordered: false });
    const payload = bulkWriteResultPayload(result);

    res.status(201).json({
      status: 'success',
      data: {
        ...payload,
        skipped: 0,
      },
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message || 'Failed to bulk create checklist documents' });
  }
};

export const updateChecklistDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = getIdParam(req);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ status: 'fail', message: 'Invalid id' });
      return;
    }

    const actor = getActor(req);
    const update: Record<string, any> = { updatedBy: actor };

    const file = (req as any).file;
    if (file) {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_').slice(0, 100);
      const key = `checklist-samples/${Date.now()}-${safeName}`;
      update.sampleDocumentUrl = await uploadToR2(key, file.buffer, file.mimetype);
    }

    const fields = ['category', 'documentType', 'allowedDocument', 'sampleDocumentUrl', 'importantNote', 'format', 'visaServiceType', 'state'] as const;
    for (const f of fields) {
      if (req.body[f] !== undefined) update[f] = req.body[f];
    }

    const updated = await ChecklistDocument.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean();
    if (!updated) {
      res.status(404).json({ status: 'fail', message: 'Checklist document not found' });
      return;
    }

    res.status(200).json({ status: 'success', data: { item: updated } });
  } catch (err: any) {
    if (err?.code === 11000) {
      res.status(409).json({ status: 'fail', message: 'Checklist document already exists for this visaServiceType/category/documentType' });
      return;
    }
    res.status(500).json({ status: 'error', message: err.message || 'Failed to update checklist document' });
  }
};

export const bulkUpdateChecklistDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, documentType, updates } = req.body;
    const actor = getActor(req);

    if (updates === null || typeof updates !== 'object' || Array.isArray(updates)) {
      res.status(400).json({ status: 'fail', message: 'updates must be a non-array object' });
      return;
    }

    const normalizedUpdates = { ...updates } as Record<string, unknown>;
    delete normalizedUpdates.category;
    delete normalizedUpdates.documentType;

    for (const k of Object.keys(normalizedUpdates)) {
      if (!(BULK_UPDATE_ALLOWED_FIELDS as readonly string[]).includes(k)) {
        res.status(400).json({ status: 'fail', message: `Invalid key in updates: ${k}` });
        return;
      }
    }

    const file = (req as any).file;
    if (file) {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_').slice(0, 100);
      const key = `checklist-samples/${Date.now()}-${safeName}`;
      normalizedUpdates.sampleDocumentUrl = await uploadToR2(key, file.buffer, file.mimetype);
    }

    const existingTypes: string[] = await ChecklistDocument.distinct('visaServiceType', { category, documentType });
    const existingSet = new Set(existingTypes);
    const missingTypes = ALL_REAL_VISA_TYPES.filter((v) => !existingSet.has(v));
    if (missingTypes.length > 0 && normalizedUpdates.allowedDocument === undefined) {
      res.status(400).json({
        status: 'fail',
        message:
          'updates.allowedDocument is required when some visa service types do not yet exist for this category and document type',
      });
      return;
    }

    const ops = buildChecklistBulkUpsertOpsForUpdates(category, documentType, actor, normalizedUpdates);
    const result = await ChecklistDocument.bulkWrite(ops, { ordered: false });
    const payload = bulkWriteResultPayload(result);

    res.status(200).json({ status: 'success', data: payload });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message || 'Failed to bulk update checklist documents' });
  }
};

export const updateChecklistDocumentState = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = getIdParam(req);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ status: 'fail', message: 'Invalid id' });
      return;
    }

    const actor = getActor(req);
    const updated = await ChecklistDocument.findByIdAndUpdate(
      id,
      { state: req.body.state, updatedBy: actor },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      res.status(404).json({ status: 'fail', message: 'Checklist document not found' });
      return;
    }

    res.status(200).json({ status: 'success', data: { item: updated } });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message || 'Failed to update state' });
  }
};

export const deleteChecklistDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = getIdParam(req);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ status: 'fail', message: 'Invalid id' });
      return;
    }

    const deleted = await ChecklistDocument.findByIdAndDelete(id).lean();
    if (!deleted) {
      res.status(404).json({ status: 'fail', message: 'Checklist document not found' });
      return;
    }

    res.status(200).json({ status: 'success', message: 'Checklist document deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message || 'Failed to delete checklist document' });
  }
};

