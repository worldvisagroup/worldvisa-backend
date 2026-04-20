import { Request, Response } from 'express';

const ZohoDmsUser = require('../../models/zohoDmsUser');
const logger      = require('../../utils/logger');

export async function listLeadOwners(req: Request, res: Response): Promise<void> {
  try {
    const users = await ZohoDmsUser
      .find({ account_status: 'active', role: 'admin' })
      .select('_id username email agent_number mcube_username role')
      .lean();

    res.status(200).json({
      status:  'success',
      results: users.length,
      data:    { leadOwners: users },
    });
  } catch (err: any) {
    logger.error('[MCube] listLeadOwners failed', { error: err.message });
    res.status(500).json({ status: 'error', message: 'Failed to fetch lead owners' });
  }
}
