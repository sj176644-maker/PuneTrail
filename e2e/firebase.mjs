// Tests the Firebase WIRING with FAKE in-memory Firebase modules (real Firebase needs network + your project).
import { createRequire } from 'node:module'; import { createServer } from 'node:http'; import { readFileSync, existsSync } from 'node:fs'; import { extname } from 'node:path';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright')); }
const STUB = `window.L={map(){return{setView(){return this},fitBounds(){},invalidateSize(){}}},tileLayer(){return{on(){return this},addTo(){return this}}},layerGroup(){const g={addTo(){return g},clearLayers(){}};return g},divIcon(o){return o},marker(){const m={bindPopup(){return m},addTo(){return m}};return m},polyline(){return{addTo(){}}},circleMarker(){return{bindPopup(){return this},addTo(){return this}}}};`;
const CFG = `export const firebaseConfig={apiKey:'fake',authDomain:'fake.example',projectId:'fake',appId:'fake'};`;
const FAKE = {
  'firebase-app.js': `export const initializeApp=c=>({c});`,
  'firebase-auth.js': `const U='fk_user';const cbs=[];export const getAuth=()=>({});export class GoogleAuthProvider{}
export const onAuthStateChanged=(a,f)=>{cbs.push(f);setTimeout(()=>f(JSON.parse(localStorage.getItem(U)||'null')),0);return()=>{}};
export const signInWithPopup=async()=>{if(window.__failSignIn)throw Object.assign(new Error('x'),{code:'auth/network-request-failed'});const u={uid:'u1',displayName:'Tester',email:'t@example.com'};localStorage.setItem(U,JSON.stringify(u));cbs.forEach(f=>f(u))};
export const signOut=async()=>{localStorage.removeItem(U);cbs.forEach(f=>f(null))};`,
  'firebase-firestore.js': `const K='fk_db';const r=()=>JSON.parse(localStorage.getItem(K)||'{}');export const getFirestore=()=>({});export const doc=(d,...p)=>p.join('/');
export const getDoc=async p=>{if(window.__failRead)throw new Error('boom');const v=r()[p];return{exists:()=>v!==undefined,data:()=>v}};
export const setDoc=async(p,v)=>{const d=r();d[p]=v;localStorage.setItem(K,JSON.stringify(d))};export const serverTimestamp=()=>'TS';`,
};
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const withCfg = process.argv.includes('--configured');
const srv = createServer((q, r) => { let p = new URL(q.url, 'http://x').pathname; if (p === '/') p = '/index.html';
  if (p === '/vendor/leaflet/leaflet.js') { r.writeHead(200, { 'Content-Type': 'text/javascript' }).end(STUB); return; }
  if (p === '/vendor/leaflet/leaflet.css') { r.writeHead(200, { 'Content-Type': 'text/css' }).end(''); return; }
  if (p === '/src/firebase/config.local.js' && withCfg) { r.writeHead(200, { 'Content-Type': 'text/javascript' }).end(CFG); return; }
  const f = '.' + p; if (!existsSync(f)) { r.writeHead(404).end(); return; } r.writeHead(200, { 'Content-Type': T[extname(f)] || 'text/plain' }).end(readFileSync(f)); }).listen(0);
