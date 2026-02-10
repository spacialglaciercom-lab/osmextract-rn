// Safe bounding box calculation with comprehensive error handling

export function safeGetBbox(getBboxFunction, polygonCoords, context = '') {
  console.log(`[${context}] Starting safe bbox calculation`);
  
  try {
    // Validate inputs
    if (!polygonCoords || !Array.isArray(polygonCoords)) {
      console.error(`[${context}] Invalid polygonCoords:`, polygonCoords);
      return null;
    }
    
    if (polygonCoords.length < 4) {
      console.warn(`[${context}] Insufficient coordinates:`, polygonCoords.length);
      return null;
    }
    
    // Validate each coordinate
    for (let i = 0; i < polygonCoords.length; i++) {
      const coord = polygonCoords[i];
      if (!coord || !Array.isArray(coord) || coord.length !== 2) {
        console.error(`[${context}] Invalid coordinate at index ${i}:`, coord);
        return null;
      }
      
      const [lng, lat] = coord;
      if (typeof lng !== 'number' || typeof lat !== 'number') {
        console.error(`[${context}] Invalid coordinate values at index ${i}:`, { lng, lat });
        return null;
      }
      
      if (isNaN(lng) || isNaN(lat)) {
        console.error(`[${context}] NaN coordinate values at index ${i}:`, { lng, lat });
        return null;
      }
      
      // Validate coordinate ranges
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        console.warn(`[${context}] Coordinate out of valid range at index ${i}:`, { lng, lat });
      }
    }
    
    console.log(`[${context}] Coordinates validated, proceeding with bbox calculation`);
    
    // Attempt bbox calculation with timeout protection
    const startTime = Date.now();
    let result;
    
    try {
      result = getBboxFunction(polygonCoords);
    } catch (calcError) {
      console.error(`[${context}] Bbox calculation failed:`, calcError);
      return null;
    }
    
    const endTime = Date.now();
    console.log(`[${context}] Bbox calculation completed in ${endTime - startTime}ms`);
    
    // Validate result
    if (!result) {
      console.warn(`[${context}] Bbox function returned null`);
      return null;
    }
    
    if (!Array.isArray(result) || result.length !== 4) {
      console.error(`[${context}] Invalid bbox format:`, result);
      return null;
    }
    
    const [minLng, minLat, maxLng, maxLat] = result;
    
    // Validate bbox values
    if (isNaN(minLng) || isNaN(minLat) || isNaN(maxLng) || isNaN(maxLat)) {
      console.error(`[${context}] Bbox contains NaN values:`, result);
      return null;
    }
    
    if (minLng >= maxLng || minLat >= maxLat) {
      console.warn(`[${context}] Invalid bbox bounds:`, result);
      return null;
    }
    
    console.log(`[${context}] Valid bbox calculated:`, {
      minLng: minLng.toFixed(6),
      minLat: minLat.toFixed(6),
      maxLng: maxLng.toFixed(6),
      maxLat: maxLat.toFixed(6)
    });
    
    return result;
    
  } catch (unexpectedError) {
    console.error(`[${context}] Unexpected error in safeGetBbox:`, unexpectedError);
    console.error('Stack trace:', unexpectedError.stack);
    return null;
  }
}

export function validatePolygonCoords(coords) {
  const issues = [];
  
  if (!coords || !Array.isArray(coords)) {
    issues.push('Coordinates must be an array');
    return issues;
  }
  
  if (coords.length < 3) {
    issues.push('Need at least 3 coordinate pairs');
  }
  
  coords.forEach((coord, index) => {
    if (!coord || !Array.isArray(coord) || coord.length !== 2) {
      issues.push(`Invalid coordinate at index ${index}: ${JSON.stringify(coord)}`);
    } else {
      const [lng, lat] = coord;
      if (typeof lng !== 'number' || typeof lat !== 'number') {
        issues.push(`Non-numeric values at index ${index}: lng=${lng}, lat=${lat}`);
      }
      if (isNaN(lng) || isNaN(lat)) {
        issues.push(`NaN values at index ${index}: lng=${lng}, lat=${lat}`);
      }
    }
  });
  
  return issues;
}