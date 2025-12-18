/**
 * GPS Location Service
 * Handles device geolocation and GPS simulation for testing
 * Integrates with device Geolocation API
 */

class GPSLocationService {
  constructor(options = {}) {
    // Configuration
    this.enabled = options.enabled !== false;
    this.updateIntervalMs = options.updateIntervalMs || 1000; // Update GPS every 1 second
    this.minAccuracy = options.minAccuracy || 100; // Meters (ignore readings worse than this)
    this.simulationMode = options.simulationMode || false;
    this.simulationSpeed = options.simulationSpeed || 1.0; // Multiplier for sim speed

    // Current location
    this.currentLocation = options.initialLocation || {
      lng: -74.006,
      lat: 40.7128,
      altitude: 0,
      accuracy: 5,
      heading: 0,
      speed: 0,
    };

    this.previousLocation = { ...this.currentLocation };

    // Geolocation watch ID
    this.watchId = null;

    // Listeners
    this.listeners = {
      onLocationUpdate: [],
      onLocationError: [],
      onAccuracyChange: [],
    };

    // Statistics
    this.stats = {
      updateCount: 0,
      errorCount: 0,
      averageAccuracy: 0,
      lastUpdateTime: 0,
    };

    // Simulation state (for testing without GPS)
    this.simPath = [];
    this.simPathIndex = 0;
    this.simStartTime = 0;
  }

  /**
   * Start GPS tracking
   */
  startTracking() {
    if (!this.enabled) return false;

    if (this.simulationMode) {
      this.startSimulation();
      return true;
    }

    // Check browser support
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      this.notifyListeners('onLocationError', {
        error: 'Geolocation not supported',
      });
      return false;
    }

