const http = require('http');

function testChargesAPI() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/charges',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Raw response:', data);
      try {
        const json = JSON.parse(data);
        console.log('\nParsed JSON:');
        console.log('  success:', json.success);
        console.log('  count:', json.count);
        console.log('  data length:', json.data?.length);
        if (json.data && json.data.length > 0) {
          console.log('  first charge:', JSON.stringify(json.data[0], null, 2));
        }
      } catch (e) {
        console.error('Failed to parse JSON:', e.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error);
  });

  req.end();
}

console.log('Testing /api/charges endpoint...\n');
setTimeout(testChargesAPI, 2000);
