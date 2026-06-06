import { Router, type NextFunction, type Request, type Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { protect } from '../../middleware/clerk/clerkAuth';
import { RECORD_TYPES } from '../../models/adminApprovalRequest.model';
import {
  TASK_LINK_TYPES,
  TASK_SORT_FIELDS,
  TASK_SORT_ORDERS,
  TASK_STATUSES,
  FOLLOWUP_SOURCES,
} from '../../constants/applicationTask';
import {
  createStaffTask,
  deleteStaffTask,
  getStaffTask,
  listStaffTasks,
  patchStaffTask,
  patchStaffTaskStatus,
  sendTaskFollowUpNow,
} from '../../controllers/tasks/applicationTaskController';

const { restrictToAdmin } = require('../../controllers/zohoDmsAuthController');

const router: Router = Router();

const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ status: 'fail', message: 'Validation failed', errors: errors.array() });
    return;
  }
  next();
};

router.use(
  ...protect,
  restrictToAdmin as (req: Request, res: Response, next: NextFunction) => void
);

router.get(
  '/',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(TASK_STATUSES as unknown as string[]),
  query('recordType').optional().isIn(RECORD_TYPES as unknown as string[]),
  query('sortBy').optional().isIn(TASK_SORT_FIELDS as unknown as string[]),
  query('sortOrder').optional().isIn(TASK_SORT_ORDERS as unknown as string[]),
  validate,
  listStaffTasks
);

router.post(
  '/',
  body('leadId').isString().trim().notEmpty(),
  body('title').isString().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().isString().isLength({ max: 5000 }),
  body('recordType').optional().isIn(RECORD_TYPES as unknown as string[]),
  body('status').optional().isIn(TASK_STATUSES as unknown as string[]),
  body('date').optional().isISO8601(),
  body('scheduledFrom').optional().isISO8601(),
  body('scheduledTo').optional().isISO8601(),
  body('links').optional().isArray(),
  body('links.*.url').optional().isURL(),
  body('links.*.label').optional().isString().isLength({ max: 200 }),
  body('links.*.type').optional().isIn(TASK_LINK_TYPES as unknown as string[]),
  validate,
  createStaffTask
);

router.get(
  '/:taskId',
  param('taskId').isMongoId(),
  validate,
  getStaffTask
);

router.patch(
  '/:taskId',
  param('taskId').isMongoId(),
  body('title').optional().isString().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().isString().isLength({ max: 5000 }),
  body('date').optional({ nullable: true }).isISO8601(),
  body('scheduledFrom').optional({ nullable: true }).isISO8601(),
  body('scheduledTo').optional({ nullable: true }).isISO8601(),
  body('links').optional().isArray(),
  validate,
  patchStaffTask
);

router.patch(
  '/:taskId/status',
  param('taskId').isMongoId(),
  body('status').isIn(TASK_STATUSES as unknown as string[]),
  validate,
  patchStaffTaskStatus
);

router.delete(
  '/:taskId',
  param('taskId').isMongoId(),
  validate,
  deleteStaffTask
);

router.post(
  '/:taskId/follow-ups/send-now',
  param('taskId').isMongoId(),
  body('source').isIn(FOLLOWUP_SOURCES as unknown as string[]),
  body('message').optional().isString().isLength({ max: 500 }),
  validate,
  sendTaskFollowUpNow
);

export default router;
