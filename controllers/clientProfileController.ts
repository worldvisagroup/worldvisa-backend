import { Request, Response } from 'express';
import {
  UpdateClientProfileBody,
  ALLOWED_PROFILE_FIELDS,
  PROFILE_PROJECTION,
} from '../types/clientProfile.types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const DmsZohoClient = require('../models/dmsZohoClient');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { addActivityLog } = require('./helper/service/activityLog');

// ─── GET /clients/profile/:lead_id ────────────────────────────────────────────

export const getClientProfile = async (req: Request, res: Response): Promise<void> => {
  const { lead_id } = req.params;

  if (!lead_id) {
    res.status(400).json({ status: 'fail', message: 'lead_id is required' });
    return;
  }

  try {
    const profile = await DmsZohoClient.findOne({ lead_id }, PROFILE_PROJECTION).lean();

    if (!profile) {
      res.status(404).json({ status: 'fail', message: 'Client not found' });
      return;
    }

    res.status(200).json({ status: 'success', data: { profile } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ status: 'error', message });
  }
};

// ─── PATCH /clients/profile/:lead_id ──────────────────────────────────────────

export const updateClientProfile = async (req: Request, res: Response): Promise<void> => {
  const { lead_id } = req.params;

  if (!lead_id) {
    res.status(400).json({ status: 'fail', message: 'lead_id is required' });
    return;
  }

  // Whitelist: only pick recognised fields, drop everything else
  const body = req.body as Record<string, unknown>;
  const updates: Partial<UpdateClientProfileBody> = {};

  for (const field of ALLOWED_PROFILE_FIELDS) {
    if (field in body && body[field] !== undefined) {
      (updates as Record<string, unknown>)[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({
      status: 'fail',
      message: `No valid fields to update. Allowed fields: ${ALLOWED_PROFILE_FIELDS.join(', ')}`,
    });
    return;
  }

  // Validate string fields are non-empty when provided
  for (const [key, value] of Object.entries(updates)) {
    if (typeof value === 'string' && value.trim() === '') {
      res.status(400).json({
        status: 'fail',
        message: `Field '${key}' cannot be an empty string`,
      });
      return;
    }
    if (typeof value === 'string') {
      (updates as Record<string, unknown>)[key] = value.trim();
    }
  }

  try {
    // Unique email check — only when email is being changed
    if (updates.email) {
      const emailConflict = await DmsZohoClient.findOne(
        { email: updates.email.toLowerCase(), lead_id: { $ne: lead_id } },
        { _id: 1 },
      ).lean();

      if (emailConflict) {
        res.status(409).json({
          status: 'fail',
          code: 'EMAIL_ALREADY_EXISTS',
          field: 'email',
          message: 'An account with this email already exists',
        });
        return;
      }

      updates.email = updates.email.toLowerCase();
    }

    const updated = await DmsZohoClient.findOneAndUpdate(
      { lead_id },
      { $set: updates },
      { new: true, runValidators: true, projection: PROFILE_PROJECTION },
    ).lean();

    if (!updated) {
      res.status(404).json({ status: 'fail', message: 'Client not found' });
      return;
    }

    // Fire-and-forget activity log
    const actor = req.user as Record<string, unknown> | undefined;
    addActivityLog({
      lead_id,
      activity_type: 'profile_updated',
      summary: `Client profile updated. Fields: ${Object.keys(updates).join(', ')}`,
      actor_type: 'staff',
      actor_name: (actor?.name as string) ?? (actor?.username as string) ?? 'Unknown',
      actor_role: req.clerkRole ?? (actor?.role as string) ?? null,
      metadata: { updatedFields: Object.keys(updates) },
    });

    res.status(200).json({ status: 'success', data: { profile: updated } });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000) {
      res.status(409).json({
        status: 'fail',
        code: 'DUPLICATE_KEY',
        message: 'A client with one of the provided unique values already exists',
      });
      return;
    }

    if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'CastError') {
      res.status(400).json({ status: 'fail', message: 'Invalid field value provided' });
      return;
    }

    const message = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ status: 'error', message });
  }
};
