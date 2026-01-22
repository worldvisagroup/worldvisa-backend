const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const visaNewsSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true, // Index for faster queries
    },
    visaType: {
      type: String,
      enum: [
        "STUDENT",
        "WORK",
        "TOURIST",
        "PR", // Permanent Residence
        "BUSINESS",
        "FAMILY",
        "SKILLED",
        "GENERAL",
      ],
      default: "GENERAL",
      index: true, // Index for faster queries
    },
    source: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    publishedAt: {
      type: Date,
      required: true,
      index: true, // Index for sorting by date
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    author: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    language: {
      type: String,
      default: "en",
      trim: true,
    },
    // Additional metadata
    keywords: [String],
    
    // To track if article is active/archived
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Compound index to prevent duplicates based on title + source
visaNewsSchema.index({ title: 1, source: 1 }, { unique: true });

// Compound index for efficient filtering
visaNewsSchema.index({ country: 1, visaType: 1, publishedAt: -1 });

// Text index for search functionality
visaNewsSchema.index({ title: "text", description: "text" });

// Method to check if article is older than specified days
visaNewsSchema.methods.isOlderThan = function (days) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return this.publishedAt < cutoffDate;
};

// Static method to find news by country and visa type
visaNewsSchema.statics.findByCountryAndType = function (
  country,
  visaType,
  limit = 10
) {
  const query = { isActive: true };
  if (country) query.country = country.toUpperCase();
  if (visaType) query.visaType = visaType.toUpperCase();

  return this.find(query)
    .sort({ publishedAt: -1 })
    .limit(limit);
};

// Static method to delete old articles
visaNewsSchema.statics.deleteOldArticles = async function (days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const result = await this.deleteMany({
    publishedAt: { $lt: cutoffDate },
  });

  return result;
};

const VisaNews = mongoose.model("VisaNews", visaNewsSchema);

module.exports = VisaNews;

