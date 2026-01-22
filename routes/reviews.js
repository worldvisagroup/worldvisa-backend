const express = require("express");
const reviewsController = require("../controllers/ReviewsController");
const app = express();

app.get("/", reviewsController.getAllReviews);

app.get("/total", reviewsController.aggregateReviews);

app.post("/", reviewsController.createReview);

app.put("/:id", reviewsController.updateReview);

app.delete("/:id", reviewsController.deleteReview);

module.exports = app;
