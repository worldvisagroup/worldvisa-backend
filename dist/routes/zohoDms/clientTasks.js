"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const clerkAuth_1 = require("../../middleware/clerk/clerkAuth");
const applicationTask_1 = require("../../constants/applicationTask");
const applicationTaskController_1 = require("../../controllers/tasks/applicationTaskController");
const router = (0, express_1.Router)();
const validate = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ status: 'fail', message: 'Validation failed', errors: errors.array() });
        return;
    }
    next();
};
router.get('/tasks', ...clerkAuth_1.protectClient, (0, express_validator_1.query)('page').optional().isInt({ min: 1 }), (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }), (0, express_validator_1.query)('status').optional().isIn(applicationTask_1.TASK_STATUSES.filter((s) => s !== 'cancelled')), (0, express_validator_1.query)('sortBy').optional().isIn(applicationTask_1.TASK_SORT_FIELDS), (0, express_validator_1.query)('sortOrder').optional().isIn(applicationTask_1.TASK_SORT_ORDERS), validate, applicationTaskController_1.listClientTasks);
router.get('/tasks/:taskId', ...clerkAuth_1.protectClient, (0, express_validator_1.param)('taskId').isMongoId(), validate, applicationTaskController_1.getClientTask);
exports.default = router;
