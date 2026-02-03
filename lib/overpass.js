import { getPolygon } from './geo';
import { point } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
];

const TAG_QUERIES = {
  amenity: [
    'node["amenity"~"restaurant|cafe|bank|hospital|school|pharmacy|library|post_office|police|fire_station"](bbox);',
    'way["amenity"~"restaurant|cafe|bank|hospital|school|pharmacy|library|post_office|police|fire_station"](bbox);',
  ],
  highway: [
    'way["highway"~"motorway|trunk|primary|secondary|tertiary|residential|service|footway|cycleway|path"](bbox);',
  ],
  building: ['way["building"](bbox);', 'relation["building"](bbox);'],
  natural: [
    'node["natural"~"tree|peak|water|wood"](bbox);',
    'way["natural"~"water|wood|grassland|scrub"](bbox);',
  ],
  landuse: [
    'way["landuse"~"residential|commercial|industrial|retail|forest|farmland|grass"](bbox);',
  ],
  waterway: ['way["waterway"~"river|stream|canal|drain"](bbox);'],
  shop: ['node["shop"](bbox);', 'way["shop"](bbox);'],
  leisure: [
    'way["leisure"~"park|playground|sports_centre|pitch|garden"](bbox);',
    'node["leisure"~"playground"](bbox);',
  ],
};

/**
 * Build Overpass QL query. bbox is [minLng, minLat, maxLng, maxLat].
 */
export function buildOverpassQuery(bbox, categories) {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const bboxStr = `${minLat},${minLng},${maxLat},${maxLng}`;

  let queries = [];
  categories.forEach((cat) => {
    if (TAG_QUERIES[cat]) {
      queries.push(...TAG_QUERIES[cat].map((q) => q.replace('bbox', bboxStr)));
    }
  });

  if (queries.length === 0) {
    queries.push(`way["highway"](${bboxStr});`);
  }

  const queryString = queries.join('\n  ');
  return `[out:json][timeout:90][bbox:${bboxStr}];
(
  ${queryString}
);
out body;
>;
out skel qt;`;
}

/**
 * Fetch from Overpass API with retries.
 */
export async function fetchOverpass(query, onProgress) {
  let lastError = null;
  for (let i = 0; i < OVERPASS_ENDPOINTS.length; i++) {
    try {
      onProgress?.(`Trying endpoint ${i + 1}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const response = await fetch(OVERPASS_ENDPOINTS[i], {
        method: 'POST',
        body: query,
        signal: controller.signal,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('All Overpass endpoints failed');
}

/**
 * Process raw Overpass response into GeoJSON FeatureCollection, filtered by polygon.
 */
export function processOSMData(data, polygonCoords) {
  const polygon = getPolygon(polygonCoords);
  if (!polygon || !data?.elements) {
    return { type: 'FeatureCollection', features: [], metadata: {} };
  }

  const nodes = {};
  data.elements.filter((e) => e.type === 'node').forEach((node) => {
    nodes[node.id] = {
      lon: node.lon,
      lat: node.lat,
      tags: node.tags || {},
    };
  });

  const features = [];

  data.elements.forEach((element) => {
    if (!element.tags || Object.keys(element.tags).length === 0) return;

    let geometry = null;
    let centerLngLat = null;

    if (element.type === 'node') {
      geometry = { type: 'Point', coordinates: [element.lon, element.lat] };
      centerLngLat = [element.lon, element.lat];
    } else if (element.type === 'way' && element.nodes?.length >= 2) {
      const coords = element.nodes
        .map((id) => nodes[id])
        .filter((n) => n && n.lon != null && n.lat != null)
        .map((n) => [n.lon, n.lat]);

      if (coords.length < 2) return;

      const isClosed =
        coords.length >= 4 &&
        Math.abs(coords[0][0] - coords[coords.length - 1][0]) < 1e-10 &&
        Math.abs(coords[0][1] - coords[coords.length - 1][1]) < 1e-10;

      if (
        isClosed &&
        (element.tags.building ||
          element.tags.landuse ||
          element.tags.natural ||
          element.tags.leisure)
      ) {
        geometry = { type: 'Polygon', coordinates: [coords] };
      } else {
        geometry = { type: 'LineString', coordinates: coords };
      }
      const mid = Math.floor(coords.length / 2);
      centerLngLat = coords[mid];
    }

    if (!geometry || !centerLngLat) return;
    if (!booleanPointInPolygon(point(centerLngLat), polygon)) return;

    features.push({
      type: 'Feature',
      properties: { id: element.id, osm_type: element.type, ...element.tags },
      geometry,
    });
  });

  return {
    type: 'FeatureCollection',
    features,
    metadata: {
      timestamp: new Date().toISOString(),
      featureCount: features.length,
      source: 'OpenStreetMap',
      extractor: 'OSM Boundary Extractor (React Native)',
    },
  };
}
