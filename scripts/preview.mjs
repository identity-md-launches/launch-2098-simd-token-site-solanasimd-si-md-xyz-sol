import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve('dist');
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain' };
createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (path === '/simd-coin.json') {
      const response = await fetch('https://solanasimd.si-md.xyz/simd-coin.json', { signal: AbortSignal.timeout(12000) });
      res.writeHead(response.status, { 'Content-Type': 'application/json' });
      return res.end(await response.text());
    }
    const local = resolve(root, `.${path.endsWith('/') ? `${path}index.html` : path}`);
    if (!local.startsWith(root + sep) || !(await stat(local)).isFile()) throw new Error('Missing file');
    res.writeHead(200, { 'Content-Type': types[extname(local)] || 'application/octet-stream' });
    res.end(await readFile(local));
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(await readFile(resolve(root, '404.html')));
  }
}).listen(port, '127.0.0.1', () => console.log(`Preview: http://127.0.0.1:${port}/ (Ctrl+C to stop)`));
