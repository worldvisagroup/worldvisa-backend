const Sentry = require("@sentry/node");
const Session = require('../models/session');

async function validateSession(req, res, next) {
  return Sentry.startSpan({ name: 'auth.validateSession.middleware', op: 'middleware' }, async () => {
    const cookieName = process.env.SESSION_COOKIE_NAME || 'worldvisa_session';
    const sessionId = req.cookies[cookieName];

    if (!sessionId) {
      Sentry.logger.warn('Session validation failed', {
        reason: 'no_session',
        cookieName,
        availableCookies: Object.keys(req.cookies),
        host: req.get('host')
      });
      return res.status(401).json({ error: 'No session' });
    }

    const session = await Session.findOne({
      sessionId,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      Sentry.logger.warn('Session validation failed', {
        reason: 'invalid_or_expired_session',
        sessionId,
        cookieName,
        currentTime: new Date().toISOString()
      });
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const now = new Date();
    session.lastAccessedAt = now;

    // Extend expiry: Add SESSION_EXPIRY_DAYS to current time (sliding window)
    const expiryDays = parseInt(process.env.SESSION_EXPIRY_DAYS) || 7;
    session.expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);

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