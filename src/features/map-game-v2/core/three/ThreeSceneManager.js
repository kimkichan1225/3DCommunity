/**
 * Three.js Scene Manager
 * Handles Three.js scene, renderer, and WebGL context integration with Mapbox
 */

import * as THREE from 'three';

class ThreeSceneManager {
  constructor(canvasElement, options = {}) {
    if (!canvasElement) {
      throw new Error('Canvas element required for ThreeSceneManager');
    }

    this.canvas = canvasElement;
    this.width = options.width || canvasElement.clientWidth || 800;
    this.height = options.height || canvasElement.clientHeight || 600;

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
    this.scene.fog = new THREE.Fog(0x87CEEB, 1000, 2000);

    // Camera setup
    this.camera = this.createCamera();

    // Renderer setup
    this.renderer = this.createRenderer();

    // Lighting
    this.lights = this.setupLighting();

    // Objects registry
    this.objects = new Map();
    this.updateCallbacks = [];

    // Render loop state
    this.isRunning = false;
    this.deltaTime = 0;
    this.lastTime = performance.now();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  /**
   * Create Three.js camera with proper aspect ratio
   * @private
   * @returns {THREE.PerspectiveCamera}
   */
  createCamera() {
    const fov = 75;
    const aspect = this.width / this.height;
    const near = 0.1;
    const far = 5000;

    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 15, 25); // Third-person view starting position
    camera.lookAt(0, 0, 0);

    return camera;
  }

