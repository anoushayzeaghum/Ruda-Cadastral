import * as turf from '@turf/turf';

function ringArea(coords) {
  let area = 0;
  if (!coords || coords.length === 0) return 0;

  for (let i = 0, len = coords.length; i < len; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % len];
    const lon1 = (p1[0] * Math.PI) / 180;
    const lat1 = (p1[1] * Math.PI) / 180;
    const lon2 = (p2[0] * Math.PI) / 180;
    const lat2 = (p2[1] * Math.PI) / 180;
    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  return (Math.abs(area) * 6378137 * 6378137) / 2.0;
}

const coords = [
  [74.3000, 31.5000],
  [74.3001, 31.5000],
  [74.3001, 31.5001],
  [74.3000, 31.5001],
  [74.3000, 31.5000]
];

const feature = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [coords]
  }
};

const manualArea = ringArea(coords);
const turfArea = turf.area(feature);

console.log('Manual Area:', manualArea);
console.log('Turf Area:', turfArea);
console.log('Ratio:', manualArea / turfArea);