    // Request location permission and start watching
    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.onPositionUpdate(position),
      (error) => this.onPositionError(error),
      {
        enableHighAccuracy: true, // Request GPS accuracy
        maximumAge: 0, // Don't cache
        timeout: 5000, // 5 second timeout
      }
    );

    return true;
  }

  /**
   * Stop GPS tracking
   */
  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.simulationMode) {
      this.stopSimulation();
    }
  }

  /**
   * Handle position update from device GPS
   * @private
   */
  onPositionUpdate(position) {
    const coords = position.coords;

    // Filter out inaccurate readings
    if (coords.accuracy > this.minAccuracy) {
      console.warn(`GPS accuracy poor: ${coords.accuracy}m, ignoring update`);
      return;
    }

    this.previousLocation = { ...this.currentLocation };

    // Calculate speed and heading from position
    const distance = this.calculateDistance(
      this.previousLocation.lng,
      this.previousLocation.lat,
      coords.longitude,
      coords.latitude
    );

    const timeDelta = (position.timestamp - this.stats.lastUpdateTime) / 1000; // seconds
    const speed = timeDelta > 0 ? distance / timeDelta : 0;

    const heading = this.calculateBearing(
      this.previousLocation.lng,
      this.previousLocation.lat,
      coords.longitude,
      coords.latitude
    );

    // Update location
    this.currentLocation = {
      lng: coords.longitude,
      lat: coords.latitude,
      altitude: coords.altitude || 0,
      accuracy: coords.accuracy,
      heading: heading,
      speed: speed,
      timestamp: position.timestamp,
    };

    // Update statistics
    this.stats.updateCount++;
    this.stats.lastUpdateTime = position.timestamp;
    this.stats.averageAccuracy = (
      this.stats.averageAccuracy * 0.8 +
      coords.accuracy * 0.2
    );

    // Notify listeners
    this.notifyListeners('onLocationUpdate', {
      location: this.currentLocation,
      moved: this.hasLocationChanged(),
    });

    if (coords.accuracy !== this.previousLocation.accuracy) {
      this.notifyListeners('onAccuracyChange', {
        accuracy: coords.accuracy,
      });
    }
  }

  /**
   * Handle GPS error
   * @private
   */
  onPositionError(error) {
    this.stats.errorCount++;

    let errorMessage = 'Unknown error';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Permission denied - user rejected geolocation request';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Position unavailable - device cannot determine location';
        break;
      case error.TIMEOUT:
        errorMessage = 'Timeout - location request took too long';
        break;
    }

    console.error(`GPS Error: ${errorMessage}`, error);

    this.notifyListeners('onLocationError', {
      error: errorMessage,
      code: error.code,
    });
  }

  /**
   * Check if location has meaningfully changed
   * @private
   */
  hasLocationChanged() {
    const threshold = 0.00001; // ~1 meter
    return (
      Math.abs(this.currentLocation.lng - this.previousLocation.lng) > threshold ||
      Math.abs(this.currentLocation.lat - this.previousLocation.lat) > threshold
    );
  }

  /**
   * Get current location
   * @returns {object} { lng, lat, altitude, accuracy, heading, speed }
   */
  getLocation() {
    return { ...this.currentLocation };
  }

  /**
   * Get location statistics
   * @returns {object}
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Set simulation path (array of [lng, lat] coordinates)
   * Useful for testing without real GPS
   * 
   * @param {array} path - Array of [lng, lat] waypoints
   * @param {number} speed - Movement speed multiplier
   */
  setSimulationPath(path, speed = 1.0) {
    this.simPath = path;
    this.simPathIndex = 0;
    this.simulationSpeed = speed;
  }

  /**
   * Start GPS simulation
   * @private
   */
  startSimulation() {
    if (this.simPath.length < 2) {
      console.warn('Simulation path not set, using default');
      // Create default path (circular around initial location)
      this.createDefaultSimulationPath();
    }

    this.simStartTime = performance.now();
    this.simulateLocationUpdates();
  }

  /**
   * Create default simulation path
   * Circle around initial position for testing
   * @private
   */
  createDefaultSimulationPath() {
    const center = this.currentLocation;
    const radiusDeg = 0.001; // ~100 meters

    this.simPath = [];
    for (let i = 0; i < 36; i++) {
      const angle = (i / 36) * Math.PI * 2;
      this.simPath.push([
        center.lng + Math.cos(angle) * radiusDeg,
        center.lat + Math.sin(angle) * radiusDeg,
      ]);
    }
  }

  /**
   * Simulate location updates along path
   * @private
   */
  simulateLocationUpdates = () => {
    if (!this.simulationMode || !this.enabled) return;

    const elapsedMs = performance.now() - this.simStartTime;
    const elapsedS = elapsedMs / 1000;

    // Move along path at simulated speed
    const pathProgress = (elapsedS * this.simulationSpeed) % this.simPath.length;
    const pathIndex = Math.floor(pathProgress);
    const nextIndex = (pathIndex + 1) % this.simPath.length;

    // Interpolate between waypoints
    const t = pathProgress - pathIndex;
    const [lng1, lat1] = this.simPath[pathIndex];
    const [lng2, lat2] = this.simPath[nextIndex];

    const lng = lng1 + (lng2 - lng1) * t;
    const lat = lat1 + (lat2 - lat1) * t;

    // Calculate heading
    const heading = this.calculateBearing(lng1, lat1, lng2, lat2);

    this.previousLocation = { ...this.currentLocation };

    this.currentLocation = {
      lng,
      lat,
      altitude: 0,
      accuracy: 5,
      heading,
      speed: this.simulationSpeed * 5, // m/s
      timestamp: performance.now(),
    };

    this.stats.updateCount++;
    this.stats.lastUpdateTime = performance.now();

    this.notifyListeners('onLocationUpdate', {
      location: this.currentLocation,
      moved: true,
    });

    // Continue simulation
    setTimeout(this.simulateLocationUpdates, this.updateIntervalMs);
  };

  /**
   * Stop GPS simulation
   * @private
   */
  stopSimulation() {
    this.simPath = [];
    this.simPathIndex = 0;
  }

  /**
   * Set location directly (useful for testing)
   * @param {object} location - { lng, lat }
   */
  setLocationDirect(location) {
    this.previousLocation = { ...this.currentLocation };
    this.currentLocation = {
      ...this.currentLocation,
      lng: location.lng,
      lat: location.lat,
    };

    this.notifyListeners('onLocationUpdate', {
      location: this.currentLocation,
      moved: true,
    });
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * @private
   */
  calculateDistance(lng1, lat1, lng2, lat2) {
    const R = 6371000; // Earth radius in meters
    const toRad = Math.PI / 180;

    const dlat = (lat2 - lat1) * toRad;
    const dlng = (lng2 - lng1) * toRad;

    const a =
      Math.sin(dlat / 2) * Math.sin(dlat / 2) +
      Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) *
      Math.sin(dlng / 2) * Math.sin(dlng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Calculate bearing between coordinates
   * @private
   */
  calculateBearing(lng1, lat1, lng2, lat2) {
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
   * Register location change listener
   * @param {string} event - Event name: 'onLocationUpdate', 'onLocationError', 'onAccuracyChange'
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
   * Notify listeners
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
   * Get formatted location for debugging
   * @returns {string}
   */
  toString() {
    return `GPS: ${this.currentLocation.lat.toFixed(6)}, ${this.currentLocation.lng.toFixed(6)} (±${this.currentLocation.accuracy}m)`;
  }
}

export { GPSLocationService };
export default GPSLocationService;
