@echo off
echo Starting Redis server...
echo.
echo If you don't have Redis installed, you can:
echo 1. Download from https://redis.io/download
echo 2. Or use Docker: docker run -d -p 6379:6379 redis:alpine
echo 3. Or use WSL: sudo apt-get install redis-server
echo.
echo Trying to start Redis...
redis-server
