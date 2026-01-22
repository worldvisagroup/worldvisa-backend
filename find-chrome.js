const fs = require('fs');
const os = require('os');

console.log('🔍 Searching for Chrome/Edge installations...\n');

const platform = os.platform();
let paths = [];

if (platform === 'win32') {
  // Windows paths
  paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
} else if (platform === 'darwin') {
  // macOS paths
  paths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ];
} else {
  // Linux paths
  paths = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
  ];
}

let found = false;

paths.forEach(p => {
  if (fs.existsSync(p)) {
    console.log('✅ Found:', p);
    console.log('   Add this to your .env file:\n');
    console.log(`   GOOGLE_CHROME_BIN=${p}\n`);
    found = true;
  }
});

if (!found) {
  console.log('❌ No Chrome or Edge installation found in common locations.\n');
  console.log('Please install Chrome or Edge, or manually locate the executable.\n');
  console.log('Common installation commands:');
  
  if (platform === 'win32') {
    console.log('  - Download from: https://www.google.com/chrome/');
  } else if (platform === 'darwin') {
    console.log('  - brew install --cask google-chrome');
  } else {
    console.log('  - sudo apt-get install google-chrome-stable  (Ubuntu/Debian)');
    console.log('  - sudo yum install google-chrome-stable      (CentOS/RHEL)');
    console.log('  - sudo dnf install google-chrome-stable      (Fedora)');
  }
} else {
  console.log('✨ Copy one of the paths above to your .env file to use puppeteer-core locally.');
}

console.log('\n📖 For more information, see docs/PUPPETEER_SETUP.md');

