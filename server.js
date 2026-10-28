const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3080;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.php': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // API Endpoints for CMS & Analytics persistence
  if (pathname === '/api/cms' || pathname === '/api/analytics') {
    const file = pathname === '/api/cms' ? 'cms.json' : 'analytics.json';
    const filePath = path.join(DATA_DIR, file);

    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        try {
          fs.writeFileSync(filePath, body, 'utf8');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: err.message }));
        }
      });
      return;
    }

    if (req.method === 'GET') {
      if (fs.existsSync(filePath)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(fs.readFileSync(filePath, 'utf8'));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false }));
      }
      return;
    }
  }

  // Map .php requests to .html equivalents for local preview
  if (pathname === '/' || pathname === '/index.php') {
    pathname = '/index.html';
  } else if (pathname === '/rabia-alga.php' || pathname === '/rabia-alga' || pathname === '/rabialga.php') {
    pathname = '/rabia-alga.html';
  } else if (pathname === '/bedia-kahya-kilic.php' || pathname === '/bedia-kahya-kilic') {
    pathname = '/bedia-kahya-kilic.html';
  } else if (pathname === '/admin.php' || pathname === '/admin') {
    pathname = '/admin.html';
  }

  const filePath = path.join(ROOT, pathname);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404 - Sayfa Bulunamadı</h1><a href="/index.html">Ana Sayfaya Dön</a>');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`İçimizdeki Tamirci sunucusu çalışıyor: http://localhost:${PORT}`);
});
