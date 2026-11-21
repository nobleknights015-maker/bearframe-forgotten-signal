// Zero-dependency static server for the game (public/).
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'public');
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json',
};

const server = http.createServer((req, res) => {
  const [rawPath = '/', rawQuery = ''] = (req.url || '/').split('?');
  let rel;
  try {
    rel = decodeURIComponent(rawPath);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Bad Request');
  }
  if (rel === '/') {
    rel = /(?:^|&)(?:rpg-lab|connected-lab)=1(?:&|$)/.test(rawQuery) ? '/index.html' : '/campaign.html';
  } else if (rel.endsWith('/')) {
    rel += 'index.html';
  }
  let file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) { res.writeHead(302, { Location: rel + '/' }); return res.end(); }
  if (!fs.existsSync(file)) {
    if (path.extname(rel) || rel.startsWith('/assets/')) { res.writeHead(404); return res.end('Not found'); }
    file = path.join(ROOT, 'index.html');
  }
  const contentType = TYPES[path.extname(file)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
  if (req.method === 'HEAD') return res.end();
  const stream = fs.createReadStream(file);
  stream.on('error', () => {
    if (!res.headersSent) res.writeHead(500);
    res.end();
  });
  stream.pipe(res);
});

server.listen(PORT, HOST, () => {
  console.log(`Aeon Circuit / Ghost Signal serving on http://${HOST}:${PORT}`);
});
