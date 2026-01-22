const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
  country: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  subtitle: {
    type: String,
    required: false
  },
  tags: {
    type: [String],
    required: true,
    default: []
  },
  shortDescription: {
    type: String,
    required: false
  },
  longDescription: {
    type: String,
    required: false
  },
  type: {
    type: String,
    enum: ['pr', 'tourist', 'work', 'study'],
    required: true
  },
  tiers: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'ZohoBooksItem',
    required: true
  },
  addOns: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'ZohoBooksItem',
    required: true
  },
  benefits: {
    type: [String],
    required: false,
    default: []
  },
  validity: {
    type: {
      period: {
        type: String,
      },
      entryType: {
        type: String,
      },
      lengthOfStay: {
        type: String,
      }
    }
  },
}, {
  timestamps: true
});

const Packages = mongoose.model('Packages', PackageSchema);

module.exports = Packages;