import { Request, Response } from 'express';
import { McubeOutboundRequest } from '../../types/mcube';
import { initiateOutboundCall } from '../../services/mcube/mcubeOutboundService';

const logger = require('../../utils/logger');

export async function handleOutboundCall(req: Request, res: Response): Promise<void> {
  const { exenumber, custnumber, refurl, refid } = req.body as McubeOutboundRequest;

  if (!exenumber || !custnumber) {
    res.status(400).json({ error: 'exenumber and custnumber are required' });
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
