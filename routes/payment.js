const express = require("express");
const app = express();
const paymentController = require("../controllers/paymentController");
require("dotenv").config();

app.post("/orders", paymentController.createPaymentOrder);

app.post("/success", paymentController.paymentSuccess);

module.exports = app;
