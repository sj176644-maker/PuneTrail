import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeTrips, loadTrip, saveTrip } from '../src/firebase/tripStore.js';
import { loadFirebaseConfig } from '../src/firebase/client.js';
const ok = id => ['a', 'b', 'c'].includes(id);
test('mergeTrips: saved order first, local added, dupes and unknown dropped', () => {
  assert.deepEqual(mergeTrips(['b', 'a'], ['a', 'c', 'zzz'], ok), ['b', 'a', 'c']);
  assert.deepEqual(mergeTrips(null, ['a'], ok), ['a']); assert.deepEqual(mergeTrips(null, null, ok), []);
});
test('tripStore reads/writes users/{uid}/trips/current via injected Firestore', async () => {
  const db = {}, fb = { db: 'DB', fs: { doc: (d, ...p) => p.join('/'), getDoc: async p => ({ exists: () => p in db, data: () => db[p] }), setDoc: async (p, v) => { db[p] = v; }, serverTimestamp: () => 'TS' } };
  assert.equal(await loadTrip(fb, 'u1'), null);
  await saveTrip(fb, 'u1', ['a', 'b']);
  assert.deepEqual(db['users/u1/trips/current'], { stops: ['a', 'b'], updatedAt: 'TS' });
  assert.deepEqual(await loadTrip(fb, 'u1'), ['a', 'b']);
});
test('no config.local.js => Firebase disabled (null), no throw', async () => { assert.equal(await loadFirebaseConfig(), null); });
