import test from 'node:test';
import assert from 'node:assert/strict';
import { addStop, removeStop, moveStop, filterByCategory, directionsUrls, haversineKm } from '../src/trip.js';
import { DESTINATIONS, CATEGORIES } from '../src/destinations.js';
test('destinations have required fields', () => {
  const need=['sinhagad','rajgad','torna','purandar','lohagad','visapur','shaniwar','aga','dagdusheth','parvati','khadakwasla'];
  assert.deepEqual(need.filter(i=>!DESTINATIONS.some(d=>d.id===i)),[]); assert.equal(DESTINATIONS.length,11);
  for (const d of DESTINATIONS) {
    assert.ok(d.id && d.name && CATEGORIES[d.category] && d.description);
    assert.ok(d.lat > 17 && d.lat < 20 && d.lng > 73 && d.lng < 75);
    assert.match(d.mapsUrl, /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
  }
  assert.equal(new Set(DESTINATIONS.map(d => d.id)).size, DESTINATIONS.length);
});
test('add/remove/move', () => {
  let t = addStop(addStop([], 'a'), 'b'); assert.deepEqual(addStop(t, 'a'), ['a', 'b']);
  assert.deepEqual(moveStop(t, 'b', -1), ['b', 'a']); assert.deepEqual(moveStop(t, 'a', -1), ['a', 'b']);
  assert.deepEqual(removeStop(t, 'a'), ['b']);
});
test('category filter', () => {
  const r = filterByCategory(DESTINATIONS, new Set(['fort']));
  assert.ok(r.length && r.every(d => d.category === 'fort'));
  assert.equal(filterByCategory(DESTINATIONS, new Set()).length, 0);
});
test('directions urls: order, waypoints, splitting, no key', () => {
  const S = n => Array.from({ length: n }, (_, i) => ({ lat: 18 + i / 100, lng: 73 + i / 100 }));
  assert.deepEqual(directionsUrls(S(1)), []);
  const u = directionsUrls(S(3))[0];
  assert.match(u, /origin=18,73&destination=18.02,73.02/); assert.match(u, /waypoints=18.01,73.01/); assert.ok(!/key=/.test(u));
  assert.equal(directionsUrls(S(11)).length, 1); assert.equal(directionsUrls(S(12)).length, 2);
  assert.match(directionsUrls(S(1), { lat: 1, lng: 2 })[0], /origin=1,2/);
});
test('haversine sanity', () => { assert.ok(Math.abs(haversineKm({ lat: 18.52, lng: 73.85 }, { lat: 18.3663, lng: 73.7558 }) - 20) < 4); });
