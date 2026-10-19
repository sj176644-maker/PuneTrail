# PuneTrail (prototype)
Pune tourism map and trip checkpoints. **No Google Maps API key or billing needed.**
Map: Leaflet + OpenStreetMap tiles. External navigation: plain Google Maps URLs.

## Run locally
Requires Node 18+ and internet access (for `npm install` and map tiles).
```
npm install     # installs Leaflet and copies it to ./vendor/leaflet
npm start       # http://localhost:3000
```
(Any static server works after `npm install`, e.g. `npx serve .`. Open it over http://, not file://, because the app uses ES modules.)

## Tests
```
npm test            # unit tests (trip logic, data shape, Google Maps URL building)
npm run test:e2e    # browser test (needs `npm i -D playwright`); uses a small Leaflet STUB unless you pass --real
```

## Structure
- `src/destinations.js` data (id, name, category, lat/lng, description, optional image and visit minutes, Google Maps link)
- `src/config.js` tile provider, map centre, waypoint limit; optional git-ignored `src/config.local.js` overrides `tileProvider`
- `src/trip.js` pure logic (add/remove/reorder, filters, directions URLs)
- `src/mapView.js` Leaflet rendering; `src/main.js` page logic; `index.html`, `styles.css`

## Changing the tile provider
Edit `TILE_PROVIDER` in `src/config.js` (url, attribution, maxZoom), or export `tileProvider` from `src/config.local.js`. If a provider needs a key, keep it only in `config.local.js` (git-ignored). No map component changes are needed.

## Tile policy
Default is OSM's public tile server: fine for a low-traffic prototype, attribution is shown, tiles load only as the user pans/zooms, nothing is prefetched or bulk-downloaded. For real traffic, switch to a hosted provider or your own tile server. https://operations.osmfoundation.org/policies/tiles/

## Honest limits
- The orange dashed line only joins stops in order. It is **not a road route**. No travel times, restaurants, ratings or hours are generated.
- Coordinates and visit durations are approximate samples; check access rules and timings locally.
- Google Maps opens in a new tab; it is not embedded. Long routes are split into several links (waypoint limit).
- Trips are saved in this browser only.

## Firebase (optional; no UI changes)
Adds cloud saving of the current trip for signed-in users. **Without a config file the app behaves exactly as before** (localStorage only, no Firebase code downloaded).
1. Create a Firebase project; enable **Authentication > Google** and **Firestore**; add your site's domain under Authentication > Settings > Authorized domains (`localhost` is allowed by default).
2. Register a Web app, copy its config into `src/firebase/config.local.js` (template: `src/firebase/config.example.js`; the file is git-ignored). The web config is an identifier, not a secret; Firestore rules are what protect data.
3. Publish the rules in `firestore.rules` (users can only read/write `users/{their uid}/trips/*`): `npx firebase-tools deploy --only firestore:rules` (this deploys; run it yourself when ready).
- Data: `users/{uid}/trips/current { stops: [destinationId...], updatedAt }`. On sign-in the local and saved trips are merged (union, saved order first).
- A small **Sign in / Sign out** button (Google) appears in the header only when `config.local.js` exists; otherwise it stays hidden and the site is unchanged.
- Tests: `npm test` (includes Firebase logic); `npm run test:e2e` runs the wiring against FAKE in-memory Firebase modules, not a real project.
