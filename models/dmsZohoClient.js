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
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false, // Do not send back in query results
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
    enum: ['visa_application', 'spouse_skill_assessment'], // Restricting the values to specific options
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
});

// Hash password before saving
dmsZohoClientSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method to check if password is correct
dmsZohoClientSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const DmsZohoClient = mongoose.model('DmsZohoClient', dmsZohoClientSchema);

module.exports = DmsZohoClient;
