// Lazy Firebase initialisation. Nothing is loaded from the network unless config.local.js exists.
// Uses Firebase's official browser ES modules from the gstatic CDN (no bundler needed). Pin the version here.
const VERSION = '10.14.1';
const BASE = `https://www.gstatic.com/firebasejs/${VERSION}/`;
const REQUIRED = ['apiKey', 'authDomain', 'projectId', 'appId'];
let pending = null;

export async function loadFirebaseConfig() {
  try {
    const { firebaseConfig } = await import('./config.local.js');
    return firebaseConfig && REQUIRED.every(k => typeof firebaseConfig[k] === 'string' && firebaseConfig[k].trim()) ? firebaseConfig : null;
  } catch { return null; }
}
// Resolves to { auth, authFns, db, fs } or null when Firebase is not configured / failed to load.
export function getFirebase() {
  pending ??= (async () => {
    const cfg = await loadFirebaseConfig();
    if (!cfg) return null;
    try {
      const [app, authFns, fs] = await Promise.all([import(BASE + 'firebase-app.js'), import(BASE + 'firebase-auth.js'), import(BASE + 'firebase-firestore.js')]);
      const a = app.initializeApp(cfg);
      return { auth: authFns.getAuth(a), authFns, db: fs.getFirestore(a), fs };
    } catch (e) { console.warn('[PuneTrail] Firebase failed to load; continuing with local storage only.', e); return null; }
  })();
  return pending;
}
