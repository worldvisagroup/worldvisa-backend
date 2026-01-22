const express = require("express");
const app = express();

const jobsController = require("../controllers/jobsController");

app.post("/", jobsController.getAllJobs);

app.post("/worth", jobsController.getJobsWorth);

module.exports = app;
