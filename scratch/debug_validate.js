const http = require('http');

const body = JSON.stringify({
  title: 'Duplicate Test',
  description: 'Test',
  price: 500,
  components: [
    { productId: 'prod-1', displayOrder: 1 },
    { productId: 'prod-1', displayOrder: 2 }
  ]
});

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/bundles/validate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.write(body);
req.end();
