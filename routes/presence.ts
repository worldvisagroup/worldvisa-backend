import { Router, Request, Response } from 'express';
import { clerkProtect } from '../middleware/clerk/clerkAuth';
import { getBulkPresence } from '../services/presenceService';

const router: Router = Router();

/**
 * POST /api/zoho_dms/presence/bulk
 *
 * Fetch current presence for a list of user IDs in a single request.
 * Intended for initial page loads before the WebSocket connection is established.
 *
 * Body:  { userIds: string[] }
 * Returns: { status: 'success', data: { presences: Record<userId, { status, lastSeen }> } }
 */
router.post('/bulk', clerkProtect, async (req: Request, res: Response) => {
  try {
    const { userIds } = req.body as { userIds?: unknown };

    if (!Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({ status: 'fail', message: 'userIds must be a non-empty array' });
      return;
    }

    const capped = (userIds as string[]).slice(0, 100);
    const presences = await getBulkPresence(capped);

    res.status(200).json({ status: 'success', data: { presences } });
  } catch (err: any) {
    res.status(500).json({ status: 'fail', message: err.message || 'Failed to fetch presence' });
  }
});

export default router;
