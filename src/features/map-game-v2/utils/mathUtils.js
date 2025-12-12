/**
 * Mathematical utilities for coordinate transformation and vector operations
 * Handles all Mapbox ↔ Three.js coordinate conversions with high precision
 */

/**
 * WebMercator projection constant
 * Mapbox uses Web Mercator (EPSG:3857)
 * Earth circumference = 40075 km at equator
 */
const EARTH_CIRCUMFERENCE = 40075000; // meters
const EARTH_RADIUS = 6371000; // meters (WGS-84)
const MERCATOR_MAX = 20037508.34; // Half of Earth circumference

/**
 * Convert latitude/longitude to Mapbox MercatorCoordinate (0-1 normalized)
 * @param {number} lng - Longitude in degrees (-180 to 180)
 * @param {number} lat - Latitude in degrees (-85.051129 to 85.051129)
 * @returns {object} { x, y } normalized Mercator coordinates (0-1)
 */
export function lngLatToMercator(lng, lat) {
  // Clamp latitude to Web Mercator bounds
  const latRad = (Math.max(-85.051129, Math.min(85.051129, lat)) * Math.PI) / 180;
  
  // Web Mercator projection formula
  const x = ((lng + 180) / 360); // -180 to 180 → 0 to 1
  const y = (1 - Math.log(Math.tan(Math.PI / 4 + latRad / 2)) / Math.PI) / 2; // Mercator Y
  
  return { x, y };
}

/**
 * Convert Mapbox MercatorCoordinate back to lng/lat
 * @param {number} x - Normalized X coordinate (0-1)
 * @param {number} y - Normalized Y coordinate (0-1)
 * @returns {object} { lng, lat }
 */
export function mercatorToLngLat(x, y) {
  const lng = (x * 360) - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * y)));
  const lat = (latRad * 180) / Math.PI;
  
  return { lng, lat };
}

/**
 * Convert Mapbox MercatorCoordinate to Three.js world position
 * Accounts for zoom level and map center offset
 * 
 * @param {object} mercator - { x, y } normalized Mercator coordinates
 * @param {number} zoom - Mapbox zoom level (0-24)
 * @param {object} mapCenter - { x, y } center of map in Mercator coordinates
 * @param {number} scale - Scale factor for world units per pixel at zoom level
 * @returns {object} { x, y, z } Three.js world coordinates (Z=0 for ground)
 */
export function mercatorToThreeWorld(mercator, zoom, mapCenter, scale) {
  // Calculate tile coordinates at current zoom
  const zoomScale = Math.pow(2, zoom);
  
  // Convert Mercator to tile coordinates
  const tileX = mercator.x * zoomScale;
  const tileY = mercator.y * zoomScale;
  
  // Relative to map center
  const centerTileX = mapCenter.x * zoomScale;
  const centerTileY = mapCenter.y * zoomScale;
  
  // Calculate pixel-based position, then convert to world units
  const pixelX = (tileX - centerTileX) * 256; // 256 pixels per tile
  const pixelY = (tileY - centerTileY) * 256;
  
  // Convert pixels to world units using scale
  const worldX = pixelX * scale;
  const worldY = -pixelY * scale; // Flip Y axis (Mapbox Y increases downward)
  
  return { x: worldX, y: 0, z: worldY };
}

/**
 * Reverse: Three.js world position → Mapbox MercatorCoordinate
 * @param {object} threePos - { x, y, z } Three.js world coordinates
 * @param {number} zoom - Mapbox zoom level
 * @param {object} mapCenter - Map center in Mercator
 * @param {number} scale - Scale factor
 * @returns {object} { x, y } Mercator coordinates
 */
export function threeWorldToMercator(threePos, zoom, mapCenter, scale) {
  const zoomScale = Math.pow(2, zoom);
  
  // Convert world units back to pixels
  const pixelX = threePos.x / scale;
  const pixelY = -threePos.z / scale;
  
  // Convert pixels to tile coordinates
  const tileX = (pixelX / 256) + (mapCenter.x * zoomScale);
  const tileY = (pixelY / 256) + (mapCenter.y * zoomScale);
  
  // Convert tile coordinates back to Mercator (0-1)
  const mercatorX = tileX / zoomScale;
  const mercatorY = tileY / zoomScale;
  
  return { x: mercatorX, y: mercatorY };
}

/**
 * Calculate appropriate world scale for current zoom level
 * At zoom 15: ~1.5 meters per pixel
 * At zoom 17: ~0.4 meters per pixel
 * At zoom 19: ~0.1 meters per pixel
 * 
 * @param {number} zoom - Mapbox zoom level
 * @returns {number} Scale factor (world units per pixel)
 */
