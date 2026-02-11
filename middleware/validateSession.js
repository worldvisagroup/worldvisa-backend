const Sentry = require("@sentry/node");
const Session = require('../models/session');

async function validateSession(req, res, next) {
  return Sentry.startSpan({ name: 'auth.validateSession.middleware', op: 'middleware' }, async () => {
    const sessionId = req.cookies.worldvisa_session;

    if (!sessionId) {
      Sentry.logger.warn('Session validation failed', { reason: 'no_session' });
      return res.status(401).json({ error: 'No session' });
    }

    const session = await Session.findOne({
      sessionId,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      Sentry.logger.warn('Session validation failed', { reason: 'invalid_or_expired_session' });
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    session.lastAccessedAt = new Date();
    await session.save();

    req.session = session;
    req.user = {
      id: session.userId,
      role: session.role,
      userType: session.userType
    };

    next();
  });
}

module.exports = validateSession;