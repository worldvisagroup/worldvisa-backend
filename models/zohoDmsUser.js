const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const zohoDmsUserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    sparse: true, 
    lowercase: true,
  },
  password: {
    type: String,
    minlength: 8,
    select: false,
  },
  passwordVal: {
    type: String,
    select: true,
  },
  role: {
    type: String,
    enum: ['master_admin', 'supervisor', 'team_leader', 'admin'],
    required: [true, 'Please specify a role: admin, master_admin or team_leader'],
  },
  last_login: {
    type: Date,
    default: null,
  },
  online_status: {
    type: Boolean,
    default: false,
  },
  email:{
    type: String,
    default: null,
  },
  full_name:{
    type: String,
    default: null,
  },
  account_status:{
    type: String,
    enum: ['active', 'invited', 'inactive', 'suspended', 'deleted'],
    default: 'active',
  },
  ip_restricted: {
    type: Boolean,
    default: false,
  },
  ip_restricted_list: {
    type: [String],
    default: [],
  },
  profile_image_url: {
    type: String,
    default: null,
  },
  clerk_id: {
    type: String,
    default: null,
  },
  clerk_invitation_id: {
    type: String,
    default: null,
  },
  email_verified: {
    type: Boolean,
    default: false,
  },
  agent_number: {
    type: String,
    default: null,
  },
  mcube_username:{
    type: String,
    default: null,
  },
  support_ratio: {
    type: Number,
    default: 100,
    min: 0,
    max: 100,
  },
});

zohoDmsUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

zohoDmsUserSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

zohoDmsUserSchema.index({ username: 1 }, { unique: true, sparse: true });
zohoDmsUserSchema.index({ role: 1 });
zohoDmsUserSchema.index({ agent_number: 1 }, { sparse: true });

const ZohoDmsUser = mongoose.model('ZohoDmsUser', zohoDmsUserSchema);

module.exports = ZohoDmsUser;
