/**
 * Manual API Test Script
 * 
 * A simple script to test all admin API endpoints manually
 * without requiring a testing framework like Jest.
 * 
 * Usage: node manual-api-test.js
 */

const http = require('http');
const https = require('https');
const jwt = require('jsonwebtoken');

// Configuration
const config = {
  host: 'localhost',
  port: process.env.PORT || 5051,
  protocol: 'http',
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production',
  basePath: '/api'
};

// Test token (you can replace with actual login)
const testToken = jwt.sign(
  { id: 'admin', username: 'admin' },
  config.jwtSecret,
  { expiresIn: '1h' }
);

// Helper function to make HTTP requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const lib = options.protocol === 'https' ? https : http;
    
    const req = lib.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Test cases
const tests = [
  {
    name: 'GET /api/admin/debug-timestamp',
    method: 'GET',
    path: '/api/admin/debug-timestamp',
    expectedStatus: 200
  },
  {
    name: 'POST /api/admin/check-auth (without token)',
    method: 'POST',
    path: '/api/admin/check-auth',
    expectedStatus: 401
  },
  {
    name: 'POST /api/admin/check-auth (with token)',
    method: 'POST',
    path: '/api/admin/check-auth',
    headers: { 'Authorization': `Bearer ${testToken}` },
    expectedStatus: 200
  },
  {
    name: 'GET /api/admin/surveys',
    method: 'GET',
    path: '/api/admin/surveys',
    headers: { 'Authorization': `Bearer ${testToken}` },
    expectedStatus: 200
  },
  {
    name: 'GET /api/admin/question-banks',
    method: 'GET',
    path: '/api/admin/question-banks',
    headers: { 'Authorization': `Bearer ${testToken}` },
    expectedStatus: 200
  },
  {
    name: 'GET /api/admin/responses',
    method: 'GET',
    path: '/api/admin/responses',
    headers: { 'Authorization': `Bearer ${testToken}` },
    expectedStatus: 200
  },
  {
    name: 'GET /api/admin/profile',
    method: 'GET',
    path: '/api/admin/profile',
    headers: { 'Authorization': `Bearer ${testToken}` },
    expectedStatus: 200
  },
  {
    name: 'GET /api/admin/dashboard/statistics',
    method: 'GET',
    path: '/api/admin/dashboard/statistics',
    headers: { 'Authorization': `Bearer ${testToken}` },
    expectedStatus: 200
  },
  {
    name: 'POST /api/admin/surveys (create test survey)',
    method: 'POST',
    path: '/api/admin/surveys',
    headers: { 
      'Authorization': `Bearer ${testToken}`,
      'Content-Type': 'application/json'
    },
    body: {
      title: 'API Test Survey',
      description: 'Test survey for API validation',
      type: 'survey',
      sourceType: 'manual'
    },
    expectedStatus: 201
  }
];

// Run tests
async function runTests() {
  console.log('🧪 Starting Admin API Tests...\n');
  console.log(`Testing against: ${config.protocol}://${config.host}:${config.port}\n`);
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const options = {
        hostname: config.host,
        port: config.port,
        path: test.path,
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
          ...(test.headers || {})
        }
      };
      
      const postData = test.body ? JSON.stringify(test.body) : null;
      const response = await makeRequest(options, postData);
      
      const success = response.status === test.expectedStatus;
      
      if (success) {
        console.log(`✅ ${test.name}`);
        console.log(`   Status: ${response.status} (expected ${test.expectedStatus})`);
        passed++;
      } else {
        console.log(`❌ ${test.name}`);
        console.log(`   Status: ${response.status} (expected ${test.expectedStatus})`);
        console.log(`   Response: ${JSON.stringify(response.body, null, 2)}`);
        failed++;
      }
      
    } catch (error) {
      console.log(`❌ ${test.name}`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('📊 Test Results:');
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Admin API refactoring successful.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the API endpoints.');
  }
}

// Check if server is running first
async function checkServer() {
  try {
    const options = {
      hostname: config.host,
      port: config.port,
      path: '/api/admin/debug-timestamp',
      method: 'GET'
    };
    
    await makeRequest(options);
    return true;
  } catch (error) {
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log(`❌ Server not running on ${config.protocol}://${config.host}:${config.port}`);
    console.log('Please start the server and try again.');
    process.exit(1);
  }
  
  await runTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runTests, makeRequest };