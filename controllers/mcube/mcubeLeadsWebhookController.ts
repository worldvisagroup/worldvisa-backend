import { Request, Response } from 'express';
import McubeInboundLeadLog from '../../models/mcubeInboundLeadLog.model';
import {
  createLead,
  getRecordById,
  searchRecordByPhone,
  updateRecord,
} from '../../services/zohoLeadService';
import { McubeInboundLeadsPayload } from '../../types/mcube';

const logger = require('../../utils/logger');

/**
 * Returns today's date in 'YYYY-MM-DD' formatted for Zoho CRM date fields (IST timezone).
 */
function getTodayDateIST(): string {
  const now = new Date();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffsetMs);
  return istDate.toISOString().slice(0, 10);
}

/**
 * Check if a field value is blank (undefined, null, or empty string).
 */
function isBlank(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

/**
 * Type guard to validate whether the incoming request body satisfies McubeInboundLeadsPayload
 * with mandatory: event ('callstarted' | 'callended'), countryCode, customerNumber, callType.
 */
function isValidPayload(body: any): body is McubeInboundLeadsPayload {
  if (!body || typeof body !== 'object') return false;
  if (body.event !== 'callstarted' && body.event !== 'callended') return false;
  if (typeof body.countryCode !== 'string' || body.countryCode.trim() === '') return false;
  if (typeof body.customerNumber !== 'string' || body.customerNumber.trim() === '') return false;
  if (typeof body.callType !== 'string' || body.callType.trim() === '') return false;
  return true;
}

/**
 * Helper to persist incoming webhook payload and processing result to MongoDB.
 */
async function saveWebhookLog(data: {
  event: string;
  callType?: string;
  customerNumber: string;
  countryCode?: string;
  customerName?: string;
  action: 'created' | 'updated' | 'logged' | 'ignored' | 'failed';
  zohoModule?: string | null;
  zohoRecordId?: string | null;
  leadSource?: string | null;
  updatedFields?: string[];
  payload: any;
  zohoResponse?: any;
  errorMessage?: string | null;
}): Promise<void> {
  try {
    await McubeInboundLeadLog.create(data);
  } catch (err: any) {
    logger.error('[MCube Leads Webhook] Failed to save webhook log to MongoDB', { error: err.message });
  }
}

/**
 * Webhook handler for MCube inbound calls -> Zoho CRM Leads integration.
 * Endpoint: POST /api/mcube/webhook/inbound-leads
 */
export async function handleInboundLeadsWebhook(req: Request, res: Response): Promise<void> {
  const payload = req.body;

  // Strict runtime type validation: event, countryCode, customerNumber, and callType are mandatory
  if (!isValidPayload(payload)) {
    logger.warn('[MCube Leads Webhook] Invalid payload — mandatory fields missing or invalid', {
      body: req.body,
    });
    res.status(400).json({
      error: 'Invalid payload',
      message: 'Mandatory fields: event ("callstarted" | "callended"), countryCode (string), customerNumber (string), callType (string)',
    });
    return;
  }

  const { event, countryCode, customerNumber, callType } = payload;
  const cleanCountryCode = countryCode.trim();
  const cleanNumber = customerNumber.replace(/[^\d]/g, '');

  if (!cleanNumber) {
    logger.warn('[MCube Leads Webhook] customerNumber contains no digits', { customerNumber });
    res.status(400).json({ error: 'Invalid customerNumber — must contain digits' });
    return;
  }

  // Filter non-inbound calls (case-insensitive)
  if (callType.toLowerCase() !== 'inbound') {
    logger.info('[MCube Leads Webhook] Event: Not an inbound call', {
      customerNumber: cleanNumber,
      countryCode: cleanCountryCode,
      callType,
      startTime: payload.startTime,
      did: payload.did,
      agent: payload.agent,
    });

    await saveWebhookLog({
      event,
      callType,
      customerNumber: cleanNumber,
      countryCode: cleanCountryCode,
      customerName: payload.customerName,
      action: 'ignored',
      payload: req.body,
    });

    res.status(200).json({ success: true, message: 'Not an inbound call — no action needed' });
    return;
  }

  // ── Event: callstarted ──────────────────────────────────────────────────────────
  if (event === 'callstarted') {
    logger.info('[MCube Leads Webhook] Event: callstarted received', {
      customerNumber: cleanNumber,
      countryCode: cleanCountryCode,
      callType,
      startTime: payload.startTime,
      did: payload.did,
      agent: payload.agent,
    });

    await saveWebhookLog({
      event: 'callstarted',
      callType,
      customerNumber: cleanNumber,
      countryCode: cleanCountryCode,
      customerName: payload.customerName,
      action: 'logged',
      payload: req.body,
    });

    res.status(200).json({ success: true, message: 'Call started logged' });
    return;
  }

  // ── Event: callended (TypeScript discriminates event to 'callended') ─────────────
  const customerName = payload.customerName?.trim() ?? '';
  const region = payload.region?.trim() ?? '';

  const utmSource = payload.utm_source?.trim() ?? '';
  const utmMedium = payload.utm_medium?.trim() ?? '';
  const utmCampaign = payload.utm_campaign?.trim() ?? '';
  const utmTerm = payload.utm_term?.trim() ?? '';
  const gclid = payload.gclid?.trim() ?? '';

  const hasUtm = Boolean(utmSource || utmMedium || utmCampaign || gclid || utmTerm);
  const leadSource = hasUtm ? 'IVR - Google' : 'IVR- Website';
  const todayDate = getTodayDateIST();

  try {
    // Step 1: Check if number exists in Zoho (Leads scope, then Contacts scope)
    let existingRecord = await searchRecordByPhone('Leads', cleanNumber);
    let targetModule: 'Leads' | 'Contacts' = 'Leads';

    if (!existingRecord) {
      const existingContact = await searchRecordByPhone('Contacts', cleanNumber);
      if (existingContact) {
        existingRecord = existingContact;
        targetModule = 'Contacts';
      }
    }

    // Step 2A: Record exists → Update fields
    if (existingRecord) {
      const recordId = String(existingRecord.id);
      const fullRecord = (await getRecordById(targetModule, recordId)) || existingRecord;

      const updateFields: Record<string, any> = {};

      // Only fill fields that are currently blank
      if (isBlank(fullRecord.UTM_Campaign_Name) && utmCampaign) updateFields.UTM_Campaign_Name = utmCampaign;
      if (isBlank(fullRecord.UTM_Term) && utmTerm) updateFields.UTM_Term = utmTerm;
      if (isBlank(fullRecord.UTM_Lead_Source) && utmSource) updateFields.UTM_Lead_Source = utmSource;
      if (isBlank(fullRecord.UTM_Medium) && utmMedium) updateFields.UTM_Medium = utmMedium;
      if (isBlank(fullRecord.GCLID) && gclid) updateFields.GCLID = gclid;
      if (isBlank(fullRecord.Country_Code)) updateFields.Country_Code = cleanCountryCode;
      if (isBlank(fullRecord.Lead_Originated_Region) && region) updateFields.Lead_Originated_Region = region;

      // Overwrite Lead_Source
      updateFields.Lead_Source = leadSource;

      // Update Re_Contacted_Date
      updateFields.Re_Contacted_Date = todayDate;

      // Increment Call_Count
      const currentCallCount = Number(fullRecord.Call_Count) || 0;
      updateFields.Call_Count = currentCallCount + 1;

      const result = await updateRecord(targetModule, recordId, updateFields);

      logger.info(`[MCube Leads Webhook] Successfully updated existing ${targetModule} record`, {
        id: recordId,
        phone: cleanNumber,
        countryCode: cleanCountryCode,
        leadSource,
        newCallCount: updateFields.Call_Count,
        updatedFields: Object.keys(updateFields),
      });

      // Persist to MongoDB for historical tracking
      await saveWebhookLog({
        event: 'callended',
        callType,
        customerNumber: cleanNumber,
        countryCode: cleanCountryCode,
        customerName,
        action: 'updated',
        zohoModule: targetModule,
        zohoRecordId: recordId,
        leadSource,
        updatedFields: Object.keys(updateFields),
        payload: req.body,
        zohoResponse: result,
      });

      res.status(200).json({
        success: true,
        action: 'updated',
        module: targetModule,
        recordId,
        updatedFields: Object.keys(updateFields),
        result,
      });
      return;
    }

    // Step 2B: Record does NOT exist → Create a new Lead
    const newLeadData: Record<string, any> = {
      Last_Name: customerName.length > 0 ? customerName : `Ivr-${cleanNumber}`,
      Email: `${cleanNumber}@gmail.com`,
      Company: 'Individual',
      Phone: cleanNumber,
      Mobile: cleanNumber,
      Country_Code: cleanCountryCode,
      Lead_Source: leadSource,
      Lead_Status: 'New',
      Call_Count: 1,
      Re_Contacted_Date: todayDate,
    };

    if (region) newLeadData.Lead_Originated_Region = region;
    if (utmCampaign) newLeadData.UTM_Campaign_Name = utmCampaign;
    if (utmTerm) newLeadData.UTM_Term = utmTerm;
    if (utmSource) newLeadData.UTM_Lead_Source = utmSource;
    if (utmMedium) newLeadData.UTM_Medium = utmMedium;
    if (gclid) newLeadData.GCLID = gclid;

    const createResult = await createLead(newLeadData);
    const createdId = createResult?.details?.id || createResult?.id || null;

    logger.info('[MCube Leads Webhook] Successfully created new Lead in Zoho', {
      createdId,
      phone: cleanNumber,
      countryCode: cleanCountryCode,
      leadSource,
    });

    // Persist to MongoDB for historical tracking
    await saveWebhookLog({
      event: 'callended',
      callType,
      customerNumber: cleanNumber,
      countryCode: cleanCountryCode,
      customerName,
      action: 'created',
      zohoModule: 'Leads',
      zohoRecordId: createdId,
      leadSource,
      payload: req.body,
      zohoResponse: createResult,
    });

    res.status(200).json({
      success: true,
      action: 'created',
      module: 'Leads',
      recordId: createdId,
      leadData: newLeadData,
      result: createResult,
    });
    return;
  } catch (err: any) {
    logger.error('[MCube Leads Webhook] Error processing callended event in Zoho CRM', {
      customerNumber: cleanNumber,
      countryCode: cleanCountryCode,
      error: err.message,
      details: err.response?.data,
    });

    // Persist failure to MongoDB for auditing
    await saveWebhookLog({
      event: 'callended',
      callType,
      customerNumber: cleanNumber,
      countryCode: cleanCountryCode,
      customerName,
      action: 'failed',
      payload: req.body,
      errorMessage: err.message,
      zohoResponse: err.response?.data,
    });

    res.status(500).json({
      error: 'Failed to process lead in Zoho CRM',
      message: err.message,
    });
    return;
  }
}