  /**
   * Create Three.js renderer with WebGL
   * @private
   * @returns {THREE.WebGLRenderer}
   */
  createRenderer() {
    const renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      precision: 'highp',
      powerPreference: 'high-performance',
    });

    renderer.setSize(this.width, this.height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    return renderer;
  }

  /**
   * Setup scene lighting
   * @private
   * @returns {object} Lights reference object
   */
  setupLighting() {
    const lights = {};

    // Directional light (sun)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(100, 100, 100);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.far = 3500;
    dirLight.shadow.camera.left = -500;
    dirLight.shadow.camera.right = 500;
    dirLight.shadow.camera.top = 500;
    dirLight.shadow.camera.bottom = -500;
    dirLight.shadow.bias = -0.0001;
    this.scene.add(dirLight);
    lights.directional = dirLight;

    // Ambient light (fills shadows)
    const ambLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambLight);
    lights.ambient = ambLight;

    // Hemisphere light (natural sky gradient)
    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x404040, 0.4);
    this.scene.add(hemiLight);
    lights.hemisphere = hemiLight;

    return lights;
  }

  /**
   * Add object to scene
   * @param {THREE.Object3D} object - Three.js object to add
   * @param {string} name - Unique identifier for the object
   */
  addObject(object, name) {
    if (this.objects.has(name)) {
      console.warn(`Object with name "${name}" already exists, replacing`);
      this.removeObject(name);
    }

    this.scene.add(object);
    this.objects.set(name, object);
  }

  /**
   * Get object by name
   * @param {string} name - Object identifier
   * @returns {THREE.Object3D} The object, or undefined
   */
  getObject(name) {
    return this.objects.get(name);
  }

  /**
   * Remove object from scene
   * @param {string} name - Object identifier
   */
  removeObject(name) {
    const object = this.objects.get(name);
    if (object) {
      this.scene.remove(object);
      this.objects.delete(name);

      // Cleanup geometry and materials
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(m => m.dispose());
        } else {
          object.material.dispose();
        }
      }
    }
  }

  /**
   * Register callback for each render frame
   * Useful for game systems that need to update each frame
   * 
   * @param {function} callback - Function(deltaTime, scene, camera)
   */
  onUpdate(callback) {
    this.updateCallbacks.push(callback);
  }

  /**
   * Remove update callback
   * @param {function} callback - Callback to remove
   */
  offUpdate(callback) {
    this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback);
  }

  /**
   * Start render loop
   */
  startRender() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.renderLoop();
  }

  /**
   * Stop render loop
   */
  stopRender() {
    this.isRunning = false;
  }

  /**
   * Render loop (called continuously via requestAnimationFrame)
   * @private
   */
  renderLoop = () => {
    if (!this.isRunning) return;

    const now = performance.now();
    this.deltaTime = Math.min((now - this.lastTime) / 1000, 0.016); // Cap at 16ms (60 FPS)
    this.lastTime = now;

    // Call update callbacks
    this.updateCallbacks.forEach(callback => {
      try {
        callback(this.deltaTime, this.scene, this.camera);
      } catch (error) {
        console.error('Error in update callback:', error);
      }
    });

    // Render scene
    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.renderLoop);
  };

  /**
   * Get camera
   * @returns {THREE.PerspectiveCamera}
   */
  getCamera() {
    return this.camera;
  }

  /**
   * Get scene
   * @returns {THREE.Scene}
   */
  getScene() {
    return this.scene;
  }

  /**
   * Get renderer
   * @returns {THREE.WebGLRenderer}
   */
  getRenderer() {
    return this.renderer;
  }

  /**
   * Handle window resize
   * @private
   */
  onWindowResize() {
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
  }

  /**
   * Create a simple ground plane for reference
   * @param {number} size - Size of the ground plane
   * @param {string} name - Object name
   */
  createGroundPlane(size = 100, name = 'ground') {
    const geometry = new THREE.PlaneGeometry(size, size);
    const material = new THREE.MeshStandardMaterial({
      color: 0x90EE90,
      roughness: 0.7,
      metalness: 0.1,
    });

    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = name;

    this.addObject(ground, name);
    return ground;
  }

  /**
   * Create a simple character (capsule shape)
   * @param {number} height - Character height
   * @param {string} name - Object name
   * @returns {THREE.Group}
   */
  createCharacterMesh(height = 2, name = 'character') {
    const group = new THREE.Group();

    // Head (sphere)
    const headGeo = new THREE.SphereGeometry(height * 0.2, 32, 32);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = height * 0.7;
    head.castShadow = true;
    group.add(head);

    // Body (cylinder)
    const bodyGeo = new THREE.CylinderGeometry(height * 0.15, height * 0.15, height * 0.4);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4488ff });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = height * 0.35;
    body.castShadow = true;
    group.add(body);

    // Legs (cylinders)
    const legGeo = new THREE.CylinderGeometry(height * 0.1, height * 0.1, height * 0.35);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(height * 0.1, height * 0.12, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(-height * 0.1, height * 0.12, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    group.name = name;
    this.addObject(group, name);
    return group;
  }

  /**
   * Create a line to visualize a path/route
   * @param {array} points - Array of { x, y, z } positions
   * @param {number} color - Line color (hex)
   * @param {string} name - Object name
   * @returns {THREE.Line}
   */
  createPathLine(points, color = 0xff0000, name = 'path') {
    const geometry = new THREE.BufferGeometry();
    const positions = [];

    points.forEach(point => {
      positions.push(point.x, point.y || 0.5, point.z);
    });

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));

    const material = new THREE.LineBasicMaterial({
      color,
      linewidth: 3,
      fog: true,
    });

    const line = new THREE.Line(geometry, material);
    this.addObject(line, name);
    return line;
  }

  /**
   * Create a curved path using CatmullRomCurve3 for smooth routes
   * @param {array} points - Array of { x, y, z } control points
   * @param {number} segments - Number of segments (higher = smoother)
   * @param {number} color - Line color
   * @param {string} name - Object name
   * @returns {THREE.Line}
   */
  createCurvedPathLine(points, segments = 50, color = 0x00ff00, name = 'curvedPath') {
    // Convert to THREE.Vector3
    const vectors = points.map(p => new THREE.Vector3(p.x, p.y || 0.5, p.z));

    // Create Catmull-Rom curve for smooth interpolation
    const curve = new THREE.CatmullRomCurve3(vectors);
    const pathPoints = curve.getPoints(segments);

    // Create geometry from curve points
    const geometry = new THREE.BufferGeometry();
    const positions = [];

    pathPoints.forEach(point => {
      positions.push(point.x, point.y, point.z);
    });

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));

    const material = new THREE.LineBasicMaterial({
      color,
      linewidth: 3,
      fog: true,
    });

    const line = new THREE.Line(geometry, material);
    this.addObject(line, name);
    return line;
  }

  /**
   * Create 3D text for labels/markers
   * Requires TextGeometry and font loader (advanced usage)
   * Simplified version for basic labels
   * 
   * @param {string} text - Text to display
   * @param {object} position - { x, y, z } position
   * @param {number} size - Font size
   * @param {string} name - Object name
   * @returns {THREE.Sprite}
   */
  createTextLabel(text, position, size = 10, name = 'label') {
    // Simple sprite-based label (alternative to TextGeometry)
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;

    context.fillStyle = 'white';
    context.font = `${size * 10}px Arial`;
    context.fillText(text, 20, 80);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);

    sprite.position.set(position.x, position.y, position.z);
    sprite.scale.set(10, 3, 1);
    sprite.name = name;

    this.addObject(sprite, name);
    return sprite;
  }

  /**
   * Update camera position to follow object
   * Third-person camera with smooth interpolation
   * 
   * @param {object} targetPos - { x, y, z } target position
   * @param {object} targetForward - { x, z } forward direction (normalized)
   * @param {number} distance - Camera distance from target
   * @param {number} height - Camera height above target
   */
  updateThirdPersonCamera(targetPos, targetForward, distance = 10, height = 5) {
    // Calculate camera position behind target
    const cameraOffset = {
      x: -targetForward.x * distance,
      y: height,
      z: -targetForward.z * distance,
    };

    const targetCameraPos = {
      x: targetPos.x + cameraOffset.x,
      y: targetPos.y + cameraOffset.y,
      z: targetPos.z + cameraOffset.z,
    };

    // Smooth camera movement
    const alpha = 0.1; // Camera response (0.1 = responsive, 0.05 = smooth)
    this.camera.position.x += (targetCameraPos.x - this.camera.position.x) * alpha;
    this.camera.position.y += (targetCameraPos.y - this.camera.position.y) * alpha;
    this.camera.position.z += (targetCameraPos.z - this.camera.position.z) * alpha;

    // Look at target
    const lookAtPos = {
      x: targetPos.x,
      y: targetPos.y + height * 0.6,
      z: targetPos.z,
    };
    this.camera.lookAt(lookAtPos.x, lookAtPos.y, lookAtPos.z);
  }

  /**
   * Get WebGL context for Mapbox integration
   * @returns {WebGLRenderingContext}
   */
  getWebGLContext() {
    return this.renderer.getContext();
  }

  /**
   * Clean up resources (call on component unmount)
   */
  dispose() {
    this.stopRender();

    // Dispose all objects
    this.objects.forEach((object, name) => {
      this.removeObject(name);
    });

    // Dispose renderer
    this.renderer.dispose();

    // Remove event listeners
    window.removeEventListener('resize', () => this.onWindowResize());

    this.updateCallbacks = [];
  }
}

export { ThreeSceneManager };
export default ThreeSceneManager;
