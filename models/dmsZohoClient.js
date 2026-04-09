const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const dmsZohoClientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    unique: false,
    trim: true,
  },
  password: {
    type: String,
    minlength: 6,
    select: false,
  },
  password_value: String,
  lead_id: {
    type: String,
    required: [true, 'Please provide a lead_id'],
    unique: true,
    minlength: 18
  },
  lead_owner: {
    type: String,
    required: [true, 'Please provide a lead owner'],
  },
  record_type: {
    type: String,
    required: [true, 'Please provide a record type'],
    enum: ['visa_application', 'spouse_skill_assessment'],
  },
  checklist: [
    {
      document_type: {
        type: String,
        required: [true, 'Please provide a document type'],
      },
      document_category: {
        type: String,
        required: [true, 'Please provide a document category'],
      },
      required: {
        type: Boolean,
        required: [true, 'Please specify if the document is required'],
      },
      instructions: {
        type: String,
      },
      description: String
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
  notes: [
    {
      note: {
        type: String,
        required: [true, 'Please provide note text'],
        trim: true,
        maxlength: [2000, 'Note cannot exceed 2000 characters'],
      },
      addedBy: {
        type: String,
        required: [true, 'Please provide who added the note'],
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  deadline_extensions: [
    {
      fieldName:     { type: String, required: true },
      previousValue: { type: String, default: null },
      newValue:      { type: String, required: true },
      reason:        { type: String, required: true },
      requestedBy:   { type: String, required: true },
      approvedBy:    { type: String, required: true },
      requestId:     { type: mongoose.Schema.Types.ObjectId, ref: 'AdminApprovalRequest' },
      approvedAt:    { type: Date, default: Date.now },
    },
  ],
  online_status: {
    type: Boolean,
    default: false,
  },
  last_communication_activity: {
    type: Date,
    default: null,
  },
  last_communication_provider: {
    type: String,
    enum: ['chat', 'email'],
    default: null,
  },
  fcmTokens: [
    {
      token:      { type: String, required: true },
      platform:   { type: String, enum: ['mobile', 'desktop', 'web'], required: true },
      userAgent:  { type: String, default: '' },
      createdAt:  { type: Date, default: Date.now },
      updatedAt:  { type: Date, default: Date.now },
      lastUsedAt: { type: Date, default: Date.now },
      isActive:   { type: Boolean, default: true },
    },
  ],
  full_name: {
    type: String,
    default: null,
  },
  clerk_invitation_id: {
    type: String,
    default: null,
  },
  clerk_id: {
    type: String,
    default: null,
  },
  email_verified: {
    type: Boolean,
    default: false,
  },
  profile_image_url: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    enum: ['client', 'master_admin', 'supervisor', 'team_leader', 'admin'],
    default: 'client',
  },
  account_status: {
    type: String,
    enum: ['active', 'invited', 'inactive', 'suspended', 'deleted'],
    default: 'active',
  },
});

dmsZohoClientSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

dmsZohoClientSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

dmsZohoClientSchema.index({ lead_owner: 1 });
dmsZohoClientSchema.index({ created_at: -1 });
dmsZohoClientSchema.index({ name: 'text', email: 'text', phone: 'text', lead_id: 'text' });
dmsZohoClientSchema.index({ name: 1, record_type: 1 });
dmsZohoClientSchema.index({ 'fcmTokens.token': 1 }, { sparse: true });
dmsZohoClientSchema.index({ role: 1 });

const DmsZohoClient = mongoose.model('DmsZohoClient', dmsZohoClientSchema);

module.exports = DmsZohoClient;
