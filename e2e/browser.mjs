// Browser test. By default uses a tiny LABELLED STUB of Leaflet (the real one needs npm/network).
// If vendor/leaflet/leaflet.js exists (after `npm install`) and you pass --real, it runs against real Leaflet.
import { createRequire } from 'node:module'; import { createServer } from 'node:http'; import { readFileSync, existsSync } from 'node:fs'; import { extname } from 'node:path';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright')); }
const real = process.argv.includes('--real'), noLeaflet = process.argv.includes('--no-leaflet');
const STUB = `window.L={__stub:1,_calls:{tiles:[],markers:[],lines:[]},map(){return{setView(){return this},fitBounds(){},invalidateSize(){}}},
tileLayer(u,o){L._calls.tiles.push({u,o});return{on(e,f){(this.h=this.h||{})[e]=f;window.__tile=this;return this},addTo(){return this}}},
layerGroup(){const g={items:[],addTo(){return g},clearLayers(){g.items=[]}};return g},
divIcon(o){return o},marker(ll,o){const m={ll,o,bindPopup(){return m},addTo(g){g.items.push(m);L._calls.markers.push(m);return m}};return m},
polyline(pts,o){const p={pts,addTo(g){g.items.push(p);L._calls.lines.push(pts);return p}};return p},circleMarker(ll){return{bindPopup(){return this},addTo(g){g.items.push(1);return this}}}};`;
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const srv = createServer((q, r) => { let p = new URL(q.url, 'http://x').pathname; if (p === '/') p = '/index.html';
  if (p === '/vendor/leaflet/leaflet.js' && !real) { r.writeHead(noLeaflet ? 404 : 200, { 'Content-Type': 'text/javascript' }).end(noLeaflet ? '' : STUB); return; }
  if (p === '/vendor/leaflet/leaflet.css' && !real) { r.writeHead(200, { 'Content-Type': 'text/css' }).end(''); return; }
  const f = '.' + p; if (!existsSync(f)) { r.writeHead(404).end(); return; } r.writeHead(200, { 'Content-Type': T[extname(f)] || 'text/plain' }).end(readFileSync(f)); }).listen(0);
const port = srv.address().port, R = [], ok = (n, c) => R.push((c ? 'PASS ' : 'FAIL ') + n);
const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 375, height: 800 }, permissions: [] }), p = await ctx.newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.dismiss());
await p.goto(`http://localhost:${port}/`); await p.waitForSelector('#list article');
ok('list shows all 11 destinations without map', (await p.$$('#list article')).length === 11);
ok('attribution text present', (await p.textContent('#attrib')).includes('OpenStreetMap contributors'));
ok('no horizontal scroll at 375px', await p.evaluate(() => document.documentElement.scrollWidth <= 375));
if (noLeaflet) { ok('error state shown when Leaflet missing', !(await p.$eval('#map-error', e => e.hidden)) && (await p.textContent('#map-error')).includes('list below still works')); }
else {
  const cfg = await p.evaluate(() => ({ t: L._calls.tiles[0], m: L._calls.markers.length }));
  if (!real) { ok('tile layer uses configurable provider url', cfg.t.u === 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' && cfg.t.o.attribution.includes('OpenStreetMap')); ok('markers rendered for all destinations', cfg.m >= 11); }
  await p.click('#filters button:has-text("Forts")');
  ok('filter hides forts (11 -> 5)', (await p.$$('#list article')).length === 5);
  await p.click('#filters button:has-text("Forts")');
  await p.click('#list article:nth-child(1) button:has-text("Add to trip")'); await p.click('#list article:nth-child(2) button:has-text("Add to trip")'); await p.click('#list article:nth-child(7) button:has-text("Add to trip")');
  ok('trip has 3 stops', (await p.$$('#trip li')).length === 3);
  if (!real) { ok('polyline connects stops in itinerary order', await p.evaluate(() => { const l = L._calls.lines.at(-1); return l.length === 3 && l[0][0] === 18.3663; }));
    ok('selected markers get numbered icons', await p.evaluate(() => L._calls.markers.slice(-11).filter(m => m.o.icon.html.includes('sel')).length === 3)); }
  await p.click('#trip li:nth-child(1) button[aria-label*="down"]');
  ok('reorder works', (await p.textContent('#trip li:nth-child(2)')).includes('Sinhagad'));
  const href = await p.getAttribute('#directions', 'href'); ok('directions link: google maps, 3 stops, no api key', href.startsWith('https://www.google.com/maps/dir/') && !href.includes('key=') && href.includes('waypoints='));
  ok('explains line is not a road route', (await p.textContent('#trip')).includes('not a road route'));
  await p.reload(); await p.waitForSelector('#trip li'); ok('trip persists after reload', (await p.$$('#trip li')).length === 3);
  if (!real) { await p.evaluate(() => { for (let i = 0; i < 3; i++) window.__tile.h.tileerror(); }); await p.waitForSelector('#map-error:not([hidden])'); ok('tile failure shows error, list still usable', (await p.$$('#list article')).length >= 7); }
  await p.click('#geo'); ok('geolocation only on click; dismissed confirm => no location', (await p.textContent('#geo-msg')) === '');
}
console.log(R.join('\n'), '\npage errors:', errs); await b.close(); srv.close(); process.exit(R.some(x => x.startsWith('FAIL')) || errs.length ? 1 : 0);
