const express = require("express");
const mcubeWatiController = require("../controllers/mcubeWatiController");
const app = express();

app.post("/sendTemplateMessage", mcubeWatiController.sendWhatsappTemplate);

module.exports = app;
