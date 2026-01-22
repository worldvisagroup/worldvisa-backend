const express = require("express");
const app = express();

const leadsController = require("../controllers/leadControllerNew");
const assessmentReportController = require("../controllers/assessmentReportController");

app.post("/", leadsController.createLeads);

app.post("/work", assessmentReportController.sendAssessmentReport);

app.post("/work/visa", assessmentReportController.sendAssessmentReportWithPdf);

module.exports = app;
