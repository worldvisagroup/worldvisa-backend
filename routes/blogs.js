const express = require("express");
const blogsController = require("../controllers/blogsController");

const app = express();

app.get("/", blogsController.getAllBlogs);

app.get("/drafts", blogsController.getDraftsCount);

app.get("/search", blogsController.searchBlog);

app.get("/:title", blogsController.getBlogByTitle);

app.post("/", blogsController.createBlog);

app.put("/:id", blogsController.updateBlog);

app.delete("/:id", blogsController.deleteBlog);


module.exports = app;
