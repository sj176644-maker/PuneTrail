// Firestore persistence for one user's current trip: users/{uid}/trips/current { stops: [destinationId], updatedAt }
const ref = (fb, uid) => fb.fs.doc(fb.db, 'users', uid, 'trips', 'current');
export async function loadTrip(fb, uid) { const s = await fb.fs.getDoc(ref(fb, uid)); return s.exists() && Array.isArray(s.data().stops) ? s.data().stops : null; }
export async function saveTrip(fb, uid, stops) { await fb.fs.setDoc(ref(fb, uid), { stops, updatedAt: fb.fs.serverTimestamp() }); }
// Union keeping saved order first, then local additions; unknown ids dropped.
export const mergeTrips = (remote, local, isValid) => [...new Set([...(remote || []), ...(local || [])])].filter(isValid);
