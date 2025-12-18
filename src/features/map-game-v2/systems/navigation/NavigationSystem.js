/**
 * Navigation System
 * Manages routes from Mapbox Directions API and route following
 */

import { interpolateAlongPolyline, haversineDistance } from '../utils/mathUtils';

class NavigationRoute {
  constructor(data) {
    // Route data from Mapbox Directions API
    this.geometry = data.geometry || [];
    this.distance = data.distance || 0; // meters
    this.duration = data.duration || 0; // seconds
    this.legs = data.legs || [];

    // Convert polyline if needed
    if (typeof this.geometry === 'string') {
      this.polyline = this.decodePolyline(this.geometry);
    } else if (Array.isArray(this.geometry) && this.geometry[0] && !this.geometry[0][0]) {
      // Already decoded
      this.polyline = this.geometry;
    } else {
      // GeoJSON coordinates
      this.polyline = this.geometry.coordinates || [];
    }

    // Route state
    this.currentLegIndex = 0;
    this.isActive = false;
    this.progress = 0; // 0-1
    this.currentWaypoint = null;
  }

  /**
   * Decode polyline from Mapbox (6-digit precision)
   * @private
   * @param {string} encoded - Encoded polyline string
   * @returns {array} Array of [lng, lat] coordinates
   */
  decodePolyline(encoded) {
    let poly = [];
    let index = 0, lat = 0, lng = 0;
    const changes = { latitude: 0, longitude: 0 };

    while (index < encoded.length) {
      for (const unit of ['latitude', 'longitude']) {
        let shift = 0, result = 0;

        let byte;
        do {
          byte = encoded.charCodeAt(index++) - 63;
          result |= (byte & 0x1f) << shift;
          shift += 5;
        } while (byte >= 0x20);

        changes[unit] = (result & 1) ? ~(result >> 1) : result >> 1;
      }

      lat += changes['latitude'];
      lng += changes['longitude'];

      poly.push([lng / 1e5, lat / 1e5]);
    }

    return poly;
  }

  /**
   * Start following this route from current position
   */
  start() {
    this.isActive = true;
    this.progress = 0;
    this.currentLegIndex = 0;
  }

  /**
   * Stop following route
   */
  stop() {
    this.isActive = false;
  }

  /**
   * Get route summary for UI
   * @returns {object}
   */
  getSummary() {
    return {
      distance: this.distance,
      duration: this.duration,
      distanceKm: (this.distance / 1000).toFixed(2),
      durationMinutes: Math.round(this.duration / 60),
      polylineLength: this.polyline.length,
    };
  }

  /**
   * Get current leg information
   * @returns {object}
   */
  getCurrentLeg() {
    if (this.currentLegIndex >= this.legs.length) {
      return null;
    }
    return this.legs[this.currentLegIndex];
  }

  /**
   * Get next turn instruction
   * @returns {object|null} Turn instruction or null if route complete
   */
  getNextInstruction() {
    const leg = this.getCurrentLeg();
    if (!leg || !leg.steps) return null;

    // Find next step with instruction
    const currentStep = leg.steps[0]; // Simplified
    return currentStep?.maneuver || null;
  }
}

class NavigationSystem {
  constructor(coordinateSystem) {
    this.coordSystem = coordinateSystem;

    // Current route
    this.currentRoute = null;
    this.routes = []; // Multiple routes from API response

    // Navigation state
    this.isNavigating = false;
    this.currentWaypoint = 0;
    this.nextWaypoint = 1;

    // Listeners
    this.listeners = {
      onRouteUpdate: [],
      onWaypointReached: [],
      onRouteComplete: [],
      onRouteError: [],
    };

    // Route parameters
    this.minDistanceThreshold = 5; // meters to consider waypoint reached
    this.updateIntervalMs = 250; // Check waypoints every 250ms
    this.lastUpdateTime = 0;
  }

