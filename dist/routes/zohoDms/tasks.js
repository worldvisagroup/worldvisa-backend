"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const clerkAuth_1 = require("../../middleware/clerk/clerkAuth");
const adminApprovalRequest_model_1 = require("../../models/adminApprovalRequest.model");
const applicationTask_1 = require("../../constants/applicationTask");
const applicationTaskController_1 = require("../../controllers/tasks/applicationTaskController");
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
router.use(...clerkAuth_1.protect, restrictToAdmin);
router.get('/', (0, express_validator_1.query)('page').optional().isInt({ min: 1 }), (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }), (0, express_validator_1.query)('status').optional().isIn(applicationTask_1.TASK_STATUSES), (0, express_validator_1.query)('recordType').optional().isIn(adminApprovalRequest_model_1.RECORD_TYPES), (0, express_validator_1.query)('sortBy').optional().isIn(applicationTask_1.TASK_SORT_FIELDS), (0, express_validator_1.query)('sortOrder').optional().isIn(applicationTask_1.TASK_SORT_ORDERS), validate, applicationTaskController_1.listStaffTasks);
router.post('/', (0, express_validator_1.body)('leadId').isString().trim().notEmpty(), (0, express_validator_1.body)('title').isString().trim().isLength({ min: 1, max: 200 }), (0, express_validator_1.body)('description').optional().isString().isLength({ max: 5000 }), (0, express_validator_1.body)('recordType').optional().isIn(adminApprovalRequest_model_1.RECORD_TYPES), (0, express_validator_1.body)('status').optional().isIn(applicationTask_1.TASK_STATUSES), (0, express_validator_1.body)('date').optional().isISO8601(), (0, express_validator_1.body)('scheduledFrom').optional().isISO8601(), (0, express_validator_1.body)('scheduledTo').optional().isISO8601(), (0, express_validator_1.body)('links').optional().isArray(), (0, express_validator_1.body)('links.*.url').optional().isURL(), (0, express_validator_1.body)('links.*.label').optional().isString().isLength({ max: 200 }), (0, express_validator_1.body)('links.*.type').optional().isIn(applicationTask_1.TASK_LINK_TYPES), validate, applicationTaskController_1.createStaffTask);
router.get('/:taskId', (0, express_validator_1.param)('taskId').isMongoId(), validate, applicationTaskController_1.getStaffTask);
router.patch('/:taskId', (0, express_validator_1.param)('taskId').isMongoId(), (0, express_validator_1.body)('title').optional().isString().trim().isLength({ min: 1, max: 200 }), (0, express_validator_1.body)('description').optional().isString().isLength({ max: 5000 }), (0, express_validator_1.body)('date').optional({ nullable: true }).isISO8601(), (0, express_validator_1.body)('scheduledFrom').optional({ nullable: true }).isISO8601(), (0, express_validator_1.body)('scheduledTo').optional({ nullable: true }).isISO8601(), (0, express_validator_1.body)('links').optional().isArray(), validate, applicationTaskController_1.patchStaffTask);
router.patch('/:taskId/status', (0, express_validator_1.param)('taskId').isMongoId(), (0, express_validator_1.body)('status').isIn(applicationTask_1.TASK_STATUSES), validate, applicationTaskController_1.patchStaffTaskStatus);
router.delete('/:taskId', (0, express_validator_1.param)('taskId').isMongoId(), validate, applicationTaskController_1.deleteStaffTask);
router.post('/:taskId/follow-ups/send-now', (0, express_validator_1.param)('taskId').isMongoId(), (0, express_validator_1.body)('source').isIn(applicationTask_1.FOLLOWUP_SOURCES), (0, express_validator_1.body)('message').optional().isString().isLength({ max: 500 }), validate, applicationTaskController_1.sendTaskFollowUpNow);
exports.default = router;
