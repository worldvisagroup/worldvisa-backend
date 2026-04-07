"use strict";
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const clerkAuth_1 = require("../../middleware/clerk/clerkAuth");
const checklistDocument_1 = require("../../constants/checklistDocument");
const checklistDocumentsController_1 = require("../../controllers/checklist/checklistDocumentsController");
const { restrictToAdmin } = require('../../controllers/zohoDmsAuthController');
const router = (0, express_1.Router)();
const validate = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ status: 'fail', message: 'Validation failed', errors: errors.array() });
        return;
    }
    next();
};
const formatArrayValidator = (arr) => arr.every((v) => typeof v === 'string' && v.length <= 50);
router.use(...clerkAuth_1.protect, restrictToAdmin);
// ── Static / derived routes (must be before /:id) ────────────────────────────
router.get('/visa-service-types', (_req, res) => {
    res.status(200).json({ status: 'success', data: { visaServiceTypes: checklistDocument_1.VISA_SERVICE_TYPE_VALUES } });
});
router.get('/summary', checklistDocumentsController_1.getChecklistDocumentsSummary);
router.get('/categories', (0, express_validator_1.query)('visaServiceType').optional().isIn(checklistDocument_1.VISA_SERVICE_TYPE_VALUES), (0, express_validator_1.query)('state').optional().isIn(checklistDocument_1.CHECKLIST_DOCUMENT_STATES), validate, checklistDocumentsController_1.listChecklistCategories);
router.get('/grouped', (0, express_validator_1.query)('visaServiceType').optional().isIn(checklistDocument_1.VISA_SERVICE_TYPE_VALUES), (0, express_validator_1.query)('state').optional().isIn(checklistDocument_1.CHECKLIST_DOCUMENT_STATES), validate, checklistDocumentsController_1.listChecklistDocumentsGrouped);
// ── Bulk routes (must be before /:id) ────────────────────────────────────────
router.post('/bulk', (0, express_validator_1.body)('category').isString().trim().isLength({ min: 1, max: 200 }), (0, express_validator_1.body)('documentType').isString().trim().isLength({ min: 1, max: 200 }), (0, express_validator_1.body)('allowedDocument').isInt({ min: 0 }).toInt(), (0, express_validator_1.body)('sampleDocumentUrl').optional({ nullable: true }).isURL(), (0, express_validator_1.body)('importantNote').optional({ nullable: true }).isString().trim().isLength({ max: 2000 }), (0, express_validator_1.body)('format').optional().isArray().custom(formatArrayValidator), (0, express_validator_1.body)('state').optional().isIn(checklistDocument_1.CHECKLIST_DOCUMENT_STATES), validate, checklistDocumentsController_1.bulkCreateChecklistDocuments);
router.patch('/bulk', (0, express_validator_1.body)('category').isString().trim().isLength({ min: 1, max: 200 }), (0, express_validator_1.body)('documentType').isString().trim().isLength({ min: 1, max: 200 }), (0, express_validator_1.body)('updates').isObject(), (0, express_validator_1.body)('updates.allowedDocument').optional().isInt({ min: 0 }).toInt(), (0, express_validator_1.body)('updates.sampleDocumentUrl').optional({ nullable: true }).isURL(), (0, express_validator_1.body)('updates.importantNote').optional({ nullable: true }).isString().trim().isLength({ max: 2000 }), (0, express_validator_1.body)('updates.format').optional().isArray().custom(formatArrayValidator), (0, express_validator_1.body)('updates.state').optional().isIn(checklistDocument_1.CHECKLIST_DOCUMENT_STATES), validate, checklistDocumentsController_1.bulkUpdateChecklistDocuments);
// ── Collection routes ─────────────────────────────────────────────────────────
router.get('/', (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(), (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(), (0, express_validator_1.query)('state').optional().isIn(checklistDocument_1.CHECKLIST_DOCUMENT_STATES), (0, express_validator_1.query)('visaServiceType').optional().isIn(checklistDocument_1.VISA_SERVICE_TYPE_VALUES), (0, express_validator_1.query)('category').optional().isString().trim().isLength({ min: 1, max: 200 }), (0, express_validator_1.query)('documentType').optional().isString().trim().isLength({ min: 1, max: 200 }), (0, express_validator_1.query)('search').optional().isString().trim().isLength({ min: 1, max: 100 }), (0, express_validator_1.query)('sortBy').optional().isString().trim().isLength({ min: 1, max: 50 }), (0, express_validator_1.query)('sortOrder').optional().isIn(['asc', 'desc']), validate, checklistDocumentsController_1.listChecklistDocuments);
router.post('/', (0, express_validator_1.body)('category').isString().trim().isLength({ min: 1, max: 200 }), (0, express_validator_1.body)('documentType').isString().trim().isLength({ min: 1, max: 200 }), (0, express_validator_1.body)('allowedDocument').isInt({ min: 0 }).toInt(), (0, express_validator_1.body)('sampleDocumentUrl').optional({ nullable: true }).isURL(), (0, express_validator_1.body)('importantNote').optional({ nullable: true }).isString().trim().isLength({ max: 2000 }), (0, express_validator_1.body)('format').optional().isArray().custom(formatArrayValidator), (0, express_validator_1.body)('visaServiceType').isIn(checklistDocument_1.VISA_SERVICE_TYPE_VALUES), (0, express_validator_1.body)('state').optional().isIn(checklistDocument_1.CHECKLIST_DOCUMENT_STATES), validate, checklistDocumentsController_1.createChecklistDocument);
// ── Single-document routes ────────────────────────────────────────────────────
router.get('/:id', (0, express_validator_1.param)('id').isString().trim().isLength({ min: 1 }), validate, checklistDocumentsController_1.getChecklistDocumentById);
router.patch('/:id', (0, express_validator_1.param)('id').isString().trim().isLength({ min: 1 }), (0, express_validator_1.body)('category').optional().isString().trim().isLength({ min: 1, max: 200 }), (0, express_validator_1.body)('documentType').optional().isString().trim().isLength({ min: 1, max: 200 }), (0, express_validator_1.body)('allowedDocument').optional().isInt({ min: 0 }).toInt(), (0, express_validator_1.body)('sampleDocumentUrl').optional({ nullable: true }).isURL(), (0, express_validator_1.body)('importantNote').optional({ nullable: true }).isString().trim().isLength({ max: 2000 }), (0, express_validator_1.body)('format').optional().isArray().custom(formatArrayValidator), (0, express_validator_1.body)('visaServiceType').optional().isIn(checklistDocument_1.VISA_SERVICE_TYPE_VALUES), (0, express_validator_1.body)('state').optional().isIn(checklistDocument_1.CHECKLIST_DOCUMENT_STATES), validate, checklistDocumentsController_1.updateChecklistDocument);
router.patch('/:id/state', (0, express_validator_1.param)('id').isString().trim().isLength({ min: 1 }), (0, express_validator_1.body)('state').isIn(checklistDocument_1.CHECKLIST_DOCUMENT_STATES), validate, checklistDocumentsController_1.updateChecklistDocumentState);
router.delete('/:id', (0, express_validator_1.param)('id').isString().trim().isLength({ min: 1 }), validate, checklistDocumentsController_1.deleteChecklistDocument);
module.exports = router;
