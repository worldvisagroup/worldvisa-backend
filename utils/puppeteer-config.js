const fs = require('fs');
const logger = require('./logger');

function getPuppeteerConfig() {
  // Check environment variables in priority order
  const chromePath = 
    process.env.GOOGLE_CHROME_BIN ||      // Heroku buildpack sets this
    process.env.CHROME_BIN ||              // Alternative standard
    process.env.PUPPETEER_EXECUTABLE_PATH; // Custom override

  // Detect environment
  const isHeroku = !!process.env.DYNO;
  const environment = isHeroku ? 'heroku' : (process.env.NODE_ENV || 'development');

  // puppeteer-core REQUIRES explicit executable path
  if (!chromePath) {
    const errorMsg = 
      'Chrome executable path not found. puppeteer-core requires GOOGLE_CHROME_BIN environment variable.\n' +
      '\nFor local development, add to .env:\n' +
      '  Windows: GOOGLE_CHROME_BIN=C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\n' +
      '  Linux:   GOOGLE_CHROME_BIN=/usr/bin/google-chrome-stable\n' +
      '  Mac:     GOOGLE_CHROME_BIN=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome\n' +
      '\nFor Heroku: Ensure heroku/google-chrome buildpack is installed (it sets GOOGLE_CHROME_BIN automatically)';
    
    logger.error('Chrome executable not configured', { environment });
    throw new Error(errorMsg);
  }

  // Validate path exists
  if (!fs.existsSync(chromePath)) {
    const errorMsg = 
      `Chrome executable not found at: ${chromePath}\n` +
      'Verify the path exists or update the environment variable.\n' +
      `Current environment: ${environment}`;
    
    logger.error('Chrome executable path does not exist', {
      chromePath,
      environment,
      checkedVars: ['GOOGLE_CHROME_BIN', 'CHROME_BIN', 'PUPPETEER_EXECUTABLE_PATH'],
    });
    throw new Error(errorMsg);
  }

  // Determine which env var was used
  let pathSource = 'PUPPETEER_EXECUTABLE_PATH';
  if (process.env.GOOGLE_CHROME_BIN === chromePath) {
    pathSource = 'GOOGLE_CHROME_BIN';
  } else if (process.env.CHROME_BIN === chromePath) {
    pathSource = 'CHROME_BIN';
  }

  logger.info('Puppeteer-core configured successfully', {
    pathSource,
    chromePath,
    environment,
    isHeroku,
  });

  // Base configuration
  const config = {
    executablePath: chromePath, // REQUIRED for puppeteer-core
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',  // Critical for Heroku (limited shared memory)
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-web-security',
    ],
    timeout: 30000,
  };

  // Heroku-specific optimizations
  if (isHeroku) {
    logger.info('Applying Heroku-specific Puppeteer optimizations');
    config.args.push('--single-process'); // Better for memory-constrained dynos
  }

  return config;
}


function getPuppeteerInfo() {
  const chromePath = 
    process.env.GOOGLE_CHROME_BIN ||
    process.env.CHROME_BIN ||
    process.env.PUPPETEER_EXECUTABLE_PATH;

  const isHeroku = !!process.env.DYNO;
  const environment = isHeroku ? 'heroku' : (process.env.NODE_ENV || 'development');

  const info = {
    usingPuppeteerCore: true,
    environment,
    isHeroku,
    chromePath: chromePath || null,
    pathExists: chromePath ? fs.existsSync(chromePath) : false,
    pathSource: 'none',
    envVars: {
      GOOGLE_CHROME_BIN: process.env.GOOGLE_CHROME_BIN || null,
      CHROME_BIN: process.env.CHROME_BIN || null,
      PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH || null,
    },
  };

  // Determine which env var is being used
  if (process.env.GOOGLE_CHROME_BIN && chromePath === process.env.GOOGLE_CHROME_BIN) {
    info.pathSource = 'GOOGLE_CHROME_BIN';
  } else if (process.env.CHROME_BIN && chromePath === process.env.CHROME_BIN) {
    info.pathSource = 'CHROME_BIN';
  } else if (process.env.PUPPETEER_EXECUTABLE_PATH && chromePath === process.env.PUPPETEER_EXECUTABLE_PATH) {
    info.pathSource = 'PUPPETEER_EXECUTABLE_PATH';
  }

  if (!chromePath) {
    info.error = 'No Chrome executable path configured';
    info.hint = 'Set GOOGLE_CHROME_BIN environment variable';
  } else if (!info.pathExists) {
    info.error = `Chrome executable not found at: ${chromePath}`;
    info.hint = 'Verify the path exists or update the environment variable';
  }

  return info;
}

function validatePuppeteerConfig() {
  const chromePath = 
    process.env.GOOGLE_CHROME_BIN ||
    process.env.CHROME_BIN ||
    process.env.PUPPETEER_EXECUTABLE_PATH;

  const isHeroku = !!process.env.DYNO;

  const result = {
    valid: false,
    warnings: [],
    errors: [],
    isHeroku,
  };

  // puppeteer-core REQUIRES Chrome path
  if (!chromePath) {
    result.errors.push('No Chrome executable path configured');
    result.errors.push('Set GOOGLE_CHROME_BIN environment variable');
    return result;
  }

  // Check if path exists
  if (!fs.existsSync(chromePath)) {
    result.errors.push(`Chrome executable not found at: ${chromePath}`);
    result.errors.push('Verify the path exists or update environment variable');
    return result;
  }

  // All checks passed
  result.valid = true;

  // Add informational warnings
  if (isHeroku && !process.env.GOOGLE_CHROME_BIN) {
    result.warnings.push(
      'Running on Heroku but GOOGLE_CHROME_BIN not set. Ensure heroku/google-chrome buildpack is installed.'
    );
  }

  if (!isHeroku && process.env.PUPPETEER_EXECUTABLE_PATH) {
    result.warnings.push(
      'Using PUPPETEER_EXECUTABLE_PATH. Consider using GOOGLE_CHROME_BIN for consistency with Heroku.'
    );
  }

  return result;
}

module.exports = {
  getPuppeteerConfig,
  getPuppeteerInfo,
  validatePuppeteerConfig,
};

