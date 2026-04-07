import { Router, type Request, type Response, type NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { protect } from '../../../middleware/clerk/clerkAuth';
import { CHECKLIST_DOCUMENT_STATES, VISA_SERVICE_TYPE_VALUES } from '../../../constants/checklistDocument';
import {
  getChecklistDocumentsSummary,
  listChecklistDocuments,
  listChecklistCategories,
  listChecklistDocumentsGrouped,
  getChecklistDocumentById,
  createChecklistDocument,
  bulkCreateChecklistDocuments,
  updateChecklistDocument,
  bulkUpdateChecklistDocuments,
  updateChecklistDocumentState,
  deleteChecklistDocument,
} from '../../../controllers/checklist/checklistDocumentsController';

const { restrictToAdmin } = require('../../../controllers/zohoDmsAuthController');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    cb(null, allowed.includes(file.mimetype));
  },
});

const router = Router();

const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ status: 'fail', message: 'Validation failed', errors: errors.array() });
    return;
  }
  next();
};

const normalizeToArray = (val: unknown): unknown[] => ([] as unknown[]).concat(val ?? []);

const formatArrayValidator = (arr: unknown[]) =>
  arr.every((v) => typeof v === 'string' && (v as string).length <= 50);

const BULK_PATCH_UPDATES_KEYS = new Set([
  'allowedDocument',
  'format',
  'sampleDocumentUrl',
  'importantNote',
  'state',
]);

const bulkPatchUpdatesShape = (value: unknown) => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('updates must be a non-array object');
  }
  for (const k of Object.keys(value as Record<string, unknown>)) {
    if (!BULK_PATCH_UPDATES_KEYS.has(k)) {
      throw new Error(`Invalid key in updates: ${k}`);
    }
  }
  return true;
};

const stripBulkPatchIdentityKeysFromUpdates = (value: unknown): unknown => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return value;
  const o = { ...(value as Record<string, unknown>) };
  delete o.category;
  delete o.documentType;
  return o;
};

router.use(
  ...protect,
  restrictToAdmin as (req: Request, res: Response, next: NextFunction) => void
);

// ── Static / derived routes (must be before /:id) ────────────────────────────

router.get('/visa-service-types', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'success', data: { visaServiceTypes: VISA_SERVICE_TYPE_VALUES } });
});

router.get('/summary', getChecklistDocumentsSummary);

router.get(
  '/categories',
  query('visaServiceType').optional().isIn(VISA_SERVICE_TYPE_VALUES as unknown as string[]),
  query('state').optional().isIn(CHECKLIST_DOCUMENT_STATES as unknown as string[]),
  validate,
  listChecklistCategories
);

router.get(
  '/grouped',
  query('visaServiceType').optional().isIn(VISA_SERVICE_TYPE_VALUES as unknown as string[]),
  query('state').optional().isIn(CHECKLIST_DOCUMENT_STATES as unknown as string[]),
  validate,
  listChecklistDocumentsGrouped
);

// ── Bulk routes (must be before /:id) ────────────────────────────────────────

router.post(
  '/bulk',
  upload.single('sampleDocument'),
  body('category').isString().trim().isLength({ min: 1, max: 200 }),
  body('documentType').isString().trim().isLength({ min: 1, max: 200 }),
  body('allowedDocument').isInt({ min: 0 }).toInt(),
  body('sampleDocumentUrl').optional({ nullable: true }).isURL(),
  body('importantNote').optional({ nullable: true }).isString().trim().isLength({ max: 2000 }),
  body('format').optional().customSanitizer(normalizeToArray).isArray().custom(formatArrayValidator),
  body('state').optional().isIn(CHECKLIST_DOCUMENT_STATES as unknown as string[]),
  validate,
  bulkCreateChecklistDocuments
);

