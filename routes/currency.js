const express = require("express");
const app = express();

const currencyController = require("../controllers/currencyController");

app.get("/", currencyController.getCurrency);

module.exports = app;
