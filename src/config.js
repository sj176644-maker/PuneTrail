// Map configuration. To change the tile provider, edit TILE_PROVIDER below, or create
// src/config.local.js (git-ignored) exporting `tileProvider` to override it. No secrets in this file.
// Default: OpenStreetMap standard tiles, fine for a low-traffic prototype under
// https://operations.osmfoundation.org/policies/tiles/ (attribution required, valid Referer,
// no bulk downloading/prefetching, no heavy use). Use another provider for production.
export const TILE_PROVIDER = {
  name: 'OpenStreetMap',
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
  attributionText: '© OpenStreetMap contributors',
  maxZoom: 19,
  // If a provider needs an API key, put the URL (with key) in src/config.local.js, never here.
};
export const MAP_CENTER = [18.5204, 73.8567]; // Pune
export const MAP_ZOOM = 9;
export const MAX_WAYPOINTS = 9; // Google Maps URL waypoint limit per link
export async function loadTileProvider() {
  try { const m = await import('./config.local.js'); return { ...TILE_PROVIDER, ...m.tileProvider }; }
  catch { return TILE_PROVIDER; }
}