export function getScaleForZoom(zoom) {
  // Formula: EARTH_CIRCUMFERENCE / (256 * 2^zoom) / cos(latitude)
  // Simplified for equator: approximately 0.6 / 2^zoom meters per pixel
  // Scale factor adjusted for Three.js world units (1 unit ≈ 1 meter)
  const metersPerPixel = (EARTH_CIRCUMFERENCE / 256 / Math.pow(2, zoom)); // at equator
  
  // Adjust for typical latitude (NYC: 40.7°N reduces scale by ~0.77)
  // For flexibility, use dynamic latitude in production
  const latitudeFactor = 0.8; // Approximate for mid-northern latitudes
  
  return (metersPerPixel * latitudeFactor) / 100; // Scale down for game units
}

/**
 * Exponential moving average filter for GPS jitter reduction
 * Reduces noise while maintaining responsiveness
 * 
 * @param {number} newValue - New sample value
 * @param {number} previousValue - Previous filtered value
 * @param {number} alpha - Smoothing factor (0.1 = 10% new value, 90% previous)
 * @returns {number} Filtered value
 */
export function exponentialMovingAverage(newValue, previousValue, alpha = 0.15) {
  return (alpha * newValue) + ((1 - alpha) * previousValue);
}

/**
 * Apply EMA to 2D position (latitude/longitude or x/y)
 * @param {object} newPos - { lng, lat } or { x, y }
 * @param {object} prevPos - Previous position
 * @param {number} alpha - Smoothing factor
 * @returns {object} Filtered position
 */
export function smoothPosition(newPos, prevPos, alpha = 0.15) {
  if (!prevPos) return newPos;
  
  const keys = Object.keys(newPos);
  const result = {};
  
  keys.forEach(key => {
    result[key] = exponentialMovingAverage(newPos[key], prevPos[key], alpha);
  });
  
  return result;
}

/**
 * Calculate distance between two lng/lat coordinates (Haversine formula)
 * Returns distance in meters
 * 
 * @param {number} lng1 - Start longitude
 * @param {number} lat1 - Start latitude
 * @param {number} lng2 - End longitude
 * @param {number} lat2 - End latitude
 * @returns {number} Distance in meters
 */
export function haversineDistance(lng1, lat1, lng2, lat2) {
  const toRad = Math.PI / 180;
  const dlat = (lat2 - lat1) * toRad;
  const dlng = (lng2 - lng1) * toRad;
  
  const a = 
    Math.sin(dlat / 2) * Math.sin(dlat / 2) +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) *
    Math.sin(dlng / 2) * Math.sin(dlng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS * c;
}

/**
 * Calculate bearing (direction) between two lng/lat coordinates
 * Returns bearing in degrees (0-360), where 0 = North, 90 = East
 * 
 * @param {number} lng1 - Start longitude
 * @param {number} lat1 - Start latitude
 * @param {number} lng2 - End longitude
 * @param {number} lat2 - End latitude
 * @returns {number} Bearing in degrees (0-360)
 */
export function calculateBearing(lng1, lat1, lng2, lat2) {
  const toRad = Math.PI / 180;
  const fromLat = lat1 * toRad;
  const fromLng = lng1 * toRad;
  const toLat = lat2 * toRad;
  const toLng = lng2 * toRad;
  
  const dLng = toLng - fromLng;
  
  const y = Math.sin(dLng) * Math.cos(toLat);
  const x = Math.cos(fromLat) * Math.sin(toLat) - 
            Math.sin(fromLat) * Math.cos(toLat) * Math.cos(dLng);
  
  const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  
  return bearing;
}

/**
 * Interpolate position along route polyline
 * @param {array} polyline - Array of [lng, lat] coordinates
 * @param {number} progress - Progress along route (0-1)
 * @returns {object} { lng, lat, bearing } at progress point
 */
