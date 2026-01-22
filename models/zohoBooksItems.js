const mongoose = require('mongoose');

const ZohoBooksItemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true
  },
  itemDescription: {
    type: String,
    required: true
  },
  itemId: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  service: {
    type: String,
    required: true
  },
  addOn: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const ZohoBooksItem = mongoose.model('ZohoBooksItem', ZohoBooksItemSchema);

module.exports = ZohoBooksItem;
