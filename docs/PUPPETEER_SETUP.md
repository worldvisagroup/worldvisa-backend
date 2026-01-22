# Puppeteer-Core Setup Guide

## Overview

This project uses **`puppeteer-core`** (not `puppeteer`) for PDF generation. The key difference:

- **`puppeteer`** = Includes bundled Chromium (~300MB)
- **`puppeteer-core`** = No bundled Chromium, requires you to provide Chrome

✅ **Benefits**: Smaller slug size, faster deployments, uses system Chrome

## Heroku Production Setup

### 1. Verify Buildpacks

Ensure buildpacks are in the correct order:

```bash
heroku buildpacks --app worldvisagroup
```

**Expected output:**
```
1. heroku/google-chrome
2. heroku/nodejs
```

If not correct, set them:

```bash
# Clear existing buildpacks
heroku buildpacks:clear --app worldvisagroup

# Add in correct order
heroku buildpacks:add heroku/google-chrome --app worldvisagroup
heroku buildpacks:add heroku/nodejs --app worldvisagroup
```

### 2. Remove Incorrect Environment Variables

```bash
# Remove PUPPETEER_EXECUTABLE_PATH if it exists
heroku config:unset PUPPETEER_EXECUTABLE_PATH --app worldvisagroup
```

### 3. Verify GOOGLE_CHROME_BIN

The `heroku/google-chrome` buildpack automatically sets this:

```bash
heroku config:get GOOGLE_CHROME_BIN --app worldvisagroup
```

**Expected output:**
```
/app/.apt/usr/bin/google-chrome-stable
```

If not set, the buildpack may need to be reinstalled:

```bash
heroku buildpacks:remove heroku/google-chrome --app worldvisagroup
heroku buildpacks:add heroku/google-chrome --index 1 --app worldvisagroup
```

### 4. Deploy

```bash
git add .
git commit -m "Configure puppeteer-core for Heroku"
git push heroku main
```

### 5. Test

```bash
# Check health endpoint
curl https://worldvisagroup.herokuapp.com/api/worldvisaV2/pdf/health

# View logs
heroku logs --tail --app worldvisagroup

# Verify Chrome in dyno (one-time command)
heroku run "which google-chrome-stable" --app worldvisagroup
```

## Local Development Setup

### Windows

1. **Find your Chrome installation path:**

   Run this Node script to find Chrome:

   ```javascript
   // find-chrome.js
   const fs = require('fs');
   const paths = [
     'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
     'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
     'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
     'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
   ];

   console.log('Searching for Chrome/Edge...\n');
   paths.forEach(p => {
     if (fs.existsSync(p)) {
       console.log('✅ Found:', p);
       console.log('   Add to .env:\n');
       console.log(`   GOOGLE_CHROME_BIN=${p}\n`);
     }
   });
   ```

   Run: `node find-chrome.js`

2. **Add to `.env` file:**

   ```env
   # Most common Windows Chrome path
   GOOGLE_CHROME_BIN=C:\Program Files\Google\Chrome\Application\chrome.exe

   # Or if using Edge:
   # GOOGLE_CHROME_BIN=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
   ```

### Linux

```env
# Ubuntu/Debian
GOOGLE_CHROME_BIN=/usr/bin/google-chrome-stable

# Or Chromium
GOOGLE_CHROME_BIN=/usr/bin/chromium-browser

# Find your Chrome path:
# which google-chrome-stable
# which chromium-browser
```

### macOS

```env
# Standard Chrome installation
GOOGLE_CHROME_BIN=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome

# Or Chromium
GOOGLE_CHROME_BIN=/Applications/Chromium.app/Contents/MacOS/Chromium
```

## Testing Locally

1. **Set environment variable in `.env`**
2. **Start the server:**
   ```bash
   npm run dev
   ```
3. **Test health check:**
   ```bash
   curl http://localhost:3000/api/worldvisaV2/pdf/health
   ```

**Expected healthy response:**
```json
{
  "status": "healthy",
  "checks": {
    "puppeteer": true,
    "puppeteerConfig": {
      "usingPuppeteerCore": true,
      "pathSource": "GOOGLE_CHROME_BIN",
      "chromePath": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "pathExists": true,
      "environment": "development",
      "isHeroku": false,
      "browserVersion": "Chrome/131.0.6778.108"
    }
  }
}
```

## Troubleshooting

### Error: "Chrome executable path not found"

**Cause:** No environment variable set.

**Solution:**
- **Local**: Add `GOOGLE_CHROME_BIN` to `.env` file
- **Heroku**: Verify `heroku/google-chrome` buildpack is installed

### Error: "Chrome executable not found at: [path]"

**Cause:** Path exists in environment variable but Chrome is not at that location.

**Solution:**
- **Local**: Update `.env` with correct Chrome path (use find-chrome.js)
- **Heroku**: Run `heroku run "which google-chrome-stable"` to verify Chrome installation

### Health Check Shows "unhealthy"

1. **Check environment variables:**
   ```bash
   # Heroku
   heroku config --app worldvisagroup
   
   # Local
   cat .env | grep GOOGLE_CHROME_BIN
   ```

2. **Check logs:**
   ```bash
   # Heroku
   heroku logs --tail --app worldvisagroup
   
   # Local
   # Server console output
   ```

3. **Verify buildpacks (Heroku only):**
   ```bash
   heroku buildpacks --app worldvisagroup
   # Should show google-chrome BEFORE nodejs
   ```

## Environment Variable Priority

The system checks environment variables in this order:

1. `GOOGLE_CHROME_BIN` ← **Preferred** (Heroku standard)
2. `CHROME_BIN` ← Alternative
3. `PUPPETEER_EXECUTABLE_PATH` ← Custom override (not recommended)

**Best Practice:** Always use `GOOGLE_CHROME_BIN` for consistency across environments.

## Performance Notes

### Heroku Dyno Recommendations

- **Standard Dynos**: 512MB RAM - May struggle with concurrent PDF generation
- **Standard-1X**: 512MB RAM - Minimum recommended
- **Standard-2X**: 1GB RAM - Better performance for production

### Memory Optimization

Puppeteer-core configuration includes:
- `--disable-dev-shm-usage` - Critical for Heroku
- `--single-process` - Applied automatically on Heroku
- `--no-sandbox` - Required for containerized environments

## Additional Resources

- [Heroku Google Chrome Buildpack](https://elements.heroku.com/buildpacks/heroku/heroku-buildpack-google-chrome)
- [Puppeteer Core Documentation](https://pptr.dev/api/puppeteer.puppeteernode)
- [Puppeteer on Heroku Guide](https://github.com/jontewks/puppeteer-heroku-buildpack)

