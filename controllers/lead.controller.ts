import { Request, Response } from 'express';
import {
  captureLandingLead,
  LandingCapturePayload,
  LandingAssessmentPayload,
  updateLandingAssessment,
} from '../services/lead.service';

const logger = require('../utils/logger');

/**
 * Controller: POST /api/leads/landing-capture
 * Stage 1: Captures initial lead before questionnaire.
 */
export async function handleLandingCapture(req: Request, res: Response): Promise<void> {
  const payload = req.body as LandingCapturePayload;

  if (!payload || typeof payload !== 'object') {
    res.status(400).json({
      success: false,
      error: 'Invalid request body — expected JSON object',
    });
    return;
  }

  const email = payload.email?.trim();
  const phone = (payload.phone || payload.nationalNumber || '').trim();

  if (!email || !phone) {
    res.status(400).json({
      success: false,
      error: 'Validation error: both email and phone are mandatory fields',
    });
    return;
  }

  // Basic email regex validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      success: false,
      error: 'Validation error: invalid email format',
    });
    return;
  }

  try {
    const result = await captureLandingLead(payload);
    res.status(result.isNew ? 201 : 200).json(result);
  } catch (err: any) {
    logger.error('[Landing Lead Controller] Error capturing landing lead', {
      error: err.message,
      email: payload.email,
    });
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || 'Internal server error while capturing lead',
    });
  }
}

/**
 * Controller: POST /api/leads/landing-assessment
 * Stage 2: Records applicant questionnaire answers and overall qualification score.
 */
export async function handleLandingAssessment(req: Request, res: Response): Promise<void> {
  const payload = req.body as LandingAssessmentPayload;

  if (!payload || typeof payload !== 'object') {
    res.status(400).json({
      success: false,
      error: 'Invalid request body — expected JSON object',
    });
    return;
  }

  if (!payload.leadId && !payload.email && !payload.phone) {
    res.status(400).json({
      success: false,
      error: 'Validation error: at least one identifier (leadId, email, or phone) is required to record assessment',
    });
    return;
  }

  try {
    const result = await updateLandingAssessment(payload);
    res.status(result.isNew ? 201 : 200).json(result);
  } catch (err: any) {
    logger.error('[Landing Lead Controller] Error updating landing assessment', {
      error: err.message,
      leadId: payload.leadId,
      email: payload.email,
    });
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || 'Internal server error while updating assessment',
    });
  }
}
