"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const backend_1 = require("@clerk/backend");
const clerkClient = (0, backend_1.createClerkClient)({ secretKey: process.env.CLERK_SECRET_KEY });
exports.default = clerkClient;
