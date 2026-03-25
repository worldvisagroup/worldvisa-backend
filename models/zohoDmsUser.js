const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const zohoDmsUserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
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
  emailverified: {
    type: Boolean,
    default: false,
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

zohoDmsUserSchema.index({ username: 1 });
zohoDmsUserSchema.index({ role: 1 });

const ZohoDmsUser = mongoose.model('ZohoDmsUser', zohoDmsUserSchema);

module.exports = ZohoDmsUser;
