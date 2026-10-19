import { loadTileProvider } from './config.js';
import { CATEGORIES, DESTINATIONS } from './destinations.js';
import { addStop, removeStop, moveStop, filterByCategory, haversineKm, directionsUrls } from './trip.js';
import { createMapView } from './mapView.js';
import { attachCloudSync } from './firebase/cloudSync.js';
import { mountAuthButton } from './firebase/authButton.js';

const $ = s => document.querySelector(s);
const byId = id => DESTINATIONS.find(d => d.id === id);
let cloud = null; // Firebase sync; stays null/no-op unless Firebase is configured and a user is signed in
const store = { get() { try { return JSON.parse(localStorage.getItem('pt_trip')) || [] } catch { return [] } }, raw(v) { try { localStorage.setItem('pt_trip', JSON.stringify(v)) } catch {} }, set(v) { this.raw(v); cloud?.notify(); } };
const state = { cats: new Set(Object.keys(CATEGORIES)), trip: store.get().filter(byId), user: null, mode: 'driving' };
let view = null;

function el(tag, attrs = {}, ...kids) { const n = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) v == null ? 0 : k === 'class' ? n.className = v : k.startsWith('on') ? n.addEventListener(k.slice(2), v) : n.setAttribute(k, v); n.append(...kids.filter(k => k != null)); return n; }
function toggle(id) { state.trip = state.trip.includes(id) ? removeStop(state.trip, id) : addStop(state.trip, id); store.set(state.trip); render(); }

function renderFilters() {
  $('#filters').replaceChildren(...Object.entries(CATEGORIES).map(([k, c]) =>
    el('button', { class: 'chip', type: 'button', 'aria-pressed': String(state.cats.has(k)), onclick: () => { state.cats.has(k) ? state.cats.delete(k) : state.cats.add(k); render(); } },
      el('span', { style: `color:${c.color}` }, '● '), c.label)));
  $('#legend').replaceChildren(...Object.values(CATEGORIES).map(c => el('span', {}, el('span', { style: `color:${c.color}` }, '● '), c.label)), el('span', {}, '① numbered = your trip stop'));
}
function renderList(visible) {
  const list = $('#list');
  if (!visible.length) { list.replaceChildren(el('p', { class: 'mut' }, 'No destinations match the selected categories.')); return; }
  list.replaceChildren(...visible.map(d => {
    const inTrip = state.trip.includes(d.id), km = state.user ? haversineKm(state.user, d) : null;
    return el('article', { class: 'card' },
      el('h3', {}, d.name), el('span', { class: 'tag' }, CATEGORIES[d.category].label),
      el('p', {}, d.description),
      el('p', { class: 'mut' }, `${d.visitMinutes ? `Visit ≈ ${Math.round(d.visitMinutes / 6) / 10} h (estimate). ` : ''}${km != null ? `≈${km.toFixed(0)} km straight-line from you (not road distance).` : ''}`),
      el('button', { class: 'btn sm', onclick: () => toggle(d.id) }, inTrip ? '✓ In trip (remove)' : '+ Add to trip'), ' ',
      view?.ok ? el('button', { class: 'btn sm alt', onclick: () => { view.open(d); $('#map').scrollIntoView({ block: 'center' }); } }, 'Show on map') : null, ' ',
      el('a', { class: 'btn sm alt', href: d.mapsUrl, target: '_blank', rel: 'noopener' }, 'Google Maps'));
  }));
}
function renderTrip() {
  const stops = state.trip.map(byId), box = $('#trip');
  const links = directionsUrls(stops, state.user, state.mode);
  box.replaceChildren(
    el('h2', {}, `My trip (${stops.length})`),
    stops.length ? el('ol', {}, ...stops.map((d, i) => el('li', {}, d.name, ' ',
      el('button', { class: 'btn sm alt', 'aria-label': `Move ${d.name} up`, disabled: i === 0 ? '' : null, onclick: () => { state.trip = moveStop(state.trip, d.id, -1); store.set(state.trip); render(); } }, '↑'), ' ',
      el('button', { class: 'btn sm alt', 'aria-label': `Move ${d.name} down`, disabled: i === stops.length - 1 ? '' : null, onclick: () => { state.trip = moveStop(state.trip, d.id, 1); store.set(state.trip); render(); } }, '↓'), ' ',
      el('button', { class: 'btn sm alt', onclick: () => toggle(d.id) }, 'Remove'))))
      : el('p', { class: 'mut' }, 'No stops yet. Add destinations from the map or list.'),
    el('label', {}, 'Travel mode for Google Maps ', el('select', { id: 'mode', onchange: e => { state.mode = e.target.value; render(); } },
      ...[['driving', 'Driving'], ['two-wheeler', 'Two-wheeler'], ['transit', 'Public transport'], ['walking', 'Walking']].map(([v, l]) => el('option', { value: v, selected: v === state.mode ? '' : null }, l)))),
    el('div', { class: 'row' }, ...(links.length ? links.map((u, i) => el('a', { class: 'btn', id: 'directions', href: u, target: '_blank', rel: 'noopener' }, `Open directions in Google Maps${links.length > 1 ? ` (part ${i + 1})` : ''}`))
      : [el('span', { class: 'mut' }, 'Add at least 2 stops (or share your location plus 1 stop) to get directions.')])),
    el('p', { class: 'mut' }, 'The dashed orange line on the map only connects your stops in order. It is a visual guide, not a road route, and no travel times are calculated. Google Maps opens in a new tab with its own routing.'));
}
function render() {
  const visible = filterByCategory(DESTINATIONS, state.cats);
  renderFilters(); renderList(visible); renderTrip();
  view?.ok && view.render(visible, state.trip.map(byId), state.user);
}
function mapError(msg) {
  $('#map-error').hidden = false; $('#map-error').textContent = msg + ' The destination list below still works, and every place has a Google Maps link.';
}
function locate() {
  const msg = $('#geo-msg');
  if (!navigator.geolocation) { msg.textContent = 'Geolocation is not supported by this browser.'; return; }
  if (!confirm('PuneTrail will ask your browser for your location to show it on the map and use it as the start of Google Maps directions. It is not sent to any PuneTrail server. Continue?')) return;
  navigator.geolocation.getCurrentPosition(p => { state.user = { lat: p.coords.latitude, lng: p.coords.longitude }; msg.textContent = 'Location shared. Distances shown are straight-line.'; render(); },
    () => { msg.textContent = 'Location was not shared. You can still plan without it.'; });
}
async function init() {
  const provider = await loadTileProvider();
  $('#attrib').innerHTML = `Map data ${provider.attribution}`;
  view = createMapView($('#map'), provider, { onToggle: toggle, onTileFailure: () => mapError('Map tiles could not be loaded from ' + provider.name + ' (offline, blocked or rate-limited).') });
  if (!view.ok) { $('#map').hidden = true; mapError(view.reason); }
  $('#geo').addEventListener('click', locate);
  $('#clear').addEventListener('click', () => { state.trip = []; store.set([]); render(); });
  render(); view.ok && view.fit(DESTINATIONS);
  cloud = attachCloudSync({ getTrip: () => state.trip, setTrip: ids => { state.trip = ids; store.raw(ids); render(); }, isValid: id => !!byId(id) });
  mountAuthButton(document.querySelector('header'), cloud);
  window.__pt = { state, toggle, view, cloud };
}
init();
