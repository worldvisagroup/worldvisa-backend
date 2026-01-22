# Redis Setup Guide

Your application uses Redis for caching. The Redis connection errors you're seeing indicate that Redis is not running on your system.

## Quick Solutions

### Option 1: Install and Start Redis

#### Windows:

1. Download Redis from: https://github.com/microsoftarchive/redis/releases
2. Extract and run `redis-server.exe`
3. Or use WSL: `sudo apt-get install redis-server && sudo service redis-server start`

#### macOS:

```bash
brew install redis
brew services start redis
```

#### Linux (Ubuntu/Debian):

```bash
sudo apt-get install redis-server
sudo service redis-server start
```

#### Linux (CentOS/RHEL):

```bash
sudo yum install redis
sudo systemctl start redis
```

### Option 2: Use Docker

```bash
docker run -d -p 6379:6379 redis:alpine
```

### Option 3: Skip Redis (Current Implementation)

The application has been updated to gracefully handle Redis being unavailable. It will:

- Log warnings instead of crashing
- Continue to work without caching
- Fall back to in-memory caching where possible

## Environment Variables

You can configure Redis connection using these environment variables:

```bash
REDIS_HOST=127.0.0.1      # Default: 127.0.0.1
REDIS_PORT=6379           # Default: 6379
REDIS_PASSWORD=your_pass  # Optional: No password by default
```

## Verification

To check if Redis is running:

```bash
redis-cli ping
# Should return: PONG
```

## Current Status

✅ **Fixed**: Redis connection errors will no longer crash your application
✅ **Improved**: Added proper error handling and graceful degradation
✅ **Enhanced**: Added configuration options via environment variables

Your application will now work with or without Redis running.
