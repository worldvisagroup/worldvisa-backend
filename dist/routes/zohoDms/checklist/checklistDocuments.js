"use strict";
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const clerkAuth_1 = require("../../../middleware/clerk/clerkAuth");
const checklistDocument_1 = require("../../../constants/checklistDocument");
const checklistDocumentsController_1 = require("../../../controllers/checklist/checklistDocumentsController");
const { restrictToAdmin } = require('../../../controllers/zohoDmsAuthController');
const multer = require('multer');
const ALLOWED_SAMPLE_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_SAMPLE_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types: pdf, jpg, png, webp, doc, docx`));
        }
    },
});
const router = (0, express_1.Router)();
const validate = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ status: 'fail', message: 'Validation failed', errors: errors.array() });
        return;
    }
    next();
};
const normalizeToArray = (val) => [].concat(val ?? []);
const formatArrayValidator = (arr) => arr.every((v) => typeof v === 'string' && v.length <= 50);
const BULK_PATCH_UPDATES_KEYS = new Set([
    'allowedDocument',
    'format',
    'sampleDocumentUrl',
    'importantNote',
    'state',
]);
const bulkPatchUpdatesShape = (value) => {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('updates must be a non-array object');
    }
    for (const k of Object.keys(value)) {
        if (!BULK_PATCH_UPDATES_KEYS.has(k)) {
            throw new Error(`Invalid key in updates: ${k}`);
        }
    }
    return true;
};
const stripBulkPatchIdentityKeysFromUpdates = (value) => {
    if (value === null || typeof value !== 'object' || Array.isArray(value))
        return value;
    const o = { ...value };
    delete o.category;
    delete o.documentType;
    return o;
};
router.use(...clerkAuth_1.protect, restrictToAdmin);
// ── Static / derived routes (must be before /:id) ────────────────────────────
router.get('/visa-service-types', (_req, res) => {
    res.status(200).json({ status: 'success', data: { visaServiceTypes: checklistDocument_1.VISA_SERVICE_TYPE_VALUES } });
});
router.get('/summary', checklistDocumentsController_1.getChecklistDocumentsSummary);
router.get('/categories', (0, express_validator_1.query)('visaServiceType').optional().isIn(checklistDocument_1.VISA_SERVICE_TYPE_VALUES), (0, express_validator_1.query)('state').optional().isIn(checklistDocument_1.CHECKLIST_DOCUMENT_STATES), validate, checklistDocumentsController_1.listChecklistCategories);
router.get('/grouped', (0, express_validator_1.query)('visaServiceType').optional().isIn(checklistDocument_1.VISA_SERVICE_TYPE_VALUES), (0, express_validator_1.query)('state').optional().isIn(checklistDocument_1.CHECKLIST_DOCUMENT_STATES), validate, checklistDocumentsController_1.listChecklistDocumentsGrouped);
// ── Bulk routes (must be before /:id) ────────────────────────────────────────
router.post('/bulk', upload.single('sampleDocument'), (0, express_validator_1.body)('category').isString().trim().isLength({ min: 1, max: 200 }), (0, express_validator_1.body)('documentType').isString().trim().isLength({ min: 1, max: 200 }), (0, express_validator_1.body)('allowedDocument').isInt({ min: 0 }).toInt(), (0, express_validator_1.body)('sampleDocumentUrl').optional({ nullable: true }).isURL(), (0, express_validator_1.body)('importantNote').optional({ nullable: true }).isString().trim().isLength({ max: 2000 }), (0, express_validator_1.body)('format').optional().customSanitizer(normalizeToArray).isArray().custom(formatArrayValidator), (0, express_validator_1.body)('state').optional().isIn(checklistDocument_1.CHECKLIST_DOCUMENT_STATES), validate, checklistDocumentsController_1.bulkCreateChecklistDocuments);
router.patch('/bulk', upload.single('sampleDocument'), (0, express_validator_1.body)('category').isString().trim().isLength({ min: 1, max: 200 }), (0, express_validator_1.body)('documentType').isString().trim().isLength({ min: 1, max: 200 }), (0, express_validator_1.body)('updates')
    .customSanitizer((val) => {
    if (typeof val === 'string') {
        try {
            return JSON.parse(val);
        }
        catch {
            return val;
        }
    }
    return val;
})
    .customSanitizer(stripBulkPatchIdentityKeysFromUpdates)
    .isObject()
    .custom(bulkPatchUpdatesShape), (0, express_validator_1.body)('updates.allowedDocument').optional().isInt({ min: 0 }).toInt(), (0, express_validator_1.body)('updates.sampleDocumentUrl').optional({ nullable: true }).isURL(), (0, express_validator_1.body)('updates.importantNote').optional({ nullable: true }).isString().trim().isLength({ max: 2000 }), (0, express_validator_1.body)('updates.format').optional().customSanitizer(normalizeToArray).isArray().custom(formatArrayValidator), (0, express_validator_1.body)('updates.state').optional().isIn(checklistDocument_1.CHECKLIST_DOCUMENT_STATES), validate, checklistDocumentsController_1.bulkUpdateChecklistDocuments);
// ── Collection routes ─────────────────────────────────────────────────────────
router.get('/', (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(), (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(), (0, express_validator_1.query)('state').optional().isIn(checklistDocument_1.CHECKLIST_DOCUMENT_STATES), (0, express_validator_1.query)('visaServiceType').optional().isIn(checklistDocument_1.VISA_SERVICE_TYPE_VALUES), (0, express_validator_1.query)('category').optional().isString().trim().isLength({ min: 1, max: 200 }), (0, express_validator_1.query)('documentType').optional().isString().trim().isLength({ min: 1, max: 200 }), (0, express_validator_1.query)('search').optional().isString().trim().isLength({ min: 1, max: 100 }), (0, express_validator_1.query)('sortBy').optional().isString().trim().isLength({ min: 1, max: 50 }), (0, express_validator_1.query)('sortOrder').optional().isIn(['asc', 'desc']), validate, checklistDocumentsController_1.listChecklistDocuments);
router.post('/', upload.single('sampleDocument'), (0, express_validator_1.body)('category').isString().trim().isLength({ min: 1, max: 200 }), (0, express_validator_1.body)('documentType').isString().trim().isLength({ min: 1, max: 200 }), (0, express_validator_1.body)('allowedDocument').isInt({ min: 0 }).toInt(), (0, express_validator_1.body)('sampleDocumentUrl').optional({ nullable: true }).isURL(), (0, express_validator_1.body)('importantNote').optional({ nullable: true }).isString().trim().isLength({ max: 2000 }), (0, express_validator_1.body)('format').optional().customSanitizer(normalizeToArray).isArray().custom(formatArrayValidator), (0, express_validator_1.body)('visaServiceType').isIn(checklistDocument_1.VISA_SERVICE_TYPE_VALUES), (0, express_validator_1.body)('state').optional().isIn(checklistDocument_1.CHECKLIST_DOCUMENT_STATES), validate, checklistDocumentsController_1.createChecklistDocument);
// ── Single-document routes ────────────────────────────────────────────────────
router.get('/:id', (0, express_validator_1.param)('id').isString().trim().isLength({ min: 1 }), validate, checklistDocumentsController_1.getChecklistDocumentById);
router.patch('/:id', upload.single('sampleDocument'), (0, express_validator_1.param)('id').isString().trim().isLength({ min: 1 }), (0, express_validator_1.body)('category').optional().isString().trim().isLength({ min: 1, max: 200 }), (0, express_validator_1.body)('documentType').optional().isString().trim().isLength({ min: 1, max: 200 }), (0, express_validator_1.body)('allowedDocument').optional().isInt({ min: 0 }).toInt(), (0, express_validator_1.body)('sampleDocumentUrl').optional({ nullable: true }).isURL(), (0, express_validator_1.body)('importantNote').optional({ nullable: true }).isString().trim().isLength({ max: 2000 }), (0, express_validator_1.body)('format').optional().customSanitizer(normalizeToArray).isArray().custom(formatArrayValidator), (0, express_validator_1.body)('visaServiceType').optional().isIn(checklistDocument_1.VISA_SERVICE_TYPE_VALUES), (0, express_validator_1.body)('state').optional().isIn(checklistDocument_1.CHECKLIST_DOCUMENT_STATES), validate, checklistDocumentsController_1.updateChecklistDocument);
router.patch('/:id/state', (0, express_validator_1.param)('id').isString().trim().isLength({ min: 1 }), (0, express_validator_1.body)('state').isIn(checklistDocument_1.CHECKLIST_DOCUMENT_STATES), validate, checklistDocumentsController_1.updateChecklistDocumentState);
router.delete('/:id', (0, express_validator_1.param)('id').isString().trim().isLength({ min: 1 }), validate, checklistDocumentsController_1.deleteChecklistDocument);
// Multer and other upload errors
router.use((err, _req, res, _next) => {
    if (err?.name === 'MulterError' || err?.message?.startsWith('Unsupported file type')) {
        res.status(400).json({ status: 'fail', message: err.message });
        return;
    }
    res.status(500).json({ status: 'error', message: err.message || 'Internal server error' });
});
module.exports = router;
