// Zero-dependency static server for the game (public/).
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, 'public');
const PRIVATE_EXPORT = path.resolve(__dirname, '..', 'private-export');
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2', '.woff': 'font/woff',
};

function handlePrivateApk(req, res, rel) {
  const m = /^\/private-apk\/([a-f0-9]{48,96})\/Aeon-Circuit-The-Silent-Wake\.apk$/.exec(rel);
  if (!m) { res.writeHead(404); return res.end('Not found'); }
  const tokenFile = path.join(PRIVATE_EXPORT, '.apk-token');
  const apkFile = path.join(PRIVATE_EXPORT, 'Aeon-Circuit-The-Silent-Wake.apk');
  if (!fs.existsSync(tokenFile) || !fs.existsSync(apkFile)) {
    res.writeHead(404); return res.end('Not found');
  }
  const expected = fs.readFileSync(tokenFile, 'utf8').trim();
  const provided = m[1];
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(provided, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    res.writeHead(404); return res.end('Not found');
  }
  const stat = fs.statSync(apkFile);
  res.writeHead(200, {
    'Content-Type': 'application/vnd.android.package-archive',
    'Content-Length': stat.size,
    'Content-Disposition': 'attachment; filename="Aeon-Circuit-The-Silent-Wake.apk"',
    'Cache-Control': 'no-store, private',
    'X-Robots-Tag': 'noindex, nofollow'
  });
  if (req.method === 'HEAD') return res.end();
  const stream = fs.createReadStream(apkFile);
  stream.on('error', () => {
    if (!res.headersSent) res.writeHead(500);
    res.end();
  });
  stream.pipe(res);
}

const server = http.createServer((req, res) => {
  const [rawPath = '/', rawQuery = ''] = (req.url || '/').split('?');
  let rel;
  try {
    rel = decodeURIComponent(rawPath);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Bad Request');
  }
  if (rel.startsWith('/private-apk/')) {
    return handlePrivateApk(req, res, rel);
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
  const ext = path.extname(file);
  const contentType = TYPES[ext] || 'application/octet-stream';
  const stat = fs.statSync(file);
  const isStaticAsset = ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.svg' || ext === '.ico' || ext === '.woff2' || ext === '.woff';
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stat.size,
    'Cache-Control': isStaticAsset ? 'public, max-age=300' : 'no-cache'
  });
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
