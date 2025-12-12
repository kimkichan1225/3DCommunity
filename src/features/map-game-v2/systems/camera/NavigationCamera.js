/**
 * Navigation Camera System
 * Professional navigation-style 3D camera
 * Mimics Google Maps/Apple Maps navigation UI with smart framing
 */

import { angleDifference, lerp, normalizeAngle } from '../utils/mathUtils';

class NavigationCamera {
  constructor(camera, options = {}) {
    this.camera = camera;

    // Camera positioning
    this.distance = options.distance || 12; // Units behind player
    this.height = options.height || 6; // Units above ground
    this.lookAheadDistance = options.lookAheadDistance || 30; // Units ahead on route

    // Camera behavior
    this.followEnabled = options.followEnabled !== false;
    this.rotateWithPlayer = options.rotateWithPlayer !== false;
    this.smoothing = options.smoothing !== false;
    this.smoothingSpeed = options.smoothingSpeed || 0.08; // 0-1, higher = faster

    // Camera state
    this.targetPosition = { x: 0, y: this.height, z: this.distance };
    this.targetLookAt = { x: 0, y: this.height * 0.6, z: 0 };

    this.currentPosition = { ...this.targetPosition };
    this.currentLookAt = { ...this.targetLookAt };

    // Animation state
    this.transitionTime = 0;
    this.transitionDuration = 0;
    this.isTransitioning = false;

    // Optional: GPS overlay mode
    this.gpsFollowMode = false; // True when following GPS heading instead of manual input
    this.gpsSmoothing = 0.15;

    this.velocity = { x: 0, y: 0, z: 0 };
    this.lookAheadVelocity = { x: 0, y: 0, z: 0 };
  }

  /**
   * Update camera based on player state
   * Call this every frame
   * 
   * @param {object} playerState - { position, heading, isMoving, routeProgress }
   * @param {object} options - Optional override options
   */
  update(playerState, options = {}) {
    const { position, heading, isMoving, routeData } = playerState;

    if (!this.followEnabled || !position) return;

    // Calculate look-ahead point (for navigation, look ahead on route if available)
    let lookAheadPos = this.calculateLookAheadPosition(position, heading, routeData);

    // Calculate target camera position (behind and above player)
    this.targetPosition = this.calculateCameraPosition(
      position,
      heading,
      isMoving,
      lookAheadPos
    );

    // Calculate target look-at point
    this.targetLookAt = this.calculateLookAtPoint(
      position,
      lookAheadPos,
      isMoving
    );

    // Smooth camera movement
    if (this.smoothing) {
      this.smoothCameraMovement();
    } else {
      this.currentPosition = { ...this.targetPosition };
      this.currentLookAt = { ...this.targetLookAt };
    }

    // Apply camera transformation
    this.applyCameraTransform();
  }

  /**
   * Calculate look-ahead point
   * Can be based on character heading or route direction
   * 
   * @private
   */
  calculateLookAheadPosition(playerPos, heading, routeData) {
    let lookAheadDir = { x: 0, z: 1 };

    if (routeData && routeData.nextWaypoint) {
      // Look ahead on route
      const waypointPos = routeData.nextWaypoint;
      const dx = waypointPos.x - playerPos.x;
      const dz = waypointPos.z - playerPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0) {
        lookAheadDir.x = dx / dist;
        lookAheadDir.z = dz / dist;
      }
    } else if (this.rotateWithPlayer) {
      // Look in player facing direction
      lookAheadDir.x = Math.sin(heading);
      lookAheadDir.z = Math.cos(heading);
    }

