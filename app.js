require("./instrument.js");
const Sentry = require("@sentry/node");
const express = require("express");
const app = express();
const axios = require("axios");
const helperFunctions = require("./utils/helperFunction");
const http = require('http');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const cookieParser = require('cookie-parser');
const validateSession = require('./middleware/validateSession');
const csrfProtection = require('./middleware/csrfProtection');
const { extractClientIP } = require('./utils/session');

const server = http.createServer(app);
const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');

var cors = require("cors");
require("dotenv").config();

const blogsRouter = require("./routes/blogs");
const newsRouter = require("./routes/news");
const visaNewsRouter = require("./routes/visaNews");
const paymentRouter = require("./routes/payment");
const leadsRouter = require("./routes/leads");
const eligibilityRouter = require("./routes/eligibilityRouter");
const taskRouter = require("./routes/tasks");
const jobsRouter = require("./routes/jobs");
const mcubeWatiRouter = require("./routes/mcubeWati");
const reviewsRouter = require("./routes/reviews");
const zohoDmsAuthRouter = require("./routes/zohoDms/auth");
const zohoDmsVisaApplicationsRouter = require("./routes/zohoDms/visaApplications");
const zohoDmsUserAuthRouter = require('./routes/zohoDmsAuth');
const zohoDmsClientAuthRouter = require("./routes/dmsZohoClients");
const technicalAssessmentRouter = require("./routes/ai/technicalAssessment");
const packagesRouter = require("./routes/packages");
const travelBudget = require("./routes/ai/travelBudget");

const currecyController = require("./routes/currency");
const razorpayController = require("./routes/razorpay");

const visaReferenceFormController = require("./routes/visaReferenceForm");

const pdfRoutes = require('./routes/worldvisa2.0/pdf/pdf.routes');
const meetingRouter = require('./routes/worldvisa2.0/meeting/meeting.routes');

// Visa News Cron Job
const visaNewsCron = require("./utils/visaNewsCron");
let aiJobOpportunitiesRouter = null;
try {
  if (process.env.OPENAI_API_KEY) {
    aiJobOpportunitiesRouter = require("./routes/ai/generatejobopportunities");
    console.log("AI Job Opportunities router loaded successfully");
  } else {
    console.warn("OPENAI_API_KEY not found - AI Job Opportunities router disabled");
  }
} catch (error) {
  console.error("Failed to load AI Job Opportunities router:", error);
}

const apiKeyMiddleware = helperFunctions.apiKeyMiddleware;
const mcubeApiKeyMiddleware = helperFunctions.mcubeApiKeyMiddleware;

const mongoose = require("mongoose");
const fetchToken = helperFunctions.fetchToken;
const { getRedisStatus } = require("./services/redis");

// Sentry error handler
Sentry.setupExpressErrorHandler(app);

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception - Application will exit', {
    error: error.message,
    stack: error.stack,
    name: error.name,
  });
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection - Application will continue', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: promise.toString(),
  });
});

// MongoDB connection event handlers
mongoose.connection.on('connected', () => {
  dbConnected = true;
  console.log('✅ MongoDB connected successfully');
  logger.info('MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  dbConnected = false;
  console.error('❌ MongoDB connection error:', err);
  logger.error('MongoDB connection error', { error: err.message });
});

mongoose.connection.on('disconnected', () => {
  dbConnected = false;
  console.log('⚠️  MongoDB disconnected');
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  dbConnected = true;
  console.log('🔄 MongoDB reconnected');
  logger.info('MongoDB reconnected');
});

app.use(helmet({
  contentSecurityPolicy: false, // Needed for PDF generation
}));

// Rate limiting for PDF generation
const pdfRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 30 : 100, // More lenient in development
  message: { 
    error: 'Too many PDF generation requests',
    message: 'You have exceeded the rate limit for PDF generation. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded for PDF generation', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      error: 'Too many PDF generation requests',
      message: 'You have exceeded the rate limit for PDF generation. Please try again in 15 minutes.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});


const dbURL = process.env.MONGODB_CONNECTION_STRING;
const PORT = process.env.PORT || 3000;

// Track MongoDB connection status
let dbConnected = false;

// Start server even if DB connection fails initially
// Bind to 0.0.0.0 so reverse proxies (Dokploy/Traefik, etc.) can reach the app in containers
// Heroku and other platforms work the same; no impact on existing deployments
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
  logger.info('Server started', { port: PORT, host: '0.0.0.0', dbConnected: false });
});

// Attempt MongoDB connection with retry logic
mongoose
  .connect(dbURL, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,

    maxPoolSize: 10,
    minPoolSize: 5,
    maxIdleTimeMS: 30000,

    retryWrites: true,
    retryReads: true,

    bufferCommands: false,
  })
  .then((result) => {
    dbConnected = true;
    console.log("Connected to db");
    logger.info('MongoDB connected successfully');

    // Start visa news cron job after successful DB connection
    try {
      visaNewsCron.startCronJob();
    } catch (error) {
      logger.error("Failed to start visa news cron job", { error: error.message });
    }
  })
  .catch((err) => {
    dbConnected = false;
    logger.error("Database connection error - server will continue without DB", {
      error: err.message,
      name: err.name,
      code: err.code,
    });
    console.error("Database connection error:", err.message);
    console.log("Server will continue running. Health checks will show unhealthy status.");
    
    // Don't exit - allow server to run and report unhealthy status via health checks
    // Mongoose will automatically retry connection in the background
  });

