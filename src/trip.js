// Pure trip logic (no DOM) so it can be unit-tested.
import { MAX_WAYPOINTS } from './config.js';
export const addStop = (trip, id) => (trip.includes(id) ? trip : [...trip, id]);
export const removeStop = (trip, id) => trip.filter(x => x !== id);
export function moveStop(trip, id, delta) {
  const i = trip.indexOf(id), j = i + delta;
  if (i < 0 || j < 0 || j >= trip.length) return trip;
  const t = [...trip]; [t[i], t[j]] = [t[j], t[i]]; return t;
}
export const filterByCategory = (list, active) => list.filter(d => active.has(d.category));
export function haversineKm(a, b) {
  const r = Math.PI / 180, x = Math.sin((b.lat - a.lat) * r / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin((b.lng - a.lng) * r / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(x));
}
// Google Maps directions links. origin: optional {lat,lng} (user's location, if shared).
// Returns an array of URLs; long routes are split because Maps URLs allow limited waypoints.
export function directionsUrls(stops, origin = null, mode = 'driving') {
  const pts = [...(origin ? [origin] : []), ...stops].map(p => `${p.lat},${p.lng}`);
  if (pts.length < 2) return [];
  const out = [], size = MAX_WAYPOINTS + 2;
  for (let i = 0; i < pts.length - 1; i += size - 1) {
    const c = pts.slice(i, i + size);
    if (c.length < 2) break;
    const mid = c.slice(1, -1);
    out.push(`https://www.google.com/maps/dir/?api=1&origin=${c[0]}&destination=${c.at(-1)}&travelmode=${mode}` + (mid.length ? `&waypoints=${mid.join('%7C')}` : ''));
  }
  return out;
}
