/**
 * Physics Controller
 * Lightweight physics engine for character control and gravity
 * Designed for GPS-based games where precise collision isn't critical
 */

class SimplePhysicsBody {
  constructor(position = { x: 0, y: 0, z: 0 }, options = {}) {
    this.position = { ...position };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.acceleration = { x: 0, y: 0, z: 0 };

    // Physics properties
    this.mass = options.mass || 1;
    this.friction = options.friction || 0.9; // 0-1 (higher = more sliding)
    this.gravityScale = options.gravityScale !== undefined ? options.gravityScale : 1;
    this.isGravityEnabled = options.isGravityEnabled !== false;

    // Constraints
    this.maxVelocity = options.maxVelocity || 50; // Units per second
    this.minY = options.minY || -1000; // Prevent falling too far

    // State flags
    this.isGrounded = false;
    this.lastGroundY = position.y;

    this.radius = options.radius || 0.5; // For simple collision

    // Accumulated forces (reset each frame)
    this.forces = [];
  }

  /**
   * Add force to this body
   * @param {object} force - { x, y, z } force vector
   */
  addForce(force) {
    this.forces.push(force);
  }

  /**
   * Apply impulse (instant velocity change)
   * Useful for jumping
   * 
   * @param {object} impulse - { x, y, z } velocity change
   */
  applyImpulse(impulse) {
    this.velocity.x += impulse.x / this.mass;
    this.velocity.y += impulse.y / this.mass;
    this.velocity.z += impulse.z / this.mass;
  }

  /**
   * Update physics simulation
   * @param {number} deltaTime - Time step in seconds (e.g., 1/60)
   * @param {number} gravity - Gravity acceleration (e.g., 9.81 m/s²)
   */
  update(deltaTime, gravity = 9.81) {
    // Calculate acceleration from forces
    let accelX = 0;
    let accelY = 0;
    let accelZ = 0;

    // Add gravity
    if (this.isGravityEnabled) {
      accelY -= gravity * this.gravityScale;
    }

    // Apply forces
    this.forces.forEach(force => {
      accelX += (force.x || 0) / this.mass;
      accelY += (force.y || 0) / this.mass;
      accelZ += (force.z || 0) / this.mass;
    });

    // Update velocity from acceleration
    this.velocity.x += accelX * deltaTime;
    this.velocity.y += accelY * deltaTime;
    this.velocity.z += accelZ * deltaTime;

    // Apply friction (air resistance)
    this.velocity.x *= this.friction;
    this.velocity.z *= this.friction;

    // Clamp maximum velocity
    const velocityMag = Math.sqrt(
      this.velocity.x * this.velocity.x +
      this.velocity.y * this.velocity.y +
      this.velocity.z * this.velocity.z
    );

    if (velocityMag > this.maxVelocity) {
      const scale = this.maxVelocity / velocityMag;
      this.velocity.x *= scale;
      this.velocity.y *= scale;
      this.velocity.z *= scale;
    }

    // Update position from velocity
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;

    // Handle ground collision (simple Y-check)
    if (this.position.y < 0) {
      this.position.y = 0;
      this.velocity.y = 0; // Stop vertical movement
      this.isGrounded = true;
      this.lastGroundY = 0;
    } else {
      this.isGrounded = false;
    }

    // Prevent falling too far
    if (this.position.y < this.minY) {
      this.position.y = this.minY;
      this.velocity.y = 0;
    }

    // Clear forces for next frame
    this.forces = [];
  }

  /**
   * Get state as object
   * @returns {object}
   */
  getState() {
    return {
      position: { ...this.position },
      velocity: { ...this.velocity },
      isGrounded: this.isGrounded,
    };
  }
}

/**
 * Character Physics Controller
 * Handles player character movement with keyboard/input integration
 */
class CharacterController {
  constructor(body, options = {}) {
    this.body = body;

    // Movement properties
    this.moveSpeed = options.moveSpeed || 10; // Units per second
    this.sprintSpeed = options.sprintSpeed || 15;
    this.jumpForce = options.jumpForce || 15;

    // Input handling
    this.inputVector = { x: 0, z: 0 }; // Forward/Right movement
    this.wantToJump = false;
    this.isSprinting = false;

    // Heading/direction
    this.heading = 0; // Radians, 0 = facing +Z
    this.headingVelocity = 0;
    this.headingDamping = 0.2; // How quickly heading changes

    // Animation state
    this.isMoving = false;
    this.currentSpeed = 0;
  }

  /**
   * Set input from keyboard/gamepad
   * @param {object} input - { forward, back, left, right, sprint, jump }
   */
  setInput(input) {
    this.inputVector.x = 0;
    this.inputVector.z = 0;

    if (input.forward) this.inputVector.z += 1;
    if (input.back) this.inputVector.z -= 1;
    if (input.right) this.inputVector.x += 1;
    if (input.left) this.inputVector.x -= 1;

    // Normalize diagonal movement
    const magn = Math.sqrt(this.inputVector.x * this.inputVector.x + this.inputVector.z * this.inputVector.z);
    if (magn > 0) {
      this.inputVector.x /= magn;
      this.inputVector.z /= magn;
    }

    this.isSprinting = input.sprint || false;
    this.wantToJump = input.jump || false;
  }