router.patch(
  '/bulk',
  upload.single('sampleDocument'),
  body('category').isString().trim().isLength({ min: 1, max: 200 }),
  body('documentType').isString().trim().isLength({ min: 1, max: 200 }),
  body('updates')
    .customSanitizer((val) => {
      if (typeof val === 'string') { try { return JSON.parse(val); } catch { return val; } }
      return val;
    })
    .customSanitizer(stripBulkPatchIdentityKeysFromUpdates)
    .isObject()
    .custom(bulkPatchUpdatesShape),
  body('updates.allowedDocument').optional().isInt({ min: 0 }).toInt(),
  body('updates.sampleDocumentUrl').optional({ nullable: true }).isURL(),
  body('updates.importantNote').optional({ nullable: true }).isString().trim().isLength({ max: 2000 }),
  body('updates.format').optional().customSanitizer(normalizeToArray).isArray().custom(formatArrayValidator),
  body('updates.state').optional().isIn(CHECKLIST_DOCUMENT_STATES as unknown as string[]),
  validate,
  bulkUpdateChecklistDocuments
);

// ── Collection routes ─────────────────────────────────────────────────────────

router.get(
  '/',
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('state').optional().isIn(CHECKLIST_DOCUMENT_STATES as unknown as string[]),
  query('visaServiceType').optional().isIn(VISA_SERVICE_TYPE_VALUES as unknown as string[]),
  query('category').optional().isString().trim().isLength({ min: 1, max: 200 }),
  query('documentType').optional().isString().trim().isLength({ min: 1, max: 200 }),
  query('search').optional().isString().trim().isLength({ min: 1, max: 100 }),
  query('sortBy').optional().isString().trim().isLength({ min: 1, max: 50 }),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  validate,
  listChecklistDocuments
);

router.post(
  '/',
  upload.single('sampleDocument'),
  body('category').isString().trim().isLength({ min: 1, max: 200 }),
  body('documentType').isString().trim().isLength({ min: 1, max: 200 }),
  body('allowedDocument').isInt({ min: 0 }).toInt(),
  body('sampleDocumentUrl').optional({ nullable: true }).isURL(),
  body('importantNote').optional({ nullable: true }).isString().trim().isLength({ max: 2000 }),
  body('format').optional().customSanitizer(normalizeToArray).isArray().custom(formatArrayValidator),
  body('visaServiceType').isIn(VISA_SERVICE_TYPE_VALUES as unknown as string[]),
  body('state').optional().isIn(CHECKLIST_DOCUMENT_STATES as unknown as string[]),
  validate,
  createChecklistDocument
);

// ── Single-document routes ────────────────────────────────────────────────────

router.get(
  '/:id',
  param('id').isString().trim().isLength({ min: 1 }),
  validate,
  getChecklistDocumentById
);

router.patch(
  '/:id',
  upload.single('sampleDocument'),
  param('id').isString().trim().isLength({ min: 1 }),
  body('category').optional().isString().trim().isLength({ min: 1, max: 200 }),
  body('documentType').optional().isString().trim().isLength({ min: 1, max: 200 }),
  body('allowedDocument').optional().isInt({ min: 0 }).toInt(),
  body('sampleDocumentUrl').optional({ nullable: true }).isURL(),
  body('importantNote').optional({ nullable: true }).isString().trim().isLength({ max: 2000 }),
  body('format').optional().customSanitizer(normalizeToArray).isArray().custom(formatArrayValidator),
  body('visaServiceType').optional().isIn(VISA_SERVICE_TYPE_VALUES as unknown as string[]),
  body('state').optional().isIn(CHECKLIST_DOCUMENT_STATES as unknown as string[]),
  validate,
  updateChecklistDocument
);

router.patch(
  '/:id/state',
  param('id').isString().trim().isLength({ min: 1 }),
  body('state').isIn(CHECKLIST_DOCUMENT_STATES as unknown as string[]),
  validate,
  updateChecklistDocumentState
);

router.delete(
  '/:id',
  param('id').isString().trim().isLength({ min: 1 }),
  validate,
  deleteChecklistDocument
);

export = router;
