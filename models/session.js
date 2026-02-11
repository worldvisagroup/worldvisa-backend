const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    userType: { type: String, enum: ['admin', 'client'], required: true },
    role: { type: String, required: true },
    csrfToken: { type: String, required: true },
    ipAddress: String,
    userAgent: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    lastAccessedAt: { type: Date, default: Date.now }
  });

const Session = mongoose.model('Session', SessionSchema);

module.exports = Session;