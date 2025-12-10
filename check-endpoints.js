const http = require('http');

const endpoints = [
  '/api/projets',
  '/api/taches',
  '/api/factures',
  '/api/services',
  '/api/notifications'
];

let checked = 0;

endpoints.forEach(path => {
  const req = http.request({hostname:'localhost', port:3000, path}, res => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        const type = Array.isArray(parsed) ? 'ARRAY' : 'OBJECT';
        const keys = type === 'OBJECT' ? Object.keys(parsed).join(',') : '';
        console.log(`${path}: ${type}${keys ? ' (' + keys + ')' : ''}`);
      } catch(e) {
        console.log(`${path}: ERROR`);
      }
      checked++;
      if (checked === endpoints.length) process.exit(0);
    });
  });
  req.on('error', () => {
    console.log(`${path}: CONNECTION ERROR`);
    checked++;
    if (checked === endpoints.length) process.exit(0);
  });
  req.end();
});
