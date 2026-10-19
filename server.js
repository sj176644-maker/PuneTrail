// Tiny dependency-free static server. Usage: npm start  (PORT=3000 by default)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
const root = process.cwd(), port = process.env.PORT || 3000;
createServer(async (req, res) => {
  const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  const f = join(root, p === '/' ? 'index.html' : p);
  if (!f.startsWith(root)) { res.writeHead(403).end(); return; }
  try { const b = await readFile(f); res.writeHead(200, { 'Content-Type': T[extname(f)] || 'application/octet-stream' }).end(b); }
  catch { res.writeHead(404).end('Not found'); }
}).listen(port, () => console.log(`PuneTrail on http://localhost:${port}`));
