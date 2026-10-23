const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const port = Number(process.env.YUMU_PORT || 4175);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4' };
http.createServer((request, response) => {
  let requested;
  try { requested = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); } catch { response.writeHead(400).end('Bad request'); return; }
  const file = path.resolve(root, '.' + (requested.endsWith('/') ? requested + 'index.html' : requested));
  if (!file.startsWith(root + path.sep) || requested.startsWith('/design/') || requested.startsWith('/scripts/')) { response.writeHead(403).end('Forbidden'); return; }
  fs.stat(file, (error, info) => {
    if (error || !info.isFile()) { response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('找不到這個頁面'); return; }
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': 'no-cache' });
    if (request.method === 'HEAD') response.end(); else fs.createReadStream(file).pipe(response);
  });
}).listen(port, '127.0.0.1', () => console.log(`雨沐天堂本機預覽 http://127.0.0.1:${port}`));
