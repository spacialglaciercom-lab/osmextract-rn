import bbox from '@turf/bbox';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import area from '@turf/area';
import { polygon as turfPolygon, point } from '@turf/helpers';

/**
 * Get GeoJSON polygon from array of [lng, lat] (closed ring).
 * @param {number[][]} coords - Array of [lng, lat], should include closing point
 */
export function getPolygon(coords) {
  if (!coords || coords.length < 4) return null;
  return turfPolygon([coords]);
}

/**
 * Get bbox [minLng, minLat, maxLng, maxLat] from polygon coordinates.
 * @param {number[][]} coords - Closed ring of [lng, lat]
 */
export function getBbox(coords) {
  const poly = getPolygon(coords);
  if (!poly) return null;
  return bbox(poly);
}

/**
 * Check if point [lng, lat] is inside polygon (closed ring of [lng, lat]).
 */
export function isPointInPolygon(lngLat, polygonCoords) {
  const poly = getPolygon(polygonCoords);
  if (!poly) return false;
  return booleanPointInPolygon(point(lngLat), poly);
}

/**
 * Area of polygon in km².
 * @param {number[][]} coords - Closed ring of [lng, lat]
 */
export function getAreaKm2(coords) {
  const poly = getPolygon(coords);
  if (!poly) return 0;
  return area(poly) / 1_000_000;
}

/**
 * Sort points clockwise around centroid and close the ring.
 * @param {number[][]} points - Array of [lng, lat]
 */
export function sortPolygonCoords(points) {
  if (points.length < 3) return null;
  const centroid = points.reduce(
    (acc, p) => [acc[0] + p[0], acc[1] + p[1]],
    [0, 0]
  );
  centroid[0] /= points.length;
  centroid[1] /= points.length;
  const sorted = [...points].sort((a, b) => {
    const angleA = Math.atan2(a[1] - centroid[1], a[0] - centroid[0]);
    const angleB = Math.atan2(b[1] - centroid[1], b[0] - centroid[0]);
    return angleA - angleB;
  });
  return [...sorted, sorted[0]];
}
