// Connects the existing trip state to Firebase WITHOUT touching the UI. If Firebase is not configured,
// or nobody is signed in, every call is a no-op and the app behaves exactly as before.
import { getFirebase } from './client.js';
import { onUserChanged, signInWithGoogle, signOutUser } from './auth.js';
import { loadTrip, saveTrip, mergeTrips } from './tripStore.js';
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

export function attachCloudSync({ getTrip, setTrip, isValid }) {
  let uid = null, timer = null, status = 'disabled';
  onUserChanged(async (user, configured) => {
    if (!configured) { status = 'disabled'; return; }
    if (!user) { uid = null; status = 'signed-out'; return; }
    uid = user.uid; status = 'syncing';
    try {
      const fb = await getFirebase(), remote = await loadTrip(fb, uid), merged = mergeTrips(remote, getTrip(), isValid);
      if (!same(merged, getTrip())) setTrip(merged);
      if (!remote || !same(merged, remote)) await saveTrip(fb, uid, merged);
      status = 'synced';
    } catch (e) { status = 'error'; console.warn('[PuneTrail] Cloud sync failed; your trip is still saved in this browser.', e); }
  });
  return {
    get status() { return status; },
    signIn: signInWithGoogle, signOut: signOutUser,
    notify() { // call after each local change; debounced write when signed in
      if (!uid) return; clearTimeout(timer);
      timer = setTimeout(async () => { try { await saveTrip(await getFirebase(), uid, getTrip()); status = 'synced'; } catch (e) { status = 'error'; console.warn('[PuneTrail] Cloud save failed.', e); } }, 500);
    },
  };
}
