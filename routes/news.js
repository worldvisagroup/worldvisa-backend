const express = require("express");
const newsController = require("../controllers/newsControlller");

const app = express();

app.get("/", newsController.getAllNews);

app.get("/drafts", newsController.getDraftsCount);

app.get("/search", newsController.searchBlog);

app.get("/:title", newsController.getNewsByTitle);

app.post("/", newsController.createNews);

app.put("/:id", newsController.updateNews);

app.delete("/:id", newsController.deleteNews);

module.exports = app;