    return {
      x: playerPos.x + lookAheadDir.x * this.lookAheadDistance,
      y: playerPos.y,
      z: playerPos.z + lookAheadDir.z * this.lookAheadDistance,
    };
  }

  /**
   * Calculate target camera position
   * Positioned behind player, elevated, looking ahead
   * 
   * @private
   */
  calculateCameraPosition(playerPos, heading, isMoving, lookAheadPos) {
    let dirX = Math.sin(heading);
    let dirZ = Math.cos(heading);

    // Camera offset from player (behind and to the side slightly)
    const camOffsetDist = this.distance;
    const camX = playerPos.x - dirX * camOffsetDist;
    const camZ = playerPos.z - dirZ * camOffsetDist;

    // Slight side offset for better view when moving
    const sideOffset = isMoving ? this.distance * 0.3 : 0;
    const sideX = Math.cos(heading) * sideOffset;
    const sideZ = -Math.sin(heading) * sideOffset;

    return {
      x: camX + sideX,
      y: playerPos.y + this.height,
      z: camZ + sideZ,
    };
  }

  /**
   * Calculate target look-at point
   * Balances between player position and look-ahead point
   * 
   * @private
   */
  calculateLookAtPoint(playerPos, lookAheadPos, isMoving) {
    // When moving, look more ahead; when stationary, look at player
    const blendFactor = isMoving ? 0.6 : 0.3;

    return {
      x: lerp(playerPos.x, lookAheadPos.x, blendFactor),
      y: playerPos.y + this.height * 0.6,
      z: lerp(playerPos.z, lookAheadPos.z, blendFactor),
    };
  }

  /**
   * Smooth camera movement using exponential moving average
   * Prevents jerky transitions
   * 
   * @private
   */
  smoothCameraMovement() {
    const alpha = this.smoothingSpeed;

    // Smooth position
    this.currentPosition.x += (this.targetPosition.x - this.currentPosition.x) * alpha;
    this.currentPosition.y += (this.targetPosition.y - this.currentPosition.y) * alpha;
    this.currentPosition.z += (this.targetPosition.z - this.currentPosition.z) * alpha;

    // Smooth look-at
    this.currentLookAt.x += (this.targetLookAt.x - this.currentLookAt.x) * alpha;
    this.currentLookAt.y += (this.targetLookAt.y - this.currentLookAt.y) * alpha;
    this.currentLookAt.z += (this.targetLookAt.z - this.currentLookAt.z) * alpha;
  }

  /**
   * Apply calculated position and look-at to Three.js camera
   * @private
   */
  applyCameraTransform() {
    this.camera.position.set(
      this.currentPosition.x,
      this.currentPosition.y,
      this.currentPosition.z
    );

    this.camera.lookAt(
      this.currentLookAt.x,
      this.currentLookAt.y,
      this.currentLookAt.z
    );

    this.camera.updateProjectionMatrix();
  }

  /**
   * Animated transition to a specific view
   * Useful for cinematic shots or map view
   * 
   * @param {object} targetViewState - { position, lookAt, duration }
   */
  transitionToView(targetViewState) {
    this.targetPosition = { ...targetViewState.position };
    this.targetLookAt = { ...targetViewState.lookAt };

    this.isTransitioning = true;
    this.transitionDuration = targetViewState.duration || 1.0; // seconds
    this.transitionTime = 0;
  }

  /**
   * Toggle between navigation follow and free camera
   */
  toggleFollowMode() {
    this.followEnabled = !this.followEnabled;
  }

  /**
   * Enable GPS heading mode
   * Camera rotates with GPS bearing instead of character input
   */
  enableGPSHeadingMode() {
    this.gpsFollowMode = true;
    this.rotateWithPlayer = true;
  }

  /**
   * Disable GPS heading mode
   */
  disableGPSHeadingMode() {
    this.gpsFollowMode = false;
  }

  /**
   * Set camera parameters
   * @param {object} params - { distance, height, lookAheadDistance, smoothingSpeed }
   */
  setParameters(params) {
    if (params.distance !== undefined) this.distance = params.distance;
    if (params.height !== undefined) this.height = params.height;
    if (params.lookAheadDistance !== undefined) {
      this.lookAheadDistance = params.lookAheadDistance;
    }
    if (params.smoothingSpeed !== undefined) {
      this.smoothingSpeed = Math.max(0, Math.min(1, params.smoothingSpeed));
    }
  }

  /**
   * Get current camera state (for debugging)
   * @returns {object}
   */
  getState() {
    return {
      position: { ...this.currentPosition },
      lookAt: { ...this.currentLookAt },
      targetPosition: { ...this.targetPosition },
      targetLookAt: { ...this.targetLookAt },
      followEnabled: this.followEnabled,
      gpsFollowMode: this.gpsFollowMode,
    };
  }

  /**
   * First-person view preset
   */
  setFirstPersonView() {
    this.distance = 0;
    this.height = 1.6;
    this.lookAheadDistance = 15;
    this.smoothingSpeed = 0.12;
  }

  /**
   * Third-person view preset (default)
   */
  setThirdPersonView() {
    this.distance = 12;
    this.height = 6;
    this.lookAheadDistance = 30;
    this.smoothingSpeed = 0.08;
  }

  /**
   * Cinematic/overview preset
   */
  setCinematicView() {
    this.distance = 25;
    this.height = 15;
    this.lookAheadDistance = 50;
    this.smoothingSpeed = 0.05;
  }

  /**
   * Mobile-optimized preset (lower height for smaller screens)
   */
  setMobileView() {
    this.distance = 8;
    this.height = 4;
    this.lookAheadDistance = 20;
    this.smoothingSpeed = 0.1;
  }
}

export { NavigationCamera };
export default NavigationCamera;
