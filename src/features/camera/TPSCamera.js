/**
 * TPS 카메라 시스템 (Pokemon GO 스타일)
 */

import * as THREE from 'three';

export class TPSCamera {
  constructor(camera, characterMesh, renderer) {
    this.camera = camera;
    this.characterMesh = characterMesh;
    this.renderer = renderer;

    // Pokemon GO 스타일 기본값
    this.config = {
      fov: 40, // 좁은 시야
      distance: 3, // 아주 가까움
      height: 1.6, // 사람 눈높이
      pitch: 70, // 도 (위에서 내려봄)
      yaw: 0, // 도
      lerpSpeed: 0.1, // 부드러움 (0-1)
    };

    // 카메라 위치 캐시
    this.targetPosition = new THREE.Vector3();
    this.currentPosition = this.camera.position.clone();
    this.targetLookAt = new THREE.Vector3();

    // 모바일 입력 상태
    this.touchStartY = 0;
    this.touchStartX = 0;
    this.setupInputListeners();
  }

  setupInputListeners() {
    // 터치 드래그: 카메라 회전
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.touchStartY = e.touches[0].clientY;
        this.touchStartX = e.touches[0].clientX;
      }
    });

    document.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        const deltaY = e.touches[0].clientY - this.touchStartY;
        const deltaX = e.touches[0].clientX - this.touchStartX;

        // Pitch 조정 (위/아래)
        this.config.pitch -= deltaY * 0.1;
        this.config.pitch = Math.max(30, Math.min(80, this.config.pitch));

        // Yaw 조정 (좌/우)
        this.config.yaw += deltaX * 0.1;

        this.touchStartY = e.touches[0].clientY;
        this.touchStartX = e.touches[0].clientX;
      }
    });

    // 기울기 센서 (모바일)
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', (e) => {
        // alpha: 좌/우 회전 (0-360)
        // beta: 앞/뒤 기울기 (-180 ~ 180)
        // gamma: 좌우 기울기 (-90 ~ 90)
        if (e.alpha) {
          this.config.yaw = e.alpha * (Math.PI / 180);
        }
      });
    }

    // 마우스 휠: 거리 조정
    document.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.zoom(e.deltaY > 0 ? -0.5 : 0.5);
    });
  }

  /**
   * 카메라 업데이트 (매 프레임)
   * @param {number} characterBearing - 캐릭터 방향 (라디안)
   */
  update(characterBearing) {
    // Pitch/Yaw를 라디안으로 변환
    const pitchRad = (this.config.pitch * Math.PI) / 180;
    const yawRad = (this.config.yaw * Math.PI) / 180 + characterBearing;

    // 구면 좌표 → 직각 좌표
    const horizontalDist = this.config.distance * Math.cos(pitchRad);
    const verticalDist = this.config.distance * Math.sin(pitchRad);

    const charPos = this.characterMesh.position;

    // 목표 카메라 위치
    this.targetPosition.set(
      charPos.x + Math.sin(yawRad) * horizontalDist,
      charPos.y + this.config.height + verticalDist,
      charPos.z + Math.cos(yawRad) * horizontalDist
    );

    // 목표 LookAt (캐릭터 머리 쪽)
    this.targetLookAt.set(charPos.x, charPos.y + 1.5, charPos.z);

    // 부드러운 보간 (Lerp)
    this.currentPosition.lerp(this.targetPosition, this.config.lerpSpeed);
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.targetLookAt);

    // FOV 설정
    this.camera.fov = this.config.fov;
    this.camera.updateProjectionMatrix();
  }

  /**
   * 카메라 줌 (거리 조정)
   * @param {number} delta - 변화량
   */
  zoom(delta) {
    this.config.distance += delta;
    this.config.distance = Math.max(1, Math.min(10, this.config.distance));
  }

  /**
   * 카메라 기본값으로 초기화
   */
  reset() {
    this.config.pitch = 70;
    this.config.yaw = 0;
    this.config.distance = 3;
  }
}
