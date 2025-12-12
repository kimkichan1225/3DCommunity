/**
 * 간단한 물리 엔진
 * 기본 중력, 충돌 감지 (Rapier 대신 사용)
 */

export class PhysicsWorld {
  constructor() {
    this.gravity = 9.81;
    this.timestep = 1 / 60;
    this.bodies = [];
  }

  static create() {
    return new PhysicsWorld();
  }

  addBody(body) {
    this.bodies.push(body);
    return body;
  }

  update(deltaTime) {
    // 간단한 물리 시뮬레이션
    let accumulator = 0;
    accumulator += Math.min(deltaTime, 0.016); // 최대 60fps

    while (accumulator >= this.timestep) {
      this.bodies.forEach((body) => {
        if (!body.isStatic) {
          // 중력 적용
          body.velocity.y -= this.gravity * this.timestep;

          // 위치 업데이트
          body.position.x += body.velocity.x * this.timestep;
          body.position.y += body.velocity.y * this.timestep;
          body.position.z += body.velocity.z * this.timestep;

          // 바닥 충돌 감지
          if (body.position.y <= -0.1) {
            body.position.y = -0.1;
            body.velocity.y = 0;
            body.isGrounded = true;
          } else {
            body.isGrounded = false;
          }
        }
      });

      accumulator -= this.timestep;
    }
  }

  static createGround(world, size = 1000, y = -0.1) {
    const ground = {
      position: { x: 0, y, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      isStatic: true,
      isGrounded: true,
      radius: size,
    };
    world.addBody(ground);
    return ground;
  }

  static createCharacter(world, position) {
    const character = {
      position: { ...position },
      velocity: { x: 0, y: 0, z: 0 },
      isStatic: false,
      isGrounded: false,
      radius: 0.4,
      height: 1.6,
    };
    world.addBody(character);
    return character;
  }
}
