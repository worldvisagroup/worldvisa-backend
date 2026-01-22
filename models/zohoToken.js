const mongoose = require('mongoose');

const zohoTokenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    default: 'zoho_token',
  },
  accessToken: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String,
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

zohoTokenSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const ZohoToken = mongoose.model('ZohoToken', zohoTokenSchema);

module.exports = ZohoToken;
