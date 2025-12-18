/**
 * Game Manager
 * Orchestrates all game systems (Map, Three.js, Physics, Navigation, GPS, Camera)
 * Single source of truth for game state
 */

import MapboxCoordinateSystem from './map/MapboxCoordinateSystem';
import ThreeSceneManager from './three/ThreeSceneManager';
import { PhysicsWorld, CharacterController, SimplePhysicsBody } from './physics/PhysicsController';
import NavigationSystem from '../systems/navigation/NavigationSystem';
import NavigationCamera from '../systems/camera/NavigationCamera';
import GPSLocationService from '../systems/player/GPSLocationService';
import { getPerformanceMonitor } from '../utils/performanceMonitor';

class GameManager {
  constructor(canvasElement, options = {}) {
    if (!canvasElement) {
      throw new Error('Canvas element required for GameManager');
    }

    // Initialize core systems
    this.coordinateSystem = new MapboxCoordinateSystem(options.coordinates);
    this.scene = new ThreeSceneManager(canvasElement, options.scene);
    this.physics = new PhysicsWorld(options.physics);
    this.navigationSystem = new NavigationSystem(this.coordinateSystem);
    this.gpsService = new GPSLocationService(options.gps);
    this.camera = new NavigationCamera(this.scene.getCamera(), options.camera);
    this.perfMonitor = getPerformanceMonitor();

    // Game state
    this.isRunning = false;
    this.isPaused = false;
    this.gameTime = 0;

    // Player
    this.player = null;
    this.playerBody = null;
    this.playerMesh = null;

    // Input
    this.inputState = {
      forward: false,
      back: false,
      left: false,
      right: false,
      sprint: false,
      jump: false,
    };

    // Route rendering
    this.routeLineMesh = null;

    // Listeners
    this.listeners = {
      onGameStateChange: [],
      onPlayerPositionUpdate: [],
      onNavigationUpdate: [],
    };

    this.setupInputHandlers();
  }

  /**
   * Initialize game
   * Create player, set up initial scene
   */
  async initialize() {
    try {
      // Create ground plane
      this.scene.createGroundPlane(500, 'ground');

      // Create player character
      this.playerMesh = this.scene.createCharacterMesh(2, 'player');

      // Create physics body for player
      const initialPos = this.coordinateSystem.worldPosition;
      this.playerBody = new SimplePhysicsBody(initialPos, {
        mass: 1,
        friction: 0.95,
        gravityScale: 1,
      });

      this.physics.addBody(this.playerBody);

      // Create character controller
      this.player = new CharacterController(this.playerBody, {
        moveSpeed: 10,
        sprintSpeed: 15,
        jumpForce: 15,
      });

      // Setup GPS tracking
      this.gpsService.on('onLocationUpdate', (data) => {
        this.onGPSLocationUpdate(data);
      });

      this.gpsService.startTracking();

      // Setup navigation listeners
      this.navigationSystem.on('onRouteUpdate', (data) => {
        this.onRouteUpdate(data);
      });

      this.navigationSystem.on('onWaypointReached', (data) => {
        this.onWaypointReached(data);
      });

      // Setup scene render updates
      this.scene.onUpdate((deltaTime) => {
        this.update(deltaTime);
      });

      console.log('GameManager initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize GameManager:', error);
      throw error;
    }
  }

  /**
   * Start game loop
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;
    this.gameTime = 0;

    this.scene.startRender();
    this.notifyListeners('onGameStateChange', { state: 'running' });
  }

  /**
   * Pause game
   */
  pause() {
    if (!this.isRunning || this.isPaused) return;

    this.isPaused = true;
    this.notifyListeners('onGameStateChange', { state: 'paused' });
  }

  /**
   * Resume game
   */
  resume() {
    if (!this.isRunning || !this.isPaused) return;

    this.isPaused = false;
    this.notifyListeners('onGameStateChange', { state: 'running' });
  }

  /**
   * Stop game and cleanup
   */
  stop() {
    this.isRunning = false;
    this.scene.stopRender();
    this.gpsService.stopTracking();
    this.navigationSystem.clear();

    this.notifyListeners('onGameStateChange', { state: 'stopped' });
  }

  /**
   * Main update loop (called each frame)
   * @private
   */
  update(deltaTime) {
    if (!this.isRunning || this.isPaused) return;

    const frameStart = this.perfMonitor.frameStart();
    this.gameTime += deltaTime;

    try {
      // Update player input and physics
      this.player.setInput(this.inputState);
      this.player.update(deltaTime);

      // Update physics simulation
      const physicsStart = performance.now();
      this.physics.step(deltaTime);
      this.perfMonitor.recordPhysicsTime(performance.now() - physicsStart);

      // Update player mesh position and rotation
      if (this.playerMesh) {
        const playerState = this.player.getState();
        this.playerMesh.position.set(
          playerState.position.x,
          playerState.position.y,
          playerState.position.z
        );

        // Rotate player to face heading direction
        this.playerMesh.rotation.y = playerState.heading;
      }

      // Update navigation
      const currentLngLat = this.coordinateSystem.currentLngLat;
      this.navigationSystem.update(currentLngLat);

      // Update camera
      const playerState = this.player.getState();
      const routeData = this.navigationSystem.getNavigationState();

      this.camera.update({
        position: playerState.position,
        heading: playerState.heading,
        isMoving: playerState.isMoving,
        routeData: routeData.currentWaypoint ? {
          nextWaypoint: this.getRouteWaypointWorld(
            routeData.currentWaypoint + 1
          ),
        } : null,
      });

      // Notify listeners
      this.notifyListeners('onPlayerPositionUpdate', {
        position: playerState.position,
        heading: playerState.heading,
        lngLat: this.coordinateSystem.currentLngLat,
        gpsAccuracy: this.gpsService.currentLocation.accuracy,
      });

      // Record render timing
      const renderStart = performance.now();
      // Renderer is called by Three.js scene manager
      this.perfMonitor.recordRenderTime(performance.now() - renderStart);

      this.perfMonitor.frameEnd(frameStart);
    } catch (error) {
      console.error('Error in game update:', error);
    }
  }

