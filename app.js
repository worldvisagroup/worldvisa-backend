const express = require("express");
const app = express();
const axios = require("axios");
const helperFunctions = require("./utils/helperFunction");
const http = require('http');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');

const server = http.createServer(app);
const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');

var cors = require("cors");
require("dotenv").config();

// Import routers
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
const pdfParserRouter = require('./routes/pdfParser');

// Visa News Cron Job
const visaNewsCron = require("./utils/visaNewsCron");

// Conditionally load AI Job Opportunities Router
let aiJobOpportunitiesRouter = null;
try {
  if (process.env.OPENAI_API_KEY) {
    aiJobOpportunitiesRouter = require("./routes/ai/generatejobopportunities");
    console.log("✅ AI Job Opportunities router loaded successfully");
  } else {
    console.warn("⚠️  OPENAI_API_KEY not found - AI Job Opportunities router disabled");
  }
} catch (error) {
  console.error("❌ Failed to load AI Job Opportunities router:", error.message);
}

// Middleware imports
const apiKeyMiddleware = helperFunctions.apiKeyMiddleware;
const mcubeApiKeyMiddleware = helperFunctions.mcubeApiKeyMiddleware;

const mongoose = require("mongoose");
const fetchToken = helperFunctions.fetchToken;
const { getRedisStatus } = require("./services/redis");

// Environment configuration
const dbURL = process.env.MONGODB_CONNECTION_STRING;
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET;

// Validate critical environment variables
if (!JWT_SECRET) {
  console.error("❌ CRITICAL: JWT_SECRET is not defined in environment variables");
  process.exit(1);
}

if (!dbURL) {
  console.error("❌ CRITICAL: MONGODB_CONNECTION_STRING is not defined");
  process.exit(1);
}

// Database connection state
let dbConnected = false;

// Global error handlers
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception - Application will exit', {
    error: error.message,
    stack: error.stack,
    name: error.name,
  });
  
  // Give logger time to write, then exit
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

// Graceful shutdown handler
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  console.log('\n🛑 Received shutdown signal, starting graceful shutdown...');
  
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

// MongoDB connection with retry logic
mongoose.connection.on('connected', () => {
  dbConnected = true;
  console.log('✅ MongoDB connected successfully');
  logger.info('MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  dbConnected = false;
  console.error('❌ MongoDB connection error:', err.message);
  logger.error('MongoDB connection error', { 
    error: err.message,
    code: err.code,
    name: err.name 
  });
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

// Attempt MongoDB connection
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
  .then(() => {
    dbConnected = true;
    console.log("✅ Connected to MongoDB");
    logger.info('MongoDB connected successfully');

    try {
      visaNewsCron.startCronJob();
      console.log("✅ Visa news cron job started");
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
    console.error("❌ Database connection error:", err.message);
    console.log("⚠️  Server will continue running. Health checks will show unhealthy status.");
  });

// Trust proxy configuration
// This ensures Express correctly reads client IPs from proxy headers
// When trust proxy is enabled, req.ip properly handles both IPv4 and IPv6
// and correctly parses X-Forwarded-For headers from reverse proxies
app.set('trust proxy', true);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for PDF generation
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Body parsing and compression
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// CORS configuration
const allowedOrigins = [
  'https://worldvisagroup.com',
  'https://www.worldvisagroup.com',
  'https://dms.worldvisagroup.com',
  'https://new.worldvisagroup.com',
  'https://admin.worldvisa-api.cloud',
  'https://backend.worldvisa-api.cloud',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002'
];

// Add development origins in non-production
if (NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:3003', 'http://127.0.0.1:3000');
}

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Log blocked origins for debugging
      logger.warn('CORS blocked origin', { origin, ip: origin });
      
      // In production, be strict; in development, allow for debugging
      if (NODE_ENV === 'production') {
        callback(new Error('Not allowed by CORS'));
      } else {
        console.log('⚠️  CORS: Allowing non-whitelisted origin in development:', origin);
        callback(null, true);
      }
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'api-key', 
    'x-api-token', 
    'x-api-key', 
    'drafts', 
    'x-user-role',
    'X-Requested-With',
    'Accept'
  ],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // 24 hours
}));

// Handle preflight requests for all routes
app.options('*', cors());

