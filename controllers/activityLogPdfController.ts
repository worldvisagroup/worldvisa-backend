import { Request, Response } from 'express';
import type { ActivityLogEntry } from '../types/visaApplication.types';
import {
  fetchLogoAsBase64,
  groupByDay,
  buildActivityLogHtml,
  generateActivityLogPdf,
} from '../services/activityLogPdfService';

const ApplicationActivityLog = require('../models/applicationActivityLog') as unknown as import('mongoose').Model<import('mongoose').Document>;
const DmsZohoClient          = require('../models/dmsZohoClient')          as unknown as import('mongoose').Model<import('mongoose').Document>;
const logger = require('../utils/logger') as {
  error: (msg: string, ctx?: unknown) => void;
};

// ─── Shared PDF logic ─────────────────────────────────────────────────────────

async function sendActivityLogPdf(
  res: Response,
  leadId: string,
  filename: string,
  recordType: 'visa_application' | 'spouse_skill_assessment',
): Promise<void> {
  const [client, logs, logoDataUri] = await Promise.all([
    DmsZohoClient.findOne({ lead_id: leadId })
      .select('name')
      .lean() as Promise<{ name: string } | null>,
    (ApplicationActivityLog.find({ lead_id: leadId })
      .sort({ createdAt: -1 })
      .lean()) as unknown as Promise<ActivityLogEntry[]>,
    fetchLogoAsBase64(),
  ]);

  if (!client) {
    res.status(404).json({ status: 'fail', message: 'Client not found' });
    return;
  }

  const dayGroups    = groupByDay(logs);
  const totalEntries = logs.length;

  const html = buildActivityLogHtml({
    clientName: client.name,
    recordType,
    generatedAt: new Date(),
    dayGroups,
    logoDataUri,
    totalEntries,
  });

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generateActivityLogPdf(html);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('Chrome executable path not found') || message.includes('Chrome executable not found')) {
      res.status(503).json({
        status:  'error',
        message: 'PDF generation is not available in this environment. Chrome is not configured.',
      });
      return;
    }
    throw err;
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
  res.setHeader('Content-Length', pdfBuffer.length);
  res.send(pdfBuffer);
}

// ─── Controllers ──────────────────────────────────────────────────────────────

export const downloadVisaActivityLogPdf = async (req: Request, res: Response): Promise<void> => {
  const leadId = req.params.id as string;
  try {
    const client = await DmsZohoClient.findOne({ lead_id: leadId })
      .select('name')
      .lean() as { name: string } | null;

    const clientName = client?.name ?? 'Client';
    const filename   = `${clientName} - Visa Application Activity Logs.pdf`;

    await sendActivityLogPdf(res, leadId, filename, 'visa_application');
  } catch (err: unknown) {
    logger.error('[ActivityLogPdf] Failed to generate visa activity log PDF', {
      error:  err instanceof Error ? err.message : err,
      leadId,
    });
    res.status(500).json({ status: 'error', message: 'Failed to generate activity log PDF' });
  }
};

export const downloadSpouseActivityLogPdf = async (req: Request, res: Response): Promise<void> => {
  const leadId = req.params.id as string;
  try {
    const client = await DmsZohoClient.findOne({ lead_id: leadId })
      .select('name')
      .lean() as { name: string } | null;

    const clientName = client?.name ?? 'Client';
    const filename   = `${clientName} - Spouse Skill Assessment Application Activity Logs.pdf`;

    await sendActivityLogPdf(res, leadId, filename, 'spouse_skill_assessment');
  } catch (err: unknown) {
    logger.error('[ActivityLogPdf] Failed to generate spouse activity log PDF', {
      error:  err instanceof Error ? err.message : err,
      leadId,
    });
    res.status(500).json({ status: 'error', message: 'Failed to generate activity log PDF' });
  }
};
