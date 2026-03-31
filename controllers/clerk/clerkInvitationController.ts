import { Request, Response } from 'express';
import { inviteExistingUser, createAndInviteNewUser, revokeClerkInvitation, inviteExistingClient, bootstrapFirstStaffInvitation } from '../../services/clerk/clerkInvitationService';
import { NEW_ADMIN_TYPE, STAFF_ROLES, isValidStaffRole } from '../../constants/roles';

export const inviteUser = async (req: Request, res: Response): Promise<void> => {
  const { email, role, type, username } = req.body as { email?: string; role?: string; type?: string; username?: string };

  if (!email || typeof email !== 'string') {
    res.status(400).json({ status: 'fail', message: 'email is required' });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    if (type === NEW_ADMIN_TYPE) {
      if (!isValidStaffRole(role)) {
        res.status(400).json({
          status: 'fail',
          message: `role is required for new users. Valid values: ${STAFF_ROLES.join(', ')}`,
        });
        return;
      }
      if (!username || typeof username !== 'string') {
        res.status(400).json({ status: 'fail', message: 'username is required for new users' });
        return;
      }
      const data = await createAndInviteNewUser(normalizedEmail, role, username.trim());
      res.status(201).json({ status: 'success', data });
    } else {
      const data = await inviteExistingUser(normalizedEmail);
      res.status(200).json({ status: 'success', data });
    }
  } catch (err: any) {
    res.status(err.status ?? 500).json({ status: 'fail', message: err.message });
  }
};

export const bootstrapInviteUser = async (req: Request, res: Response): Promise<void> => {
  const { email, role, username } = req.body as { email?: string; role?: string; username?: string };
  const bootstrapToken = req.headers['x-bootstrap-token'] as string | undefined;

  if (!email || typeof email !== 'string') {
    res.status(400).json({ status: 'fail', message: 'email is required' });
    return;
  }
  if (!isValidStaffRole(role)) {
    res.status(400).json({
      status: 'fail',
      message: `role is required. Valid values: ${STAFF_ROLES.join(', ')}`,
    });
    return;
  }
  if (!username || typeof username !== 'string') {
    res.status(400).json({ status: 'fail', message: 'username is required' });
    return;
  }

  try {
    const data = await bootstrapFirstStaffInvitation({
      email: email.toLowerCase().trim(),
      role,
      username: username.trim(),
      bootstrapToken,
    });
    res.status(201).json({ status: 'success', data });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ status: 'fail', message: err.message });
  }
};

export const inviteClient = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email?: string };

  if (!email || typeof email !== 'string') {
    res.status(400).json({ status: 'fail', message: 'email is required' });
    return;
  }

  try {
    const data = await inviteExistingClient(email.toLowerCase().trim());
    res.status(200).json({ status: 'success', data });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ status: 'fail', message: err.message });
  }
};

export const revokeInvitation = async (req: Request, res: Response): Promise<void> => {
  const { invitationId } = req.query as { invitationId?: string };

  if (!invitationId) {
    res.status(400).json({ status: 'fail', message: 'invitationId query param is required' });
    return;
  }

  try {
    await revokeClerkInvitation(invitationId);
    res.status(200).json({ status: 'success' });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ status: 'fail', message: err.message });
  }
};
