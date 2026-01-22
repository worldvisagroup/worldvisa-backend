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
    select: false, // Do not include password in query results by default
  },
  passwordVal: {
    type: String,
    select: true, // Do not include passwordVal in query results by default
  },
  role: {
    type: String,
    enum: ['master_admin', 'supervisor', 'team_leader', 'admin'],
    required: [true, 'Please specify a role: admin, master_admin or team_leader'],
  },
});

// Hash password before saving
zohoDmsUserSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  next();
});

// Method to check if candidate password is correct
zohoDmsUserSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const ZohoDmsUser = mongoose.model('ZohoDmsUser', zohoDmsUserSchema);

module.exports = ZohoDmsUser;
