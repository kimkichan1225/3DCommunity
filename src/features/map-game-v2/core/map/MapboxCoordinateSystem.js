/**
 * Mapbox Coordinate System Manager
 * Professional-grade coordinate transformation between GPS, Mapbox, and Three.js
 * Handles all projection conversions with sub-meter precision
 */

import {
  lngLatToMercator,
  mercatorToLngLat,
  mercatorToThreeWorld,
  threeWorldToMercator,
  getScaleForZoom,
  smoothPosition,
  haversineDistance,
  calculateBearing,
} from '../utils/mathUtils';

class MapboxCoordinateSystem {
  constructor(options = {}) {
    // GPS state
    this.currentLngLat = options.initialPosition || { lng: -74.006, lat: 40.7128 }; // Default: NYC
    this.previousLngLat = { ...this.currentLngLat };
    
    // Mapbox state
    this.mapCenter = lngLatToMercator(this.currentLngLat.lng, this.currentLngLat.lat);
    this.zoom = options.zoom || 18; // Street-level detail
    this.scale = getScaleForZoom(this.zoom);
    
    // Three.js world state
    this.worldPosition = { x: 0, y: 0, z: 0 };
    
    // Smoothing
    this.smoothingEnabled = options.smoothingEnabled !== false;
    this.smoothingAlpha = options.smoothingAlpha || 0.15; // 15% new data, 85% historical
    
    // Bounds for validation
    this.maxLatitude = 85.051129;
    this.minLatitude = -85.051129;
    
    // Listener registry
    this.listeners = {
      onCoordinateUpdate: [],
      onZoomChange: [],
    };
  }

  /**
   * Update current GPS position (from device geolocation)
   * Automatically smooths to reduce jitter
   * 
   * @param {object} lngLat - { lng, lat } GPS coordinates
   * @param {number} zoom - Optional zoom level
   * @returns {boolean} Position changed (used for optimization)
   */
  updateGPSPosition(lngLat, zoom) {
    if (!this.isValidGPSCoordinate(lngLat)) {
      console.warn('Invalid GPS coordinate:', lngLat);
      return false;
    }

    // Store previous position before update
    this.previousLngLat = { ...this.currentLngLat };

    // Apply smoothing filter to reduce GPS jitter
    if (this.smoothingEnabled) {
      this.currentLngLat = smoothPosition(lngLat, this.previousLngLat, this.smoothingAlpha);
    } else {
      this.currentLngLat = { ...lngLat };
    }

    // Update map center (usually follows player, but can be different for cinematic)
    this.mapCenter = lngLatToMercator(this.currentLngLat.lng, this.currentLngLat.lat);

    // Update zoom and scale if provided
    if (zoom !== undefined && zoom !== this.zoom) {
      this.setZoom(zoom);
    }

    // Calculate world position relative to map center
    this.updateWorldPosition();

    // Notify listeners
    this.notifyListeners('onCoordinateUpdate', {
      lngLat: this.currentLngLat,
      worldPos: this.worldPosition,
      moved: this.hasPositionChanged(),
    });

    return true;
  }

  /**
   * Update Three.js world position based on current GPS coordinates
   * @private
   */
  updateWorldPosition() {
    this.worldPosition = mercatorToThreeWorld(
      this.mapCenter,
      this.zoom,
      this.mapCenter, // Center relative to itself
      this.scale
    );
  }

  /**
   * Check if position has meaningfully changed
   * Ignores small smoothing variations
   * 
   * @returns {boolean} True if moved more than threshold
   */
  hasPositionChanged() {
    const threshold = 0.00001; // ~1 meter at equator
    return (
      Math.abs(this.currentLngLat.lng - this.previousLngLat.lng) > threshold ||
      Math.abs(this.currentLngLat.lat - this.previousLngLat.lat) > threshold
    );
  }

  /**
   * Set zoom level and update scale
   * Zoom 15-19 recommended for street-level games
   * 
   * @param {number} newZoom - New zoom level (0-24)
   * @returns {boolean} Zoom changed
   */
  setZoom(newZoom) {
    newZoom = Math.max(0, Math.min(24, newZoom)); // Clamp

    if (newZoom === this.zoom) return false;

    const oldZoom = this.zoom;
    this.zoom = newZoom;
    this.scale = getScaleForZoom(newZoom);

    this.updateWorldPosition();

    this.notifyListeners('onZoomChange', {
      oldZoom,
      newZoom,
      scale: this.scale,
    });

    return true;
  }

  /**
   * Convert GPS coordinates to Three.js world position
   * Useful for converting routes, waypoints, etc.
   * 
   * @param {object} lngLat - { lng, lat } GPS coordinates
   * @param {number} yOffset - Y position (height/altitude)
   * @returns {object} { x, y, z } Three.js world coordinates
   */
  gpsToWorld(lngLat, yOffset = 0) {
    if (!this.isValidGPSCoordinate(lngLat)) {
      console.error('Invalid GPS coordinate:', lngLat);
      return { x: 0, y: yOffset, z: 0 };
    }

    const mercator = lngLatToMercator(lngLat.lng, lngLat.lat);
    const world = mercatorToThreeWorld(
      mercator,
      this.zoom,
      this.mapCenter,
      this.scale
    );

    world.y = yOffset;
    return world;
  }

