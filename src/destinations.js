// Sample destination data. Coordinates are approximate; durations are rough estimates.
// Replace this file (or its source) with real data later; the rest of the app only reads this shape:
// { id, name, category, lat, lng, description, image?, visitMinutes?, mapsUrl }
export const CATEGORIES = {
  fort: { label: 'Forts & Treks', color: '#1f4d36' },
  heritage: { label: 'Heritage', color: '#8a5a2b' },
  spiritual: { label: 'Spiritual', color: '#7b3f98' },
  nature: { label: 'Nature', color: '#1f6fa8' },
};
export const googleMapsPlaceUrl = (lat, lng) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
const d = (id, name, category, lat, lng, description, visitMinutes, image = null) =>
  ({ id, name, category, lat, lng, description, visitMinutes, image, mapsUrl: googleMapsPlaceUrl(lat, lng) });
export const DESTINATIONS = [
  d('sinhagad', 'Sinhagad Fort', 'fort', 18.3663, 73.7558, 'Hill fort southwest of Pune, popular for day treks. Check current access rules locally.', 240),
  d('rajgad', 'Rajgad Fort', 'fort', 18.2465, 73.6827, 'Large former capital fort in the Sahyadris; a long trek that needs an early start.', 420),
  d('torna', 'Torna Fort', 'fort', 18.2766, 73.6221, 'High fort known for steep climbs and views; slippery in monsoon.', 360),
  d('purandar', 'Purandar Fort', 'fort', 18.2858, 73.9786, 'Twin-fort complex southeast of Pune; parts may be restricted, so check locally.', 240),
  d('lohagad', 'Lohagad Fort', 'fort', 18.7106, 73.4764, 'Fort near Lonavala/Malavli with a stepped route; slippery and crowded in monsoon.', 210),
  d('visapur', 'Visapur Fort', 'fort', 18.7143, 73.4837, 'Neighbour of Lohagad, often paired with it; steep, slippery rock in rain.', 210),
  d('shaniwar', 'Shaniwar Wada', 'heritage', 18.5195, 73.8553, 'Historic Peshwa-era fortification in old Pune. Check current timings before visiting.', 90),
  d('aga', 'Aga Khan Palace', 'heritage', 18.5522, 73.9016, 'Landmark palace and memorial in Yerawada. Check current timings before visiting.', 90),
  d('dagdusheth', 'Dagdusheth Halwai Ganpati Temple', 'spiritual', 18.5164, 73.8561, 'Well-known Ganpati temple in central Pune; can be crowded on festival days.', 45),
  d('parvati', 'Parvati Hill', 'spiritual', 18.4966, 73.8426, 'Hilltop temple complex with city views, reached by steps.', 90),
  d('khadakwasla', 'Khadakwasla Dam', 'nature', 18.4420, 73.7660, 'Reservoir and dam viewpoint on the edge of Pune.', 75),
];
