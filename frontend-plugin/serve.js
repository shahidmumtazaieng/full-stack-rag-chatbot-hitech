/**
 * Hitech Steel Industries — Widget Demo Server
 * Serves index.html + dist/widget.js as a static site
 *
 * Usage:  node serve.js
 * Open:   http://localhost:5500
 */

const http  = require('http');
const fs    = require('fs');
const path  = require('path');

const PORT = 5500;
const ROOT = __dirname; // frontend-plugin/

const MIME = {
  '.html' : 'text/html; charset=utf-8',
  '.js'   : 'application/javascript; charset=utf-8',
  '.css'  : 'text/css; charset=utf-8',
  '.json' : 'application/json',
  '.png'  : 'image/png',
  '.jpg'  : 'image/jpeg',
  '.jpeg' : 'image/jpeg',
  '.gif'  : 'image/gif',
  '.svg'  : 'image/svg+xml',
  '.ico'  : 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff' : 'font/woff',
  '.ttf'  : 'font/ttf',
  '.map'  : 'application/json',
};

const server = http.createServer((req, res) => {
  // ── CORS (allows WordPress / Odoo to load the widget) ──
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Default to test-widget.html
  let urlPath = req.url.split('?')[0]; // strip query string
  if (urlPath === '/' || urlPath === '') urlPath = '/test-widget.html';

  const filePath    = path.join(ROOT, urlPath);
  const ext         = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  // Security: prevent directory traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('403 Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        console.warn(`404  ${req.url}`);
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`404 Not Found: ${urlPath}`);
      } else {
        console.error(`500  ${req.url}`, err.message);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
    console.log(`200  ${req.url}`);
  });
});

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║   Hitech Steel — Widget Demo Server          ║
╠══════════════════════════════════════════════╣
║   Local:   http://localhost:${PORT}             ║
║   Files:   ${ROOT}
╠══════════════════════════════════════════════╣
║   Embed widget on any site:                  ║
║                                              ║
║   <script>                                   ║
║     window.HITECH_CHAT_API_URL =             ║
║       'https://hitechsa.netlify.app/';       ║
║   </script>                                  ║
║   <script src="dist/widget.js"></script>     ║
╚══════════════════════════════════════════════╝
  `);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌  Port ${PORT} is already in use.`);
    console.error(`   Kill the process or change PORT in serve.js\n`);
  } else {
    throw err;
  }
});
