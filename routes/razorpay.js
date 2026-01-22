const express = require("express");
const app = express();
const paymentLinkController = require("../controllers/razorpayPaymentLink");

app.post("/paymentLink", paymentLinkController.getPaymentLinkResp);

module.exports = app;