  /**
   * Handle GPS location update
   * Sync player position with GPS
   * @private
   */
  onGPSLocationUpdate(data) {
    const { location } = data;

    // Update coordinate system with GPS data
    this.coordinateSystem.updateGPSPosition(
      { lng: location.lng, lat: location.lat },
      undefined
    );

    // Player position follows GPS (with smoothing via coordinate system)
    const worldPos = this.coordinateSystem.worldPosition;
    this.playerBody.position = { ...worldPos };

    // Update player heading from GPS if moving
    if (location.speed > 0) {
      this.player.updateHeading(
        (location.heading * Math.PI) / 180,
        this.scene.deltaTime
      );
    }

    // Optionally log GPS accuracy
    if (location.accuracy > 50) {
      console.warn(`Low GPS accuracy: ${location.accuracy}m`);
    }
  }

  /**
   * Handle route update
   * Visualize route in 3D scene
   * @private
   */
  onRouteUpdate(data) {
    const { route } = data;

    // Remove old route visualization
    if (this.routeLineMesh) {
      this.scene.removeObject('routeLine');
    }

    // Convert route polyline to world coordinates
    const routeWorldPos = this.navigationSystem.getRouteAsWorld(
      this.coordinateSystem
    );

    // Create 3D line visualization
    if (routeWorldPos.length > 1) {
      this.routeLineMesh = this.scene.createCurvedPathLine(
        routeWorldPos,
        100,
        0x00ff00,
        'routeLine'
      );
    }

    this.notifyListeners('onNavigationUpdate', {
      event: 'routeSelected',
      route: route,
    });
  }

  /**
   * Handle waypoint reached
   * @private
   */
  onWaypointReached(data) {
    this.notifyListeners('onNavigationUpdate', {
      event: 'waypointReached',
      ...data,
    });
  }

  /**
   * Get route waypoint position in world coordinates
   * @private
   */
  getRouteWaypointWorld(index) {
    if (!this.navigationSystem.currentRoute) return null;

    const polyline = this.navigationSystem.currentRoute.polyline;
    if (index >= polyline.length) return null;

    const [lng, lat] = polyline[index];
    return this.coordinateSystem.gpsToWorld({ lng, lat });
  }

  /**
   * Request route to destination
   * @param {object} destination - { lng, lat } destination coordinates
   * @param {object} options - Route options (profile, alternatives, etc.)
   */
  async requestRoute(destination, options = {}) {
    try {
      const start = this.coordinateSystem.currentLngLat;
      await this.navigationSystem.requestRoute(start, destination, options);

      return this.navigationSystem.currentRoute;
    } catch (error) {
      console.error('Route request failed:', error);
      throw error;
    }
  }

  /**
   * Start navigation on current route
   */
  startNavigation() {
    this.navigationSystem.startNavigation();
    this.notifyListeners('onNavigationUpdate', { event: 'navigationStarted' });
  }

  /**
   * Stop navigation
   */
  stopNavigation() {
    this.navigationSystem.stopNavigation();
    this.notifyListeners('onNavigationUpdate', { event: 'navigationStopped' });
  }

  /**
   * Set keyboard input
   * @param {string} key - Key name (e.g., 'w', 'a', 's', 'd', 'shift', 'space')
   * @param {boolean} pressed - Is key pressed
   */
  setKeyInput(key, pressed) {
    const keyLower = key.toLowerCase();

    switch (keyLower) {
      case 'w':
      case 'arrowup':
        this.inputState.forward = pressed;
        break;
      case 's':
      case 'arrowdown':
        this.inputState.back = pressed;
        break;
      case 'a':
      case 'arrowleft':
        this.inputState.left = pressed;
        break;
      case 'd':
      case 'arrowright':
        this.inputState.right = pressed;
        break;
      case 'shift':
        this.inputState.sprint = pressed;
        break;
      case ' ':
        this.inputState.jump = pressed;
        break;
    }
  }

  /**
   * Setup keyboard input handlers
   * @private
   */
  setupInputHandlers() {
    document.addEventListener('keydown', (e) => {
      this.setKeyInput(e.key, true);
    });

    document.addEventListener('keyup', (e) => {
      this.setKeyInput(e.key, false);
    });
  }

  /**
   * Get game state
   * @returns {object}
   */
  getGameState() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      gameTime: this.gameTime,
      player: this.player ? this.player.getState() : null,
      navigation: this.navigationSystem.getNavigationState(),
      gps: this.gpsService.getLocation(),
      camera: this.camera.getState(),
      performance: this.perfMonitor.getMetrics(),
    };
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
   * Cleanup and dispose resources
   */
  dispose() {
    this.stop();
    this.scene.dispose();
    this.physics.clear();
  }
}

export { GameManager };
export default GameManager;
