/**
 * 캐릭터 물리 컨트롤러
 * 간단한 물리와 Three.js 메시 동기화
 */

import * as THREE from 'three';

export class CharacterPhysics {
  constructor(world, mesh, coordSystem) {
    this.world = world;
    this.mesh = mesh;
    this.coordSystem = coordSystem;
    this.body = null;

    // 캐릭터 물리체 생성
    this.body = world.createCharacter(world, mesh.position);
    if (this.body) {
      this.body.mesh = mesh; // 메시 연결
    }

    // 상태
    this.isGrounded = false;
    this.lastGPS = null;
    this.moveSpeed = 5; // m/s
    this.bearing = 0; // 라디안
  }

  /**
   * 입력 기반 이동
   * @param {Object} direction - { x: -1~1, z: -1~1 } (로컬)
   * @param {number} bearing - 캐릭터 방향 (라디안)
   */
  move(direction, bearing) {
    if (!this.body || (direction.x === 0 && direction.z === 0)) return;
    if (!this.isGrounded) return; // 바닥에만 이동 가능

    this.bearing = bearing;

    // 로컬 → 월드 좌표 변환
    const moveX =
      direction.x * Math.cos(bearing) - direction.z * Math.sin(bearing);
    const moveZ =
      direction.x * Math.sin(bearing) + direction.z * Math.cos(bearing);

    // 직접 속도 설정
    this.body.velocity.x = moveX * this.moveSpeed;
    this.body.velocity.z = moveZ * this.moveSpeed;
  }

  /**
   * 점프
   */
  jump(force = 7) {
    if (!this.body || !this.isGrounded) return;
    this.body.velocity.y = force;
    this.isGrounded = false;
  }

  /**
   * GPS 위치로부터 캐릭터 업데이트
   * @param {Object} gps - { lng, lat }
   */
  updateFromGPS(gps) {
    if (!this.body) return;

    const newWorldPos = this.coordSystem.gpsToWorld(
      gps,
      this.body.position.y // Y는 유지
    );

    if (!this.lastGPS) {
      // 첫 GPS 신호: 직접 배치
      this.body.position.x = newWorldPos.x;
      this.body.position.z = newWorldPos.z;
    } else {
      // GPS 변화 거리 계산
      const distance = this.coordSystem.haversineDistance(this.lastGPS, gps);

      if (distance > 20) {
        // 20m 이상: 텔레포트
        this.body.position.x = newWorldPos.x;
        this.body.position.z = newWorldPos.z;
        this.body.velocity.x = 0;
        this.body.velocity.z = 0;
      } else if (distance > 0.1) {
        // 0.1~20m: 자연스러운 이동
        const dx = newWorldPos.x - this.body.position.x;
        const dz = newWorldPos.z - this.body.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 0) {
          const moveX = (dx / dist) * this.moveSpeed * 0.5;
          const moveZ = (dz / dist) * this.moveSpeed * 0.5;
          this.body.velocity.x = moveX;
          this.body.velocity.z = moveZ;
        }
      }
    }

    this.lastGPS = gps;
  }

  /**
   * 매 물리 스텝마다 호출 (동기화)
   */
  update() {
    if (!this.body || !this.mesh) return;

    // Three.js 메시와 물리체 동기화
    this.mesh.position.set(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z
    );

    // 바닥 감지
    this.updateGroundCheck();
  }

  /**
   * 바닥 감지
   */
  updateGroundCheck() {
    if (!this.body) return;
    // Y 위치가 거의 바닥(y = -0.1)에 가까우면 바닥 위에 있다고 판단
    this.isGrounded = Math.abs(this.body.position.y - (-0.1)) < 0.05;
  }

  /**
   * 캐릭터 회전
   * @param {number} angle - 회전량 (라디안)
   */
  rotate(angle) {
    this.bearing += angle;
    // Three.js 메시만 회전 (물리체는 유지)
    this.mesh.rotation.y = this.bearing;
  }
}