const io = new Server(server, {
  cors: {
    origin: [
      'https://dms.worldvisagroup.com',
      'https://admin.worldvisa-api.cloud',
      'https://backend.worldvisa-api.cloud',
      'http://localhost:3000',
      'http://localhost:3002'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.userId = decoded.id; //mongo db id
    return next();
  } catch (e) {
    return next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  if (socket.userId) {
    socket.join(`user:${socket.userId}`)
  }

  socket.on('disconnect', () => {
    console.log(`User disconnected with socket.id: ${socket.id}`);
  });
});

app.set('io', io);

app.use(express.json({ limit: '10mb' })); // Large payload for report data
app.use(compression());
app.use(express.urlencoded({ extended: true }));

// Trust proxy for containerized deployment (Dokploy, Traefik, etc.)
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// Cookie parser for session management
app.use(cookieParser(process.env.SESSION_SECRET));

app.use(cors({
  origin: [
    'https://worldvisagroup.com',
    'https://dms.worldvisagroup.com',
    'https://new.worldvisagroup.com',
    'https://admin.worldvisa-api.cloud',
    'https://backend.worldvisa-api.cloud',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'api-key', 'x-api-token', 'x-api-key', 'drafts', 'x-user-role'],
  credentials: true
}));

app.options('*', (req, res) => {
  res.status(200).end();
});

// Logging middleware (skip /health to avoid log noise from probes)
app.use((req, res, next) => {
  if (req.path === '/health') return next();
  console.log(`API Call: ${req.method} ${req.originalUrl}`);
  console.log('content-type:', req.headers['content-type']);
  console.log('origin:', req.headers['origin']);
  console.log('referer:', req.headers['referer']);
  next();
});

app.get("/", async (req, res) => {
  res.send("API is working!");
});

// Liveness/readiness for Dokploy, load balancers, k8s. Always 200 when process is up.
// Includes database status for ops visibility; app runs without DB so we never fail health.
app.get("/health", (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: dbConnected ? 'connected' : 'disconnected',
    redis: getRedisStatus(),
  });
});

app.get("/ipinfo", async (req, res) => {
  const ip = req.query.ip;
  try {
    const response = await axios.get(`http://ipinfo.io/${ip}?token=${process.env.IP_INFO_KEY}`);
    res.json(response.data);
  } catch (error) {
    res.json({ status: "failed" })
  }
});


app.use("/blogs", blogsRouter);

app.use("/news", newsRouter);

app.use("/api/visa-news", apiKeyMiddleware, visaNewsRouter);

app.use("/payment", paymentRouter);

app.use("/leads", leadsRouter);

app.use("/eligibility", eligibilityRouter);

app.use("/tasks", taskRouter);

app.use("/jobs", apiKeyMiddleware, jobsRouter);

app.use("/currency", apiKeyMiddleware, currecyController);

app.use("/razorpay", razorpayController);

app.use("/wati", mcubeApiKeyMiddleware, mcubeWatiRouter);

app.use("/reviews", apiKeyMiddleware, reviewsRouter);

app.use("/visa_reference_form", visaReferenceFormController);

// Zoho DMS

app.use("/api/zoho_dms/oauth", zohoDmsAuthRouter);

app.use("/api/zoho_dms/visa_applications", zohoDmsVisaApplicationsRouter);

app.use('/api/zoho_dms/users', zohoDmsUserAuthRouter);

app.use('/api/zoho_dms/clients', zohoDmsClientAuthRouter);

// Technical Assessment
app.use('/api/ai/technical-assessment', technicalAssessmentRouter);

app.use('/api/ai/travel-budget', travelBudget);

// PDF Parser
const pdfParserRouter = require('./routes/pdfParser');
app.use('/api/parse-pdf', pdfParserRouter);

// Packages
app.use('/api/packages', apiKeyMiddleware, packagesRouter);


if (aiJobOpportunitiesRouter) {
  app.use("/api/ai/generatejobopportunities", aiJobOpportunitiesRouter);
}

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX_REQUESTS = 20;

app.use('/api/ai/*', (req, res, next) => {
  const clientIP = extractClientIP(req); // Use proper IP extraction for rate limiting
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  if (!rateLimitMap.has(clientIP)) {
    rateLimitMap.set(clientIP, []);
  }

  const requests = rateLimitMap.get(clientIP);
  const validRequests = requests.filter(timestamp => timestamp > windowStart);

  if (validRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((validRequests[0] + RATE_LIMIT_WINDOW - now) / 1000)
    });
  }

  validRequests.push(now);
  rateLimitMap.set(clientIP, validRequests);
  next();
});

app.post("/webhook", (req, res) => {
  const webhookData = req.body;
  console.log("Webhook data received:", webhookData);
  res.status(200).send("Webhook data received");
});

// PDF generation routes
app.use('/api/worldvisaV2/global-assessment-report', pdfRateLimiter, pdfRoutes);

// Meeting booking routes
// Note: Webhook endpoint is public (secured by HMAC signature), main endpoint requires API key
app.use('/api/worldvisaV2/schedule-meeting', meetingRouter);
