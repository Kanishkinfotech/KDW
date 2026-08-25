const http = require('http');
const path = require('path');
const jwt = require(path.join(__dirname, '../server/node_modules/jsonwebtoken'));

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this-in-production';
const adminToken = jwt.sign({ id: 'test-admin', role: 'ADMIN', email: 'admin@kdw.com' }, JWT_SECRET, { expiresIn: '1h' });

const updateBody = JSON.stringify({
  title: 'qwerty (Copy) (Copy) - Updated',
  price: 250
});

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/bundles/95e16705-9967-426a-8ee7-85c9b7adb6c2',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`,
    'Content-Length': Buffer.byteLength(updateBody)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Update bundle status:', res.statusCode);
    console.log('Update bundle response:', data.slice(0, 300));
  });
});

req.write(updateBody);
req.end();
