// services/redis.js - Fixed for Heroku
const IoRedis = require("ioredis");
require("dotenv").config();

let redis;
let redisConnected = false;

// Initialize Redis connection
try {
  if (process.env.REDIS_URL) {
    console.log('🔗 Using REDIS_URL to connect to Redis');
    const redisOptions = {
      retryDelayOnFailover: 1000,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 20000,
      commandTimeout: 10000,
      family: 4,
      keepAlive: 30000,
      retryStrategy: (times) => {
        const delay = Math.min(times * 1000, 30000);
        console.log(`🔄 Redis retry attempt ${times}, delay: ${delay}ms`);
        return delay;
      },
      reconnectOnError: (err) => {
        return err.message.includes('READONLY');
      },
      enableOfflineQueue: true,
      tls: {
        rejectUnauthorized: false,
      },
    };
    redis = new IoRedis(process.env.REDIS_URL, redisOptions);
  } else {
    // Fallback to individual variables (local development)
    console.log('🏠 Using individual Redis variables for local development');
    const redisConfig = {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: false,
      connectTimeout: 10000,
      commandTimeout: 5000,
    };
    redis = new IoRedis(redisConfig);
  }

  redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
    redisConnected = true;
  });

  redis.on('ready', () => {
    console.log('✅ Redis is ready to accept commands');
    redisConnected = true;
  });

  redis.on('error', (err) => {
    console.warn('❌ Redis connection error:', err.message);
    redisConnected = false;
  });

  redis.on('close', () => {
    console.log('🔌 Redis connection closed');
    redisConnected = false;
  });

  redis.on('reconnecting', () => {
    console.log('🔄 Redis reconnecting...');
  });

} catch (error) {
  console.warn('❌ Failed to initialize Redis:', error.message);
  redisConnected = false;
}

async function fetchCachedSummary(cacheKey) {
  if (!redis) {
    console.log('⚠️ Redis client not initialized, skipping cache lookup for key:', cacheKey);
    return null;
  }

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit for key: ${cacheKey}`);
      return JSON.parse(cached);
    }
    return null;
  } catch (error) {
    console.warn('❌ Redis get error:', error.message);
    return null;
  }
}

async function cacheSummary(cacheKey, summary) {
  if (!redis) {
    console.log('⚠️ Redis client not initialized, skipping cache store for key:', cacheKey);
    return;
  }

  try {
    await redis.set(cacheKey, JSON.stringify(summary), "EX", 30 * 24 * 60 * 60);
    console.log(`✅ Cached summary for key: ${cacheKey}`);
  } catch (error) {
    console.warn('❌ Redis set error:', error.message);
  }
}

async function flushRedis() {
  if (!redis) {
    console.log('⚠️ Redis client not initialized, skipping flush');
    return;
  }
  try {
    await redis.flushall();
    console.log('✅ Redis cache flushed');
  } catch (error) {
    console.warn('❌ Redis flush error:', error.message);
  }
}



function isRedisConnected() {
  return redisConnected;
}

module.exports = {
  fetchCachedSummary,
  cacheSummary,
  isRedisConnected,
  flushRedis
};