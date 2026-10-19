// Copies Leaflet's built files to ./vendor so any static server can serve them.
import { cpSync, existsSync, mkdirSync } from 'node:fs';
const src = 'node_modules/leaflet/dist';
if (!existsSync(src)) { console.error('Leaflet not found. Run: npm install'); process.exit(1); }
mkdirSync('vendor', { recursive: true });
cpSync(src, 'vendor/leaflet', { recursive: true });
console.log('Leaflet copied to vendor/leaflet');
