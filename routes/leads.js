const express = require("express");
const app = express();

const leadsController = require("../controllers/leadsController");

app.post("/", leadsController.createLeads);

app.get("/:id", leadsController.getLeadById);

module.exports = app;