const port = srv.address().port, R = [], ok = (n, c) => R.push((c ? 'PASS ' : 'FAIL ') + n);
const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 375, height: 800 } })).newPage();
const errs = [], reqs = []; p.on('pageerror', e => errs.push(e.message)); p.on('request', q => reqs.push(q.url()));
await p.route('https://www.gstatic.com/firebasejs/**', rt => rt.fulfill({ contentType: 'text/javascript', body: FAKE[rt.request().url().split('/').pop()] }));
const db = () => p.evaluate(() => JSON.parse(localStorage.getItem('fk_db') || '{}')['users/u1/trips/current']);
const add = n => p.click(`#list article:nth-child(${n}) button:has-text("Add to trip")`);
await p.goto(`http://localhost:${port}/`); await p.waitForSelector('#list article'); await p.waitForTimeout(200);
const vis = () => p.$eval('#auth-btn', e => getComputedStyle(e).display !== 'none'), label = () => p.textContent('#auth-btn');
if (!withCfg) {
  ok('unconfigured: auth button hidden', !(await vis()));
  ok('unconfigured: no Firebase network requests', !reqs.some(u => u.includes('gstatic')));
  ok('unconfigured: header only gains the hidden button (3 children, button display:none)', (await p.$eval('header', h => h.children.length)) === 3 && !(await vis()));
  ok('unconfigured: cloud status disabled', await p.evaluate(() => window.__pt.cloud.status) === 'disabled');
  await add(1); await add(2); ok('unconfigured: trip works as before', (await p.$$('#trip li')).length === 2);
} else {
  ok('configured, signed out: status signed-out', await p.evaluate(() => window.__pt.cloud.status) === 'signed-out');
  ok('configured: button shows Sign in', (await vis()) && (await label()) === 'Sign in');
  ok('button shows Sign in, uses .btn.alt.sm', (await p.textContent('#auth-btn')) === 'Sign in' && await p.$eval('#auth-btn', b => b.className === 'btn alt sm' && b.parentElement.tagName === 'HEADER'));
  const hb = 'header button';
  for (const w of [375, 1280]) { await p.setViewportSize({ width: w, height: 800 });
    const [h1, sw] = await p.evaluate(() => [document.querySelector('header').offsetHeight, document.documentElement.scrollWidth]);
    await p.evaluate(() => { document.querySelector('header button').style.display = 'none'; }); const h0 = await p.evaluate(() => document.querySelector('header').offsetHeight);
    await p.evaluate(() => { document.querySelector('header button').style.display = ''; });
    ok(`header height unchanged by button at ${w}px (${h0} vs ${h1}), no horizontal scroll`, h0 === h1 && sw <= w); }
  await p.setViewportSize({ width: 375, height: 800 });
  await add(1); await add(2); await p.waitForTimeout(800); ok('signed out: nothing written to Firestore', (await db()) === undefined);
  await p.click('#auth-btn'); await p.waitForTimeout(800);
  ok('click Sign in -> button says Sign out', (await label()) === 'Sign out');
  ok('sign-in uploads existing local trip', (await db())?.stops?.length === 2);
  await add(3); await p.waitForTimeout(900); ok('later change saved to Firestore', (await db())?.stops?.length === 3);
  await p.evaluate(() => localStorage.removeItem('pt_trip')); await p.reload(); await p.waitForSelector('#trip li', { timeout: 5000 }); await p.waitForTimeout(300); ok('still Sign out after reload', (await label()) === 'Sign out');
  ok('new device/cleared storage: trip restored from Firestore', (await p.$$('#trip li')).length === 3);
  await p.click('#auth-btn'); await p.waitForTimeout(300); ok('click Sign out -> button says Sign in', (await label()) === 'Sign in'); await add(4); await p.waitForTimeout(800); ok('after sign-out: changes stay local', (await db()).stops.length === 3);
  await p.evaluate(() => { window.__failRead = true; }); await p.click('#auth-btn'); await p.waitForTimeout(500);
  ok('Firestore failure: app keeps working, status error', await p.evaluate(() => window.__pt.cloud.status) === 'error' && (await p.$$('#list article')).length === 11);
}
if (withCfg) { await p.evaluate(() => localStorage.removeItem('fk_user')); await p.reload(); await p.waitForTimeout(400); await p.evaluate(() => { window.__failSignIn = true; }); await p.click('#auth-btn'); await p.waitForTimeout(200); ok('failed sign-in shows Sign-in failed, app still usable', (await label()) === 'Sign-in failed' && (await p.$$('#list article')).length === 11); }
console.log(R.join('\n'), '\npage errors:', errs); await b.close(); srv.close(); process.exit(R.some(x => x.startsWith('FAIL')) || errs.length ? 1 : 0);
