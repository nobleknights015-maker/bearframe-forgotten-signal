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

http.createServer((req, res) => {
  const [rawPath, rawQuery = ''] = req.url.split('?');
  let rel = decodeURIComponent(rawPath);
  if (rel === '/' && !/(?:^|&)(?:rpg-lab|connected-lab)=1(?:&|$)/.test(rawQuery)) {
    const location = '/campaign.html' + (rawQuery ? '?' + rawQuery : '');
    res.writeHead(302, { Location: location, 'Cache-Control': 'no-cache' });
    return res.end();
  }
  if (rel.endsWith('/')) rel += 'index.html';
  let file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) { res.writeHead(302, { Location: rel + '/' }); return res.end(); }
  if (!fs.existsSync(file)) {
    if (path.extname(rel) || rel.startsWith('/assets/')) { res.writeHead(404); return res.end('Not found'); }
    file = path.join(ROOT, 'index.html');
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, HOST, () => console.log(`Ghost Signal serving on ${HOST}:${PORT}`));