  /**
   * Set character heading (direction facing)
   * @param {number} targetHeading - Target heading in radians
   * @param {number} deltaTime - Time since last frame
   */
  updateHeading(targetHeading, deltaTime) {
    let diff = targetHeading - this.heading;

    // Shortest angle
    if (diff > Math.PI) diff -= 2 * Math.PI;
    if (diff < -Math.PI) diff += 2 * Math.PI;

    // Smooth heading change
    this.headingVelocity += diff * this.headingDamping;
    this.headingVelocity *= 0.9; // Damping

    this.heading += this.headingVelocity * deltaTime;

    // Normalize heading
    this.heading = ((this.heading % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  }

  /**
   * Apply movement based on input
   * @param {number} deltaTime - Time step
   */
  applyMovement(deltaTime) {
    // Don't move if no input
    if (this.inputVector.x === 0 && this.inputVector.z === 0) {
      this.isMoving = false;
      this.currentSpeed = 0;
      return;
    }

    this.isMoving = true;

    // Calculate movement speed
    const speed = this.isSprinting ? this.sprintSpeed : this.moveSpeed;
    this.currentSpeed = speed;

    // Apply heading rotation to input vector
    const cos = Math.cos(this.heading);
    const sin = Math.sin(this.heading);

    const rotatedX = this.inputVector.x * cos - this.inputVector.z * sin;
    const rotatedZ = this.inputVector.x * sin + this.inputVector.z * cos;

    // Apply velocity (horizontal only, preserve vertical)
    this.body.velocity.x = rotatedX * speed;
    this.body.velocity.z = rotatedZ * speed;
  }

  /**
   * Handle jump input
   */
  jump() {
    if (!this.wantToJump) return;
    if (!this.body.isGrounded) return; // Can't jump while in air

    this.body.applyImpulse({ x: 0, y: this.jumpForce, z: 0 });
    this.wantToJump = false;
  }

  /**
   * Update character controller
   * @param {number} deltaTime - Time since last frame
   */
  update(deltaTime) {
    this.applyMovement(deltaTime);
    this.jump();

    // Update physics body
    this.body.update(deltaTime);
  }

  /**
   * Get character state for rendering
   * @returns {object}
   */
  getState() {
    return {
      position: { ...this.body.position },
      velocity: { ...this.body.velocity },
      heading: this.heading,
      isMoving: this.isMoving,
      isGrounded: this.body.isGrounded,
      isSprinting: this.isSprinting,
      speed: this.currentSpeed,
    };
  }
}

/**
 * Physics World
 * Manages all physics bodies and collision detection
 */
class PhysicsWorld {
  constructor(options = {}) {
    this.gravity = options.gravity || 9.81;
    this.bodies = [];
    this.fixedTimestep = options.fixedTimestep || 1 / 60; // 60 Hz physics
    this.accumulator = 0;

    // Collision layers
    this.collisionLayers = new Map();
  }

  /**
   * Add body to world
   * @param {SimplePhysicsBody} body
   */
  addBody(body) {
    this.bodies.push(body);
  }

  /**
   * Remove body from world
   * @param {SimplePhysicsBody} body
   */
  removeBody(body) {
    const index = this.bodies.indexOf(body);
    if (index > -1) {
      this.bodies.splice(index, 1);
    }
  }

  /**
   * Step simulation with fixed timestep
   * Accumulator pattern for stable physics
   * 
   * @param {number} deltaTime - Time since last update (variable)
   */
  step(deltaTime) {
    // Add to accumulator
    this.accumulator += deltaTime;

    // Fixed timestep updates
    while (this.accumulator >= this.fixedTimestep) {
      // Update all bodies
      this.bodies.forEach(body => {
        body.update(this.fixedTimestep, this.gravity);
      });

      // Simple collision detection between bodies
      this.checkCollisions();

      this.accumulator -= this.fixedTimestep;
    }
  }

  /**
   * Simple sphere-to-ground collision detection
   * @private
   */
  checkCollisions() {
    // This is simplified - just ground collision is handled in body.update()
    // For more complex collisions, add sphere-sphere or sphere-plane checks here

    // Example sphere-to-sphere collision (simplified)
    for (let i = 0; i < this.bodies.length; i++) {
      for (let j = i + 1; j < this.bodies.length; j++) {
        const bodyA = this.bodies[i];
        const bodyB = this.bodies[j];

        const dx = bodyB.position.x - bodyA.position.x;
        const dy = bodyB.position.y - bodyA.position.y;
        const dz = bodyB.position.z - bodyA.position.z;

        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const minDistance = bodyA.radius + bodyB.radius;

        // Simple collision response (push apart)
        if (distance < minDistance && distance > 0) {
          const overlap = minDistance - distance;
          const nx = dx / distance;
          const ny = dy / distance;
          const nz = dz / distance;

          bodyA.position.x -= (overlap * 0.5) * nx;
          bodyA.position.y -= (overlap * 0.5) * ny;
          bodyA.position.z -= (overlap * 0.5) * nz;

          bodyB.position.x += (overlap * 0.5) * nx;
          bodyB.position.y += (overlap * 0.5) * ny;
          bodyB.position.z += (overlap * 0.5) * nz;
        }
      }
    }
  }

  /**
   * Clear all bodies
   */
  clear() {
    this.bodies = [];
    this.accumulator = 0;
  }
}

export { SimplePhysicsBody, CharacterController, PhysicsWorld };
export default { SimplePhysicsBody, CharacterController, PhysicsWorld };
