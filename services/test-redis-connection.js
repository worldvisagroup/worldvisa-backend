// test-redis-connection.js
const { fetchCachedSummary, cacheSummary } = require('./redis');

async function testConnection() {
  console.log('Testing Redis connection...');

  try {
    // Test cache write
    await cacheSummary('test-connection', { timestamp: new Date().toISOString() });
    console.log('✅ Cache write successful');

    // Test cache read
    const result = await fetchCachedSummary('test-connection');
    console.log('✅ Cache read successful:', result);

  } catch (error) {
    console.error('❌ Redis test failed:', error.message);
  }
}

testConnection();