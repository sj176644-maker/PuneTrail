// Leaflet rendering. Knows nothing about the page; main.js drives it through this small API.
// Tile provider comes from config, so swapping providers needs no change here.
import { MAP_CENTER, MAP_ZOOM } from './config.js';
import { CATEGORIES } from './destinations.js';
const el = (tag, attrs = {}, ...kids) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) v == null ? 0 : k === 'class' ? n.className = v : k.startsWith('on') ? n.addEventListener(k.slice(2), v) : n.setAttribute(k, v); n.append(...kids.filter(k => k != null)); return n; };

export function createMapView(container, provider, handlers) {
  const L = window.L;
  if (!L) return { ok: false, reason: 'The Leaflet library did not load.' };
  let map;
  try { map = L.map(container, { scrollWheelZoom: false }).setView(MAP_CENTER, MAP_ZOOM); }
  catch (e) { return { ok: false, reason: 'The map could not start.' }; }
  let loaded = 0, failed = 0, warned = false;
  const tiles = L.tileLayer(provider.url, { attribution: provider.attribution, maxZoom: provider.maxZoom });
  tiles.on('tileload', () => { loaded++; });
  tiles.on('tileerror', () => { failed++; if (!warned && loaded === 0 && failed >= 3) { warned = true; handlers.onTileFailure(); } });
  tiles.addTo(map);
  const markers = L.layerGroup().addTo(map), lines = L.layerGroup().addTo(map), me = L.layerGroup().addTo(map);

  function popup(d, inTrip) {
    return el('div', { class: 'popup' },
      el('strong', {}, d.name), el('div', { class: 'mut' }, CATEGORIES[d.category].label),
      d.image ? el('img', { src: d.image, alt: d.name, width: '200', loading: 'lazy' }) : null,
      el('p', {}, d.description),
      d.visitMinutes ? el('div', { class: 'mut' }, `Visit ≈ ${Math.round(d.visitMinutes / 6) / 10} h (estimate)`) : null,
      el('button', { class: 'btn sm', onclick: () => handlers.onToggle(d.id) }, inTrip ? 'Remove from trip' : 'Add to trip'), ' ',
      el('a', { class: 'btn sm alt', href: d.mapsUrl, target: '_blank', rel: 'noopener' }, 'Open in Google Maps'));
  }
  const icon = (d, n) => L.divIcon({ className: '', iconSize: [28, 28], iconAnchor: [14, 14],
    html: n ? `<span class="pin sel" style="background:${CATEGORIES[d.category].color}">${n}</span>` : `<span class="pin" style="background:${CATEGORIES[d.category].color}"></span>` });

  return {
    ok: true,
    // visible: destinations to show; trip: ordered selected destinations
    render(visible, trip, user) {
      markers.clearLayers(); lines.clearLayers(); me.clearLayers();
      const order = new Map(trip.map((d, i) => [d.id, i + 1]));
      const shown = [...visible, ...trip.filter(t => !visible.includes(t))];
      shown.forEach(d => L.marker([d.lat, d.lng], { icon: icon(d, order.get(d.id)), title: d.name, alt: d.name })
        .bindPopup(popup(d, order.has(d.id))).addTo(markers));
      if (trip.length > 1) L.polyline(trip.map(d => [d.lat, d.lng]), { color: '#d9741f', weight: 4, dashArray: '8 8' }).addTo(lines);
      if (user) L.circleMarker([user.lat, user.lng], { radius: 8, color: '#fff', fillColor: '#2a7fb8', fillOpacity: 1, weight: 3 }).bindPopup('Your location (shared by you)').addTo(me);
    },
    fit(list) { if (list.length) map.fitBounds(list.map(d => [d.lat, d.lng]), { padding: [30, 30] }); },
    open(d) { map.setView([d.lat, d.lng], 12); },
    invalidate() { map.invalidateSize(); },
  };
}
