# Redis Setup Guide

Your application uses Redis for caching. The Redis connection errors you're seeing indicate that Redis is not running on your system.

## Production: Dokploy / Docker

When running in Dokploy or Docker, **never use 127.0.0.1**—it refers to the container itself, not Redis.

### Step 1: Deploy Redis in Dokploy

1. **Create Redis service**: Dokploy → Create Service → Database → Redis
2. **Name**: `redis` (this becomes the internal hostname)
3. **Version**: 7 (recommended)
4. **Password**: Set a strong password (required for production)
5. **Project**: Use the **same project** as your app so they share the Docker network
6. Deploy and wait until Redis is healthy

### Step 2: Configure Environment Variables

In your **application** service settings in Dokploy, add:

| Variable      | Value                                  | Notes                         |
|---------------|----------------------------------------|-------------------------------|
| `REDIS_URL`   | `redis://:YOUR_PASSWORD@redis:6379/0`  | Preferred; use service name   |

**Format rules**:
- No password: `redis://redis:6379/0`
- With password: `redis://:password@redis:6379/0` (colon before password)

**Alternative** (individual vars):
- `REDIS_HOST=redis` (must be service name, not 127.0.0.1)
- `REDIS_PORT=6379`
- `REDIS_PASSWORD=your_password` (if set)

---

## Quick Solutions (Local Development)

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
REDIS_URL=redis://host:port/0   # Preferred: full connection string (use in production)
REDIS_HOST=127.0.0.1            # Fallback for local dev; use service name in Docker
REDIS_PORT=6379                 # Default: 6379
REDIS_PASSWORD=your_pass        # Optional: No password by default
```

In production (Dokploy/Docker), always set `REDIS_URL` or `REDIS_HOST` to the Redis service name (e.g. `redis`). If neither is set in production, the app skips Redis initialization (no retries, no log spam).

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
