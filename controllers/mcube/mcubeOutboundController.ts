import { Request, Response } from 'express';
import { initiateOutboundCall } from '../../services/mcube/mcubeOutboundService';

const logger = require('../../utils/logger');

export async function handleOutboundCall(req: Request, res: Response): Promise<void> {
  const user     = (req as any).user;
  const exenumber = user?.agent_number as string | undefined;

  if (!exenumber) {
    res.status(400).json({ error: 'agent_number is not configured on your profile. Contact an administrator.' });
    return;
  }

  const { custnumber, refurl, refid } = req.body as { custnumber: string; refurl?: string | number; refid?: string };

  if (!custnumber) {
    res.status(400).json({ error: 'custnumber is required' });
    return;
  }

  try {
    await initiateOutboundCall({ exenumber, custnumber, refurl, refid });
    res.status(200).json({ success: true });
  } catch (err: any) {
    logger.error('[MCube] Outbound call failed', {
      exenumber,
      custnumber,
      error: err.message,
    });
    res.status(502).json({ error: 'Failed to initiate call', detail: err.message });
  }
}