// Request logging middleware
app.use((req, res, next) => {
  if (req.path === '/health') return next();
  
  // Get client IP - req.ip properly handles IPv4 and IPv6 when trust proxy is set
  const clientIP = req.ip || 'unknown';
  
  const logData = {
    method: req.method,
    path: req.originalUrl,
    ip: clientIP,
    origin: req.headers['origin'] || 'no-origin',
    userAgent: req.headers['user-agent']?.substring(0, 100) || 'unknown'
  };
  
  console.log(`📥 ${req.method} ${req.originalUrl} from ${clientIP}`);
  
  if (NODE_ENV !== 'production') {
    console.log('   Origin:', req.headers['origin']);
    console.log('   Content-Type:', req.headers['content-type']);
  }
  
  logger.info('API Request', logData);
  next();
});


// Global rate limiter for all API routes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: NODE_ENV === 'production' ? 1000 : 10000, // requests per window
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health', 
  handler: (req, res) => {
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
    logger.warn('Global rate limit exceeded', {
      ip: clientIP,
      path: req.path,
    });
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again in 15 minutes.',
    });
  },
});

// PDF generation rate limiter (more restrictive)
const pdfRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: NODE_ENV === 'production' ? 30 : 100,
  message: { 
    error: 'Too many PDF generation requests',
    message: 'You have exceeded the rate limit for PDF generation. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use standardized IP key generator (handles IPv6 properly)
  handler: (req, res) => {
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
    logger.warn('PDF rate limit exceeded', {
      ip: clientIP,
      path: req.path,
    });
    res.status(429).json({
      error: 'Too many PDF generation requests',
      message: 'You have exceeded the rate limit for PDF generation. Please try again in 15 minutes.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

// AI endpoints rate limiter (custom implementation for more control)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; 
const RATE_LIMIT_MAX_REQUESTS = NODE_ENV === 'production' ? 20 : 100;

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  for (const [ip, requests] of rateLimitMap.entries()) {
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    if (validRequests.length === 0) {
      rateLimitMap.delete(ip);
    } else {
      rateLimitMap.set(ip, validRequests);
    }
  }
}, 5 * 60 * 1000);

const aiRateLimiter = (req, res, next) => {
  // Get real client IP - req.ip already handles IPv6 when trust proxy is set
  const clientIP = req.ip || 'unknown';
  
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  if (!rateLimitMap.has(clientIP)) {
    rateLimitMap.set(clientIP, []);
  }

  const requests = rateLimitMap.get(clientIP);
  const validRequests = requests.filter(timestamp => timestamp > windowStart);

  if (validRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    logger.warn('AI rate limit exceeded', { ip: clientIP, path: req.path });
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Too many AI requests. Please try again later.',
      retryAfter: Math.ceil((validRequests[0] + RATE_LIMIT_WINDOW - now) / 1000)
    });
  }

  validRequests.push(now);
  rateLimitMap.set(clientIP, validRequests);
  next();
};

// Apply global rate limiter to all routes
app.use(globalLimiter);

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// Socket.IO authentication middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    
    if (!token) {
      logger.warn('Socket connection attempt without token', {
        socketId: socket.id,
        ip: socket.handshake.address
      });
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    
    logger.info('Socket authenticated', {
      userId: decoded.id,
      socketId: socket.id
    });
    
    return next();
  } catch (error) {
    logger.error('Socket authentication failed', {
      error: error.message,
      socketId: socket.id
    });
    return next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`✅ Socket connected: ${socket.id} (User: ${socket.userId})`);
  
  if (socket.userId) {
    socket.join(`user:${socket.userId}`);
  }

  socket.on('disconnect', (reason) => {
    console.log(`❌ Socket disconnected: ${socket.id} (Reason: ${reason})`);
    logger.info('Socket disconnected', {
      socketId: socket.id,
      userId: socket.userId,
      reason
    });
  });

  socket.on('error', (error) => {
    logger.error('Socket error', {
      socketId: socket.id,
      userId: socket.userId,
      error: error.message
    });
  });
});

// Make io accessible to routes
app.set('io', io);