  /**
   * Convert Three.js world position back to GPS
   * @param {object} worldPos - { x, y, z } Three.js coordinates
   * @returns {object} { lng, lat } GPS coordinates
   */
  worldToGPS(worldPos) {
    const mercator = threeWorldToMercator(
      worldPos,
      this.zoom,
      this.mapCenter,
      this.scale
    );

    return mercatorToLngLat(mercator.x, mercator.y);
  }

  /**
   * Convert array of GPS coordinates to Three.js positions
   * Perfect for visualizing routes
   * 
   * @param {array} polyline - Array of [lng, lat] pairs
   * @param {number} yOffset - Height offset
   * @returns {array} Array of { x, y, z } Three.js positions
   */
  gpsPolylineToWorld(polyline, yOffset = 0) {
    return polyline.map(([lng, lat]) => 
      this.gpsToWorld({ lng, lat }, yOffset)
    );
  }

  /**
   * Get distance from current position to a GPS coordinate
   * Uses haversine formula for accuracy
   * 
   * @param {object} targetLngLat - { lng, lat } target coordinates
   * @returns {number} Distance in meters
   */
  getDistanceToTarget(targetLngLat) {
    return haversineDistance(
      this.currentLngLat.lng,
      this.currentLngLat.lat,
      targetLngLat.lng,
      targetLngLat.lat
    );
  }

  /**
   * Get bearing from current position to a GPS coordinate
   * Returns direction angle (0 = North, 90 = East)
   * 
   * @param {object} targetLngLat - { lng, lat } target coordinates
   * @returns {number} Bearing in degrees (0-360)
   */
  getBearingToTarget(targetLngLat) {
    return calculateBearing(
      this.currentLngLat.lng,
      this.currentLngLat.lat,
      targetLngLat.lng,
      targetLngLat.lat
    );
  }

  /**
   * Validate GPS coordinate is within valid bounds
   * @private
   * 
   * @param {object} lngLat - Coordinates to validate
   * @returns {boolean} True if valid
   */
  isValidGPSCoordinate(lngLat) {
    if (!lngLat || typeof lngLat.lng !== 'number' || typeof lngLat.lat !== 'number') {
      return false;
    }

    const { lng, lat } = lngLat;
    return (
      lng >= -180 && lng <= 180 &&
      lat >= this.minLatitude && lat <= this.maxLatitude
    );
  }

  /**
   * Get current state as object (useful for debugging/persistence)
   * @returns {object} Complete coordinate system state
   */
  getState() {
    return {
      currentLngLat: { ...this.currentLngLat },
      mapCenter: { ...this.mapCenter },
      zoom: this.zoom,
      scale: this.scale,
      worldPosition: { ...this.worldPosition },
    };
  }

  /**
   * Restore state from saved object
   * @param {object} state - State object from getState()
   */
  restoreState(state) {
    if (state.currentLngLat) {
      this.currentLngLat = { ...state.currentLngLat };
    }
    if (state.mapCenter) {
      this.mapCenter = { ...state.mapCenter };
    }
    if (state.zoom) {
      this.zoom = state.zoom;
      this.scale = getScaleForZoom(this.zoom);
    }
    if (state.worldPosition) {
      this.worldPosition = { ...state.worldPosition };
    }
  }

  /**
   * Register listener for coordinate updates
   * @param {string} event - Event name: 'onCoordinateUpdate', 'onZoomChange'
   * @param {function} callback - Callback function
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  /**
   * Unregister listener
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  /**
   * Notify all registered listeners
   * @private
   */
  notifyListeners(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Set smoothing for GPS jitter reduction
   * Higher alpha = more responsive but noisier
   * Lower alpha = smoother but more lag
   * 
   * @param {boolean} enabled - Enable smoothing
   * @param {number} alpha - Smoothing factor (0-1)
   */
  setSmoothing(enabled, alpha) {
    this.smoothingEnabled = enabled;
    if (alpha !== undefined) {
      this.smoothingAlpha = Math.max(0, Math.min(1, alpha));
    }
  }
}

// Singleton instance
let globalCoordinateSystem = null;

/**
 * Get or create global coordinate system
 * @param {object} options - Options for initialization
 * @returns {MapboxCoordinateSystem} Global instance
 */
export function getCoordinateSystem(options) {
  if (!globalCoordinateSystem) {
    globalCoordinateSystem = new MapboxCoordinateSystem(options);
  }
  return globalCoordinateSystem;
}

/**
 * Create new coordinate system instance (for testing or multiple instances)
 * @param {object} options - Options
 * @returns {MapboxCoordinateSystem} New instance
 */
export function createCoordinateSystem(options) {
  return new MapboxCoordinateSystem(options);
}

export { MapboxCoordinateSystem };
export default MapboxCoordinateSystem;
