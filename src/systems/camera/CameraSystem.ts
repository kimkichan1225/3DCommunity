// src/systems/camera/CameraSystem.ts

import * as THREE from 'three';
import { exponentialSmoothingVector, slerpAngle } from '../../utils/math';
import { normalizeAngle } from '../../utils/coordinates';
import type { CameraConfig, ICameraSystem } from '../../types';
import { DEFAULT_CAMERA_CONFIG } from '../../utils/config';

/**
 * 네비게이션 스타일 카메라 시스템
 * - 캐릭터 뒤에서 앞을 바라보는 시점
 * - 부드러운 보간 및 지형 따라가기
 */
export class CameraSystem implements ICameraSystem {
  private camera: THREE.PerspectiveCamera;
  private config: CameraConfig;

  // 현재 상태
  private currentPos = new THREE.Vector3();
  private targetPos = new THREE.Vector3();
  private currentLookAt = new THREE.Vector3();
  private targetLookAt = new THREE.Vector3();

  // 카메라 헤딩
  private currentHeading = 0;
  private targetHeading = 0;

  constructor(camera: THREE.PerspectiveCamera, config?: Partial<CameraConfig>) {
    this.camera = camera;
    this.config = { ...DEFAULT_CAMERA_CONFIG, ...config };
  }

  /**
   * 카메라 업데이트
   */
  update(
    playerPos: THREE.Vector3,
    playerHeading: number,
    deltaTime: number = 0.016
  ): void {
    // 1. 목표 위치 계산
    this.calculateTargetTransform(playerPos, playerHeading);

    // 2. 부드러운 보간
    this.interpolateTransform(deltaTime);

    // 3. 카메라 적용
    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentLookAt);
  }

  /**
   * 목표 카메라 위치 및 LookAt 계산
   */
  private calculateTargetTransform(playerPos: THREE.Vector3, playerHeading: number): void {
    // 플레이어 헤딩에 따른 오프셋 계산
    const cos = Math.cos(playerHeading);
    const sin = Math.sin(playerHeading);

    // 카메라 위치: 캐릭터 뒤쪽 + 위쪽
    const offsetBack = this.config.distance;
    const offsetHeight = this.config.height;

    // Three.js: Z축이 북쪽(0), X축이 동쪽(π/2)
    this.targetPos.set(
      playerPos.x - sin * offsetBack,
      playerPos.y + offsetHeight,
      playerPos.z - cos * offsetBack
    );

    // LookAt 대상: 플레이어 앞 방향
    const lookAheadDist = this.config.lookAheadDistance;
    this.targetLookAt.set(
      playerPos.x + sin * lookAheadDist,
      playerPos.y + 1.5, // 눈 높이
      playerPos.z + cos * lookAheadDist
    );

    // 헤딩 업데이트
    this.targetHeading = playerHeading;
  }

  /**
   * 지형 고도에 따른 카메라 조정 (옵션)
   */
  adjustForTerrain(terrainHeightAhead: number, currentHeight: number): void {
    // 전방 경사에 따라 카메라 기울임 조정
    const slope = (terrainHeightAhead - currentHeight) / this.config.lookAheadDistance;
    const adjustment = Math.atan(slope) * this.config.verticalAngle;

    this.targetLookAt.y += adjustment;
  }

  /**
   * 부드러운 보간 (Exponential Smoothing)
   */
  private interpolateTransform(deltaTime: number): void {
    // 위치 보간
    const posLerpAlpha = 1 - Math.exp(-5 * deltaTime); // 5 = damping
    this.currentPos.lerp(this.targetPos, posLerpAlpha);

    // LookAt 보간
    const lookLerpAlpha = 1 - Math.exp(-5 * deltaTime);
    this.currentLookAt.lerp(this.targetLookAt, lookLerpAlpha);

    // 헤딩 보간 (각도는 특별 처리)
    const headingDiff = normalizeAngle(this.targetHeading - this.currentHeading);
    this.currentHeading += headingDiff * 0.1; // 10% per frame
  }

  /**
   * 카메라 설정 변경
   */
  setCameraOffset(config: Partial<CameraConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 카메라 인스턴스 반환
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * 현재 카메라 설정 반환
   */
  getConfig(): CameraConfig {
    return { ...this.config };
  }

  /**
   * 카메라 위치 반환
   */
  getPosition(): THREE.Vector3 {
    return this.camera.position.clone();
  }

  /**
   * 즉시 카메라 위치 설정 (보간 없음)
   */
  setPositionImmediate(position: THREE.Vector3, lookAt: THREE.Vector3): void {
    this.camera.position.copy(position);
    this.camera.lookAt(lookAt);
    this.currentPos.copy(position);
    this.currentLookAt.copy(lookAt);
  }
}
