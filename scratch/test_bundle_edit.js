const http = require('http');

http.get('http://localhost:5000/api/bundles', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const parsed = JSON.parse(data);
    console.log('Total bundles:', parsed.data?.length);
    if (parsed.data && parsed.data.length > 0) {
      const first = parsed.data[0];
      console.log('First bundle ID:', first.id, 'title:', first.title);

      http.get(`http://localhost:5000/api/bundles/${first.id}`, (res2) => {
        let data2 = '';
        res2.on('data', c => data2 += c);
        res2.on('end', () => {
          console.log('Fetch by ID status:', res2.statusCode);
          console.log('Fetch by ID data:', data2.slice(0, 300));
        });
      });
    }
  });
});