export function interpolateAlongPolyline(polyline, progress) {
  if (!polyline || polyline.length < 2 || progress < 0 || progress > 1) {
    return null;
  }
  
  // Calculate total distance
  let totalDistance = 0;
  const distances = [0];
  
  for (let i = 1; i < polyline.length; i++) {
    const dist = haversineDistance(
      polyline[i - 1][0], polyline[i - 1][1],
      polyline[i][0], polyline[i][1]
    );
    totalDistance += dist;
    distances.push(totalDistance);
  }
  
  // Find target distance
  const targetDistance = totalDistance * progress;
  
  // Find segment
  let segmentIndex = 0;
  for (let i = 0; i < distances.length; i++) {
    if (distances[i] > targetDistance) {
      segmentIndex = i - 1;
      break;
    }
  }
  
  segmentIndex = Math.max(0, Math.min(segmentIndex, polyline.length - 2));
  
  // Interpolate within segment
  const segmentDistance = distances[segmentIndex + 1] - distances[segmentIndex];
  const segmentProgress = segmentDistance > 0 
    ? (targetDistance - distances[segmentIndex]) / segmentDistance
    : 0;
  
  const [lng1, lat1] = polyline[segmentIndex];
  const [lng2, lat2] = polyline[segmentIndex + 1];
  
  // Linear interpolation for position
  const lng = lng1 + (lng2 - lng1) * segmentProgress;
  const lat = lat1 + (lat2 - lat1) * segmentProgress;
  
  // Bearing towards next point
  const bearing = calculateBearing(lng, lat, lng2, lat2);
  
  return { lng, lat, bearing, segmentIndex, segmentProgress };
}

/**
 * Normalize angle to 0-360 range
 * @param {number} angle - Angle in degrees
 * @returns {number} Normalized angle (0-360)
 */
export function normalizeAngle(angle) {
  return ((angle % 360) + 360) % 360;
}

/**
 * Calculate shortest angular difference between two angles
 * @param {number} angle1 - First angle in degrees
 * @param {number} angle2 - Second angle in degrees
 * @returns {number} Angular difference (-180 to 180)
 */
export function angleDifference(angle1, angle2) {
  let diff = normalizeAngle(angle2 - angle1);
  if (diff > 180) diff -= 360;
  return diff;
}

/**
 * Linear interpolation helper
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/**
 * Smooth damp with max speed control
 * @param {number} current - Current value
 * @param {number} target - Target value
 * @param {object} velocity - { value } Current velocity
 * @param {number} smoothTime - Time to reach target (seconds)
 * @param {number} maxSpeed - Maximum change per second
 * @param {number} deltaTime - Time since last frame (seconds)
 * @returns {number} New value
 */
export function smoothDamp(current, target, velocity, smoothTime = 0.3, maxSpeed = Infinity, deltaTime = 0.016) {
  smoothTime = Math.max(0.0001, smoothTime);
  
  const omega = 2 / smoothTime;
  const x = omega * deltaTime;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  
  let change = current - target;
  const originalTo = target;
  
  const maxChange = maxSpeed * smoothTime;
  change = Math.max(-maxChange, Math.min(maxChange, change));
  
  target = current - change;
  
  const temp = (velocity.value + omega * change) * deltaTime;
  velocity.value = (velocity.value - omega * temp) * exp;
  
  let output = target + (change + temp) * exp;
  
  if (originalTo - current > 0 === output > originalTo) {
    output = originalTo;
    velocity.value = (output - originalTo) / deltaTime;
  }
  
  return output;
}

/**
 * Vector 2D operations
 */
export const Vec2 = {
  add: (a, b) => ({ x: a.x + b.x, y: a.y + b.y }),
  sub: (a, b) => ({ x: a.x - b.x, y: a.y - b.y }),
  mul: (v, s) => ({ x: v.x * s, y: v.y * s }),
  dot: (a, b) => a.x * b.x + a.y * b.y,
  length: (v) => Math.sqrt(v.x * v.x + v.y * v.y),
  normalize: (v) => {
    const len = Math.sqrt(v.x * v.x + v.y * v.y);
    return len > 0 ? { x: v.x / len, y: v.y / len } : { x: 0, y: 0 };
  },
};

/**
 * Vector 3D operations (for Three.js compatibility)
 */
export const Vec3 = {
  add: (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }),
  sub: (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }),
  mul: (v, s) => ({ x: v.x * s, y: v.y * s, z: v.z * s }),
  dot: (a, b) => a.x * b.x + a.y * b.y + a.z * b.z,
  cross: (a, b) => ({
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  }),
  length: (v) => Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z),
  normalize: (v) => {
    const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    return len > 0 
      ? { x: v.x / len, y: v.y / len, z: v.z / len }
      : { x: 0, y: 0, z: 0 };
  },
};

export default {
  lngLatToMercator,
  mercatorToLngLat,
  mercatorToThreeWorld,
  threeWorldToMercator,
  getScaleForZoom,
  exponentialMovingAverage,
  smoothPosition,
  haversineDistance,
  calculateBearing,
  interpolateAlongPolyline,
  normalizeAngle,
  angleDifference,
  lerp,
  smoothDamp,
  Vec2,
  Vec3,
};
