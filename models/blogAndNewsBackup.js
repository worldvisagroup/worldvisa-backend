const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const blogAndNewsSchema = new Schema(
  {
    id: String,
    title: {
      type: String,
    },
    url: {
      type: String,
    },
    description: {
      type: String,
    },
    image: {
      type: String,
    },
    views: String,
    author: String,
    blog: {
      type: String,
    },
    tags: [String],
    tableOfContents: [
      {
        id: String,
        level: Number,
        textContent: String,
      },
    ],
    isPublished: Boolean,
  },
  { timestamps: true }
);

const BlogAndNewsBackup = mongoose.model("BlogAndNewsBackup", blogAndNewsSchema);
module.exports = BlogAndNewsBackup;
