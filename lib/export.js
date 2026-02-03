function escapeXml(unsafe) {
  if (unsafe == null) return '';
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function getFilteredTags(props) {
  const filtered = { ...(props || {}) };
  delete filtered.id;
  delete filtered.type;
  delete filtered.timestamp;
  delete filtered.version;
  delete filtered.changeset;
  delete filtered.user;
  delete filtered.uid;
  delete filtered.osm_type;
  if (Object.keys(filtered).length === 0) {
    filtered.note = 'Extracted from OSM Boundary Extractor';
  }
  return filtered;
}

/**
 * Convert GeoJSON FeatureCollection to OSM XML (JOSM-compatible).
 */
export function toOSM(geojson) {
  if (!geojson?.features?.length) return '';

  let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
  geojson.features.forEach((feature) => {
    const geometry = feature.geometry;
    let coords = [];
    if (geometry?.type === 'Point') coords = [geometry.coordinates];
    else if (geometry?.type === 'LineString') coords = geometry.coordinates || [];
    else if (geometry?.type === 'Polygon') coords = geometry.coordinates?.[0] || [];
    coords.forEach(([lon, lat]) => {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
    });
  });

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<osm version="0.6" generator="OSM Boundary Extractor" copyright="OpenStreetMap and contributors" attribution="http://www.openstreetmap.org/copyright" license="http://opendatacommons.org/licenses/odbl/1-0/">\n';
  xml += `  <bounds minlat="${minLat.toFixed(7)}" minlon="${minLon.toFixed(7)}" maxlat="${maxLat.toFixed(7)}" maxlon="${maxLon.toFixed(7)}"/>\n\n`;

  let nodeId = 900000000;
  let wayId = 950000000;
  const nodeMap = new Map();
  const timestamp = new Date().toISOString();

  geojson.features.forEach((feature) => {
    const geometry = feature.geometry;
    if (geometry?.type === 'Point') {
      const [lon, lat] = geometry.coordinates;
      const id = nodeId++;
      nodeMap.set(`${lon},${lat}`, id);
      xml += `  <node id="${id}" visible="true" version="1" changeset="1" timestamp="${timestamp}" user="OSM_Extractor" uid="1" lat="${lat.toFixed(7)}" lon="${lon.toFixed(7)}"`;
      const tags = getFilteredTags(feature.properties);
      if (Object.keys(tags).length > 0) {
        xml += '>\n';
        Object.entries(tags).forEach(([k, v]) => {
          xml += `    <tag k="${escapeXml(k)}" v="${escapeXml(String(v))}"/>\n`;
        });
        xml += '  </node>\n';
      } else {
        xml += '/>\n';
      }
    } else if (geometry?.type === 'LineString' || geometry?.type === 'Polygon') {
      const coords = geometry.type === 'Polygon' ? geometry.coordinates[0] : geometry.coordinates;
      (coords || []).forEach(([lon, lat]) => {
        const key = `${lon},${lat}`;
        if (!nodeMap.has(key)) {
          const id = nodeId++;
          nodeMap.set(key, id);
          xml += `  <node id="${id}" visible="true" version="1" changeset="1" timestamp="${timestamp}" user="OSM_Extractor" uid="1" lat="${lat.toFixed(7)}" lon="${lon.toFixed(7)}"/>\n`;
        }
      });
    }
  });

  xml += '\n';

  geojson.features.forEach((feature) => {
    const geometry = feature.geometry;
    if (geometry?.type === 'LineString' || geometry?.type === 'Polygon') {
      const id = wayId++;
      const coords = geometry.type === 'Polygon' ? geometry.coordinates[0] : geometry.coordinates;
      xml += `  <way id="${id}" visible="true" version="1" changeset="1" timestamp="${timestamp}" user="OSM_Extractor" uid="1">\n`;
      (coords || []).forEach(([lon, lat]) => {
        const nodeRef = nodeMap.get(`${lon},${lat}`);
        if (nodeRef != null) xml += `    <nd ref="${nodeRef}"/>\n`;
      });
      const tags = getFilteredTags(feature.properties);
      Object.entries(tags).forEach(([k, v]) => {
        xml += `    <tag k="${escapeXml(k)}" v="${escapeXml(String(v))}"/>\n`;
      });
      xml += '  </way>\n';
    }
  });

  xml += '</osm>\n';
  return xml;
}

/**
 * Convert GeoJSON FeatureCollection to CSV string.
 */
export function toCSV(geojson) {
  if (!geojson?.features?.length) return '';

  const rows = [
    [
      'id',
      'type',
      'name',
      'lat',
      'lon',
      'category',
      'geometry_type',
      'all_tags',
    ],
  ];

  geojson.features.forEach((f) => {
    const props = f.properties || {};
    let coords = [0, 0];
    const geom = f.geometry;

    if (geom?.type === 'Point') {
      coords = geom.coordinates;
    } else if (geom?.type === 'LineString' && geom.coordinates?.length) {
      const mid = Math.floor(geom.coordinates.length / 2);
      coords = geom.coordinates[mid];
    } else if (geom?.type === 'Polygon' && geom.coordinates?.[0]?.length) {
      const ring = geom.coordinates[0];
      let sumLng = 0,
        sumLat = 0;
      for (let i = 0; i < ring.length - 1; i++) {
        sumLng += ring[i][0];
        sumLat += ring[i][1];
      }
      coords = [sumLng / (ring.length - 1), sumLat / (ring.length - 1)];
    }

    const category = props.highway
      ? 'highway'
      : props.building
        ? 'building'
        : props.amenity
          ? 'amenity'
          : props.natural
            ? 'natural'
            : props.landuse
              ? 'landuse'
              : props.waterway
                ? 'waterway'
                : 'other';
    const name =
      props.name ||
      props.amenity ||
      props.highway ||
      props.building ||
      props.natural ||
      '';
    const cleanTags = { ...props };
    delete cleanTags.id;

    rows.push([
      String(props.id ?? ''),
      geom?.type ?? '',
      name,
      coords[1],
      coords[0],
      category,
      geom?.type ?? '',
      JSON.stringify(cleanTags).replace(/"/g, '""'),
    ]);
  });

  return rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}