app.get("/", async (req, res) => {
  res.json({
    message: "World Visa API is running",
    version: "2.0",
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint for Dokploy, load balancers, Kubernetes
app.get("/health", (req, res) => {
  const healthcheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: NODE_ENV,
    services: {
      database: dbConnected ? 'connected' : 'disconnected',
      redis: getRedisStatus(),
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
    }
  };

  // Return 503 if database is down in production
  if (!dbConnected && NODE_ENV === 'production') {
    return res.status(503).json({
      ...healthcheck,
      status: 'degraded',
      message: 'Database connection unavailable'
    });
  }

  res.status(200).json(healthcheck);
});

// Readiness probe (stricter than liveness)
app.get("/ready", (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({
      ready: false,
      reason: 'Database not connected'
    });
  }

  res.status(200).json({
    ready: true,
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint (disable in production)
if (NODE_ENV !== 'production') {
  app.get("/debug-info", (req, res) => {
    res.json({
      clientIP: req.ip,
      forwardedFor: req.headers['x-forwarded-for'],
      realIP: req.headers['x-real-ip'],
      origin: req.headers['origin'],
      userAgent: req.headers['user-agent'],
      serverTime: new Date().toISOString(),
      dbConnected: dbConnected,
      redisStatus: getRedisStatus(),
      environment: NODE_ENV,
      nodeVersion: process.version
    });
  });
}

// IP Info endpoint
app.get("/ipinfo", async (req, res) => {
  const ip = req.query.ip;
  
  if (!ip) {
    return res.status(400).json({ 
      error: 'IP address is required',
      message: 'Please provide an IP address in the query parameter' 
    });
  }

  try {
    const response = await axios.get(
      `http://ipinfo.io/${ip}?token=${process.env.IP_INFO_KEY}`,
      { timeout: 5000 }
    );
    res.json(response.data);
  } catch (error) {
    logger.error('IP info lookup failed', { 
      ip, 
      error: error.message 
    });
    res.status(500).json({ 
      status: "failed",
      error: 'Unable to fetch IP information'
    });
  }
});

// Webhook endpoint
app.post("/webhook", (req, res) => {
  const webhookData = req.body;
  console.log("📨 Webhook data received:", JSON.stringify(webhookData, null, 2));
  logger.info('Webhook received', { data: webhookData });
  res.status(200).json({ 
    status: 'received',
    message: 'Webhook data processed successfully' 
  });
});


// Public routes (no API key required)
app.use("/blogs", blogsRouter);
app.use("/news", newsRouter);
app.use("/payment", paymentRouter);
app.use("/leads", leadsRouter);
app.use("/eligibility", eligibilityRouter);
app.use("/tasks", taskRouter);
app.use("/razorpay", razorpayController);
app.use("/visa_reference_form", visaReferenceFormController);

// Protected routes (API key required)
app.use("/api/visa-news", apiKeyMiddleware, visaNewsRouter);
app.use("/jobs", apiKeyMiddleware, jobsRouter);
app.use("/currency", apiKeyMiddleware, currecyController);
app.use("/reviews", apiKeyMiddleware, reviewsRouter);
app.use('/api/packages', apiKeyMiddleware, packagesRouter);

// M-Cube WATI routes (special API key)
app.use("/wati", mcubeApiKeyMiddleware, mcubeWatiRouter);

// Zoho DMS routes
app.use("/api/zoho_dms/oauth", zohoDmsAuthRouter);
app.use("/api/zoho_dms/visa_applications", zohoDmsVisaApplicationsRouter);
app.use('/api/zoho_dms/users', zohoDmsUserAuthRouter);
app.use('/api/zoho_dms/clients', zohoDmsClientAuthRouter);

// AI routes with rate limiting
app.use('/api/ai/technical-assessment', aiRateLimiter, technicalAssessmentRouter);
app.use('/api/ai/travel-budget', aiRateLimiter, travelBudget);

// Conditionally load AI job opportunities
if (aiJobOpportunitiesRouter) {
  app.use("/api/ai/generatejobopportunities", aiRateLimiter, aiJobOpportunitiesRouter);
}

// PDF routes with special rate limiting
app.use('/api/parse-pdf', pdfParserRouter);
app.use('/api/worldvisaV2/global-assessment-report', pdfRateLimiter, pdfRoutes);

// Meeting booking routes
app.use('/api/worldvisaV2/schedule-meeting', meetingRouter);

app.use((req, res, next) => {
  logger.warn('404 Not Found', {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip
  });
  
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  // Log error
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  // Don't leak error details in production
  const errorResponse = {
    error: 'Internal Server Error',
    message: NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    timestamp: new Date().toISOString()
  };

  // Add stack trace in development
  if (NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
  }

  res.status(err.status || 500).json(errorResponse);
});


// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 World Visa API Server Started');
  console.log('='.repeat(60));
  console.log(`📍 Host: 0.0.0.0:${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log(`💾 Database: ${dbConnected ? '✅ Connected' : '⏳ Connecting...'}`);
  console.log(`🔴 Redis: ${getRedisStatus()}`);
  console.log('='.repeat(60) + '\n');
  
  logger.info('Server started', { 
    port: PORT, 
    host: '0.0.0.0', 
    environment: NODE_ENV,
    dbConnected 
  });
});

// Handle server startup errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    logger.error('Server startup failed - port in use', { port: PORT });
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    logger.error('Server error', { error: error.message });
    process.exit(1);
  }
});

module.exports = app;