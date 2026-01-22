const express = require("express");
const app = express();

const tasksController = require("../controllers/tasksController");

app.post("/", tasksController.createCallTask);

module.exports = app;
