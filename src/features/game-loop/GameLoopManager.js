/**
 * 게임 루프 매니저
 * 렌더링, 물리, 입력 통합
 */

import * as THREE from 'three';

export class GameLoopManager {
  constructor(config) {
    this.scene = config.scene;
    this.world = config.world;
    this.camera = config.camera;
    this.map = config.map;
    this.renderer = config.renderer;
    this.characterMesh = config.characterMesh;
    this.characterPhysics = config.characterPhysics;
    this.tpsCamera = config.tpsCamera;
    this.coordSystem = config.coordSystem;

    this.clock = new THREE.Clock();
    this.accumulator = 0;
    this.fixedTimestep = 1 / 60; // 60 FPS 물리
    this.maxFrameSkip = 4; // 최대 4프레임 스킵
    this.isRunning = false;

    // 입력 상태
    this.inputState = {
      w: false,
      a: false,
      s: false,
      d: false,
    };

    // 통계
    this.stats = {
      fps: 0,
      physicsFrames: 0,
      lastFrameTime: Date.now(),
    };

    this.setupInputListeners();
  }

  setupInputListeners() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (key in this.inputState) {
        this.inputState[key] = true;
      }

      // 특수 키
      if (key === ' ') {
        this.characterPhysics.jump();
      }
      if (key === 'r') {
        this.tpsCamera.reset();
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (key in this.inputState) {
        this.inputState[key] = false;
      }
    });
  }

  /**
   * 게임 루프 시작
   */
  start() {
    this.isRunning = true;
    this.clock.start();
    this.gameLoop();
  }

  /**
   * 게임 루프 중지
   */
  stop() {
    this.isRunning = false;
  }

  /**
   * 메인 게임 루프
   */
  gameLoop = () => {
    if (!this.isRunning) return;

    const deltaTime = Math.min(this.clock.getDelta(), 0.1); // 최대 100ms

    // 1️⃣ 입력 처리
    this.handleInput();

    // 2️⃣ 물리 업데이트 (고정 timestep)
    this.accumulator += deltaTime;
    let physicsFrames = 0;
    while (
      this.accumulator >= this.fixedTimestep &&
      physicsFrames < this.maxFrameSkip
    ) {
      this.world.update(this.fixedTimestep);
      this.characterPhysics.update();
      this.accumulator -= this.fixedTimestep;
      physicsFrames++;
    }
    this.stats.physicsFrames = physicsFrames;

    // 3️⃣ 카메라 업데이트
    const bearing = this.characterPhysics.bearing;
    this.tpsCamera.update(bearing);

    // 4️⃣ 렌더링
    this.renderer.render(this.scene, this.camera);
    this.map.triggerRepaint();

    // 5️⃣ 통계 업데이트
    this.updateStats();

    // 6️⃣ 다음 프레임
    requestAnimationFrame(this.gameLoop);
  };

  /**
   * 입력 처리
   */
  handleInput() {
    const direction = { x: 0, z: 0 };

    if (this.inputState.w) direction.z -= 1; // 앞
    if (this.inputState.s) direction.z += 1; // 뒤
    if (this.inputState.a) direction.x -= 1; // 좌
    if (this.inputState.d) direction.x += 1; // 우

    // Q/E로 회전
    if (this.inputState.q) {
      this.characterPhysics.rotate(0.05);
    }
    if (this.inputState.e) {
      this.characterPhysics.rotate(-0.05);
    }

    const bearing = this.characterPhysics.bearing;
    this.characterPhysics.move(direction, bearing);
  }

  /**
   * 통계 업데이트 (디버그용)
   */
  updateStats() {
    const now = Date.now();
    const elapsed = now - this.stats.lastFrameTime;

    if (elapsed >= 1000) {
      // 1초마다
      this.stats.fps = Math.round(1000 / elapsed);
      this.stats.lastFrameTime = now;

      // 콘솔 로그 (필요시)
      // console.log(`FPS: ${this.stats.fps}, Physics Frames: ${this.stats.physicsFrames}`);
    }
  }

  /**
   * 게임 상태 반환 (UI 업데이트용)
   */
  getGameState() {
    const pos = this.characterPhysics.body.translation();
    const gps = this.characterPhysics.lastGPS;

    return {
      fps: this.stats.fps,
      position: [pos.x, pos.y, pos.z],
      gps: gps || { lng: 0, lat: 0 },
      bearing: Math.round((this.characterPhysics.bearing * 180) / Math.PI),
      isGrounded: this.characterPhysics.isGrounded,
    };
  }
}