  /**
   * Request route from Mapbox Directions API
   * @param {object} startLngLat - { lng, lat } start position
   * @param {object} endLngLat - { lng, lat } destination
   * @param {object} options - API options (profile, alternatives, etc.)
   * @returns {Promise}
   */
  async requestRoute(startLngLat, endLngLat, options = {}) {
    try {
      // Get API token from environment
      const apiToken = process.env.REACT_APP_MAPBOX_TOKEN;
      if (!apiToken) {
        throw new Error('Mapbox API token not configured');
      }

      // Build request URL
      const coordinates = `${startLngLat.lng},${startLngLat.lat};${endLngLat.lng},${endLngLat.lat}`;
      const profile = options.profile || 'mapbox/walking'; // walking, driving, cycling
      const url = new URL(
        `https://api.mapbox.com/directions/v5/${profile}/${coordinates}`,
        window.location.origin
      );

      // Add options
      url.searchParams.set('access_token', apiToken);
      url.searchParams.set('steps', 'true');
      url.searchParams.set('geometries', 'geojson');
      url.searchParams.set('overview', 'full');
      url.searchParams.set('alternatives', options.alternatives ? 'true' : 'false');

      // Optional: Add waypoints
      if (options.waypoints) {
        url.searchParams.set('waypoint_names', options.waypoints.join(';'));
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Directions API error: ${response.status}`);
      }

      const data = await response.json();
      if (data.code !== 'Ok') {
        throw new Error(`Directions API: ${data.message}`);
      }

      // Process routes
      this.routes = data.routes.map(route => new NavigationRoute({
        geometry: route.geometry,
        distance: route.distance,
        duration: route.duration,
        legs: route.legs,
      }));

      // Select first (shortest) route by default
      if (this.routes.length > 0) {
        this.setCurrentRoute(0);
        this.notifyListeners('onRouteUpdate', {
          route: this.currentRoute,
          alternatives: this.routes.length - 1,
        });
      }

      return this.currentRoute;
    } catch (error) {
      console.error('Route request failed:', error);
      this.notifyListeners('onRouteError', { error: error.message });
      throw error;
    }
  }

  /**
   * Set active route from available routes
   * @param {number} index - Route index
   */
  setCurrentRoute(index) {
    if (index >= 0 && index < this.routes.length) {
      this.currentRoute = this.routes[index];
    }
  }

  /**
   * Start navigation on current route
   */
  startNavigation() {
    if (!this.currentRoute) {
      throw new Error('No route selected');
    }

    this.isNavigating = true;
    this.currentWaypoint = 0;
    this.nextWaypoint = 1;
    this.currentRoute.start();
  }

  /**
   * Stop navigation
   */
  stopNavigation() {
    this.isNavigating = false;
    if (this.currentRoute) {
      this.currentRoute.stop();
    }
  }

  /**
   * Update navigation with current player position
   * Detects waypoint arrivals and route completion
   * 
   * @param {object} currentLngLat - { lng, lat } player position
   */
  update(currentLngLat) {
    if (!this.isNavigating || !this.currentRoute) return;

    const now = performance.now();
    if (now - this.lastUpdateTime < this.updateIntervalMs) return;
    this.lastUpdateTime = now;

    // Check if waypoint is reached
    const waypointLngLat = this.currentRoute.polyline[this.nextWaypoint];
    if (!waypointLngLat) {
      // Route complete
      this.stopNavigation();
      this.notifyListeners('onRouteComplete', {
        route: this.currentRoute,
      });
      return;
    }

    // Calculate distance to next waypoint
    const distance = haversineDistance(
      currentLngLat.lng,
      currentLngLat.lat,
      waypointLngLat[0],
      waypointLngLat[1]
    );

    // Check if waypoint reached
    if (distance < this.minDistanceThreshold) {
      this.currentWaypoint = this.nextWaypoint;
      this.nextWaypoint = Math.min(this.nextWaypoint + 1, this.currentRoute.polyline.length - 1);

      // Update route progress
      const totalWaypoints = this.currentRoute.polyline.length;
      this.currentRoute.progress = this.currentWaypoint / totalWaypoints;

      this.notifyListeners('onWaypointReached', {
        waypointIndex: this.currentWaypoint,
        totalWaypoints: totalWaypoints,
        progress: this.currentRoute.progress,
      });
    }
  }

  /**
   * Get navigation state
   * @returns {object}
   */
  getNavigationState() {
    if (!this.currentRoute) {
      return {
        isNavigating: false,
        currentRoute: null,
      };
    }

    const routeSummary = this.currentRoute.getSummary();
    const distanceRemaining = this.currentRoute.distance * (1 - this.currentRoute.progress);

    return {
      isNavigating: this.isNavigating,
      route: routeSummary,
      progress: this.currentRoute.progress,
      distanceRemaining: distanceRemaining,
      distanceRemainingKm: (distanceRemaining / 1000).toFixed(2),
      timeRemaining: Math.round((this.currentRoute.duration * (1 - this.currentRoute.progress))),
      currentWaypoint: this.currentWaypoint,
      totalWaypoints: this.currentRoute.polyline.length,
    };
  }

  /**
   * Get polyline as Three.js positions
   * @param {object} coordinateSystem - MapboxCoordinateSystem instance
   * @returns {array} Array of { x, y, z } world coordinates
   */
  getRouteAsWorld(coordinateSystem) {
    if (!this.currentRoute) return [];

    return this.currentRoute.polyline.map(([lng, lat]) => {
      const world = coordinateSystem.gpsToWorld({ lng, lat }, 0.5);
      return world;
    });
  }

  /**
   * Register listener
   * @param {string} event - Event name
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
   * Clear all routes
   */
  clear() {
    this.routes = [];
    this.currentRoute = null;
    this.isNavigating = false;
  }
}

export { NavigationRoute, NavigationSystem };
export default NavigationSystem;
