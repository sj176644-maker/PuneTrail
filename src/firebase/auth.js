import { getFirebase } from './client.js';
// cb(user|null, configured). user = { uid, name, email }. Returns an unsubscribe function.
export async function onUserChanged(cb) {
  const fb = await getFirebase();
  if (!fb) { cb(null, false); return () => {}; }
  return fb.authFns.onAuthStateChanged(fb.auth, u => cb(u ? { uid: u.uid, name: u.displayName, email: u.email } : null, true));
}
export async function signInWithGoogle() {
  const fb = await getFirebase(); if (!fb) throw new Error('Firebase is not configured.');
  return fb.authFns.signInWithPopup(fb.auth, new fb.authFns.GoogleAuthProvider());
}
export async function signOutUser() { const fb = await getFirebase(); if (fb) await fb.authFns.signOut(fb.auth); }
