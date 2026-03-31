"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadSpouseActivityLogPdf = exports.downloadVisaActivityLogPdf = void 0;
const activityLogPdfService_1 = require("../services/activityLogPdfService");
const ApplicationActivityLog = require('../models/applicationActivityLog');
const DmsZohoClient = require('../models/dmsZohoClient');
const logger = require('../utils/logger');
// ─── Shared PDF logic ─────────────────────────────────────────────────────────
async function sendActivityLogPdf(res, leadId, filename, recordType) {
    const [client, logs, logoDataUri] = await Promise.all([
        DmsZohoClient.findOne({ lead_id: leadId })
            .select('name')
            .lean(),
        (ApplicationActivityLog.find({ lead_id: leadId })
            .sort({ createdAt: -1 })
            .lean()),
        (0, activityLogPdfService_1.fetchLogoAsBase64)(),
    ]);
    if (!client) {
        res.status(404).json({ status: 'fail', message: 'Client not found' });
        return;
    }
    const dayGroups = (0, activityLogPdfService_1.groupByDay)(logs);
    const totalEntries = logs.length;
    const html = (0, activityLogPdfService_1.buildActivityLogHtml)({
        clientName: client.name,
        recordType,
        generatedAt: new Date(),
        dayGroups,
        logoDataUri,
        totalEntries,
    });
    let pdfBuffer;
    try {
        pdfBuffer = await (0, activityLogPdfService_1.generateActivityLogPdf)(html);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : '';
        if (message.includes('Chrome executable path not found') || message.includes('Chrome executable not found')) {
            res.status(503).json({
                status: 'error',
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
const downloadVisaActivityLogPdf = async (req, res) => {
    const leadId = req.params.id;
    try {
        const client = await DmsZohoClient.findOne({ lead_id: leadId })
            .select('name')
            .lean();
        const clientName = client?.name ?? 'Client';
        const filename = `${clientName} - Visa Application Activity Logs.pdf`;
        await sendActivityLogPdf(res, leadId, filename, 'visa_application');
    }
    catch (err) {
        logger.error('[ActivityLogPdf] Failed to generate visa activity log PDF', {
            error: err instanceof Error ? err.message : err,
            leadId,
        });
        res.status(500).json({ status: 'error', message: 'Failed to generate activity log PDF' });
    }
};
exports.downloadVisaActivityLogPdf = downloadVisaActivityLogPdf;
const downloadSpouseActivityLogPdf = async (req, res) => {
    const leadId = req.params.id;
    try {
        const client = await DmsZohoClient.findOne({ lead_id: leadId })
            .select('name')
            .lean();
        const clientName = client?.name ?? 'Client';
        const filename = `${clientName} - Spouse Skill Assessment Application Activity Logs.pdf`;
        await sendActivityLogPdf(res, leadId, filename, 'spouse_skill_assessment');
    }
    catch (err) {
        logger.error('[ActivityLogPdf] Failed to generate spouse activity log PDF', {
            error: err instanceof Error ? err.message : err,
            leadId,
        });
        res.status(500).json({ status: 'error', message: 'Failed to generate activity log PDF' });
    }
};
exports.downloadSpouseActivityLogPdf = downloadSpouseActivityLogPdf;
