// Drives the single Sign in / Sign out button (#auth-btn, existing .btn.alt.sm styles) in the existing <header>.
// It stays hidden (display:none) unless Firebase is configured, so without a config file the page looks unchanged.
import { onUserChanged, signInWithGoogle, signOutUser } from './auth.js';

export async function mountAuthButton(header = document.querySelector('header')) {
  const btn = document.getElementById('auth-btn');
  if (!header || !btn) return;
  let user = null, busy = false;
  const label = () => { btn.textContent = user ? 'Sign out' : 'Sign in'; btn.title = user ? `Signed in as ${user.email || user.name || 'your account'}` : 'Sign in with Google to save your trip to your account'; };
  btn.addEventListener('click', async () => {
    if (busy) return; busy = true; btn.disabled = true;
    try { user ? await signOutUser() : await signInWithGoogle(); }
    catch (e) {
      console.warn('[PuneTrail] Auth action failed:', e?.code || e);
      if (!user) { btn.textContent = 'Sign-in failed'; setTimeout(() => { if (!user) label(); }, 3000); }
    }
    btn.disabled = false; busy = false;
  });
  await onUserChanged((u, configured) => { if (!configured) return; user = u; btn.style.display = ''; label(); });
}
