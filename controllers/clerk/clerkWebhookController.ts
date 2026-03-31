import { Request, Response } from 'express';
import { Webhook } from 'svix';
import { CLERK_WEBHOOK_EVENTS, WEBHOOK_ERRORS } from '../../constants/clerk';
import { syncUserOnCreated, syncUserOnUpdated, syncUserOnDeleted } from '../../services/clerk/clerkWebhookService';
import type { ClerkWebhookEvent, ClerkUserPayload, ClerkDeletedPayload } from '../../types/clerk.types';

const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET ?? '';

export const handleClerkWebhook = async (req: Request, res: Response): Promise<void> => {
  const svixId = req.headers['svix-id'] as string | undefined;
  const svixTimestamp = req.headers['svix-timestamp'] as string | undefined;
  const svixSignature = req.headers['svix-signature'] as string | undefined;

  if (!svixId || !svixTimestamp || !svixSignature) {
    res.status(400).json({ status: 'fail', message: WEBHOOK_ERRORS.MISSING_HEADERS });
    return;
  }

  let event: ClerkWebhookEvent;
  try {
    const wh = new Webhook(CLERK_WEBHOOK_SECRET);
    event = wh.verify(req.body as string, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    res.status(400).json({ status: 'fail', message: WEBHOOK_ERRORS.INVALID_SIGNATURE });
    return;
  }

  try {
    switch (event.type) {
      case CLERK_WEBHOOK_EVENTS.USER_CREATED: {
        const result = await syncUserOnCreated(event.data as ClerkUserPayload);
        res.status(200).json({ status: 'success', data: result });
        break;
      }
      case CLERK_WEBHOOK_EVENTS.USER_UPDATED: {
        const result = await syncUserOnUpdated(event.data as ClerkUserPayload);
        res.status(200).json({ status: 'success', data: result });
        break;
      }
      case CLERK_WEBHOOK_EVENTS.USER_DELETED: {
        const result = await syncUserOnDeleted((event.data as ClerkDeletedPayload).id);
        res.status(200).json({ status: 'success', data: result });
        break;
      }
      default:
        res.status(200).json({ status: 'success', ignored: true, type: event.type });
    }
  } catch (err: any) {
    res.status(err.status ?? 500).json({ status: 'fail', message: err.message });
  }
};
