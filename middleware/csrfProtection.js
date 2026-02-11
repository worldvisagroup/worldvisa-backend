const Sentry = require("@sentry/node");

function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'];

  if (!req.session || req.session.csrfToken !== csrfToken) {
    Sentry.logger.warn('CSRF validation failed');
    return res.status(403).json({ error: 'CSRF token invalid' });
  }

  next();
}

module.exports = csrfProtection;