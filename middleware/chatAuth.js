const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const ZohoDmsUser = require('../models/zohoDmsUser');
const DmsZohoClient = require('../models/dmsZohoClient');

/**
 * Unified chat auth: accepts either admin JWT or client JWT.
 * Sets req.chatActor = { type: 'staff'|'client', id: ObjectId } and req.user (full doc).
 */
async function chatAuth(req, res, next) {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ status: 'fail', message: 'You are not logged in. Please log in to get access.' });
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    if (decoded.role === 'client') {
      const client = await DmsZohoClient.findById(decoded.id);
      if (!client) {
        return res.status(401).json({ status: 'fail', message: 'The client belonging to this token no longer exists.' });
      }
      req.user = client;
      req.chatActor = { type: 'client', id: client._id };
      return next();
    }

    const user = await ZohoDmsUser.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ status: 'fail', message: 'The user belonging to this token no longer exists.' });
    }
    req.user = user;
    req.chatActor = { type: 'staff', id: user._id };
    next();
  } catch (err) {
    return res.status(401).json({ status: 'fail', message: 'Invalid token. Please log in again.' });
  }
}

module.exports = { chatAuth };
