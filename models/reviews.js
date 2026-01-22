const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewSchema = new Schema(
  {
    id: String,
    review: {
      type: String,
      required: true
    },
    review_date: {
      type: Date,
      default: Date.now
    },
    source: String,
    source_link: String,
    image_reference: Boolean,
    link_reference: Boolean,
    service: String,
    country: String,
    visa: String,
    user_name: String,
    user_occupation: String,
    user_image: String,
    ratings: Number,
    application_handled_by: String,
    isPublished: Boolean,
  },
  { timestamps: true }
);

const Reviews = mongoose.model("Reviews", reviewSchema);
module.exports = Reviews;
