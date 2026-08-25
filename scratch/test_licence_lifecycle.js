const http = require('http');
const path = require('path');
const jwt = require(path.join(__dirname, '../server/node_modules/jsonwebtoken'));

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this-in-production';
const adminToken = jwt.sign({ id: 'test-admin', role: 'ADMIN', email: 'admin@kdw.com' }, JWT_SECRET, { expiresIn: '1h' });

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const jsonBody = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        ...(jsonBody ? { 'Content-Length': Buffer.byteLength(jsonBody) } : {})
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
    });
    req.on('error', reject);
    if (jsonBody) req.write(jsonBody);
    req.end();
  });
}

async function testLicenceLifecycle() {
  console.log('Testing Licence Lifecycle:');

  // 1. Create a custom licence
  const createRes = await request('POST', '/api/products/licences', {
    name: 'Custom VIP Creator Licence',
    description: 'Special licence for VIP agency partners',
    activationLimit: 50,
    domainLimit: 15,
    durationDays: 730,
    terms: 'VIP usage terms.'
  });
  console.log('1. Create Licence Status:', createRes.status, 'ID:', createRes.data.data?.id);

  const licId = createRes.data.data?.id;

  // 2. Fetch all licences to verify it appears
  const listRes = await request('GET', '/api/products/licences');
  const found = listRes.data.data?.some(l => l.id === licId);
  console.log('2. Fetch Licences List Status:', listRes.status, 'Contains Created Licence:', found ? 'YES ✓' : 'NO ❌');

  // 3. Delete the custom licence
  const delRes = await request('DELETE', `/api/products/licences/${licId}`);
  console.log('3. Delete Licence Status:', delRes.status, 'Message:', delRes.data.message);

  // 4. Verify deleted
  const listRes2 = await request('GET', '/api/products/licences');
  const foundAfter = listRes2.data.data?.some(l => l.id === licId);
  console.log('4. Verify Deleted Status:', foundAfter ? 'FAILED (Still Exists) ❌' : 'SUCCESS (Removed) ✓');
}

testLicenceLifecycle();
