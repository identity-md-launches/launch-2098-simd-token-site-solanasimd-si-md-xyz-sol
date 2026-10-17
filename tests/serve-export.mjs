import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

/** A bounded test server. Runtime feed fixtures never enter the production export. */
export async function serveExport({ liveFeed = false } = {}) {
  const root = resolve('dist');
  const requests = [];
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain' };
  const server = createServer(async (req, res) => {
    requests.push(req.url);
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/simd-coin.json') {
        if (liveFeed) {
          const response = await fetch('https://solanasimd.si-md.xyz/simd-coin.json', { signal: AbortSignal.timeout(10000) });
          res.writeHead(response.status, { 'Content-Type': 'application/json' });
          return res.end(await response.text());
        }
        res.writeHead(503, { 'Content-Type': 'application/json' }); return res.end('{"error":"No hosting feed in a static-only preview"}');
      }
      if (url.pathname === '/') { res.writeHead(302, { Location: '/preview/' }); return res.end(); }
      if (!url.pathname.startsWith('/preview/')) throw new Error('Missing file');
      const path = decodeURIComponent(url.pathname.slice('/preview'.length));
      const local = resolve(root, `.${path.endsWith('/') ? `${path}index.html` : path}`);
      if (!local.startsWith(root + sep) || !(await stat(local)).isFile()) throw new Error('Missing file');
      res.writeHead(200, { 'Content-Type': types[extname(local)] || 'application/octet-stream' }); res.end(await readFile(local));
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/html' }); res.end(await readFile(resolve(root, '404.html')));
    }
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  const url = `http://127.0.0.1:${server.address().port}/preview/`;
  return { url, server, requests, close: () => new Promise((done) => server.close(done)) };
}
