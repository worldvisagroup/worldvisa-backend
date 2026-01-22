const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const blogSchema = new Schema(
  {
    id: String,
    title: {
      type: String,
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      required: true
    },
    url: {
      type: String,
      required: true,
      unique: true,
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
      required: true,
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

const Blog = mongoose.model("Blog", blogSchema);
module.exports = Blog;
