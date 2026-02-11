const crypto = require('crypto');

function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

function extractClientIP(req) {
  // Fix IPv6/IPv4 rate limiting issue
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.ip || 'unknown';
}

module.exports = {
  generateSessionId,
  generateCSRFToken,
  extractClientIP
};