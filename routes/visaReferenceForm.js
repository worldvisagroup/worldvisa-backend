const express = require("express");
const app = express();

const referenceController = require("../controllers/VisaReferenceForm");

app.post("/", referenceController.referenceForm);

module.exports = app;
