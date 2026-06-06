import { Router, type NextFunction, type Request, type Response } from 'express';
import { param, query, validationResult } from 'express-validator';
import { protectClient } from '../../middleware/clerk/clerkAuth';
import {
  TASK_SORT_FIELDS,
  TASK_SORT_ORDERS,
  TASK_STATUSES,
} from '../../constants/applicationTask';
import {
  getClientTask,
  listClientTasks,
} from '../../controllers/tasks/applicationTaskController';

const router: Router = Router();

const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ status: 'fail', message: 'Validation failed', errors: errors.array() });
    return;
  }
  next();
};

router.get(
  '/tasks',
  ...protectClient,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(TASK_STATUSES.filter((s) => s !== 'cancelled') as unknown as string[]),
  query('sortBy').optional().isIn(TASK_SORT_FIELDS as unknown as string[]),
  query('sortOrder').optional().isIn(TASK_SORT_ORDERS as unknown as string[]),
  validate,
  listClientTasks
);

router.get(
  '/tasks/:taskId',
  ...protectClient,
  param('taskId').isMongoId(),
  validate,
  getClientTask
);

export default router;
