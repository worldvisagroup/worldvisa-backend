#!/bin/bash
echo "Starting Redis server..."
echo ""
echo "If you don't have Redis installed, you can:"
echo "1. Install via package manager:"
echo "   - Ubuntu/Debian: sudo apt-get install redis-server"
echo "   - macOS: brew install redis"
echo "   - CentOS/RHEL: sudo yum install redis"
echo ""
echo "2. Or use Docker: docker run -d -p 6379:6379 redis:alpine"
echo ""
echo "Trying to start Redis..."

# Check if Redis is already running
if pgrep -x "redis-server" > /dev/null; then
    echo "Redis is already running!"
    exit 0
fi

# Try to start Redis
if command -v redis-server &> /dev/null; then
    redis-server
else
    echo "Redis server not found. Please install Redis first."
    echo "On Ubuntu/Debian: sudo apt-get install redis-server"
    echo "On macOS: brew install redis"
    echo "On Windows: Download from https://redis.io/download"
    exit 1
fi
