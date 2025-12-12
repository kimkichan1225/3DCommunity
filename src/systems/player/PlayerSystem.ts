// src/systems/player/PlayerSystem.ts

import * as THREE from 'three';
import { calculateBearing, calculateDistance } from '../../utils/coordinates';
import { CoordinateSystem } from '../../utils/coordinates';
import type { LngLat, PlayerState, CharacterModel, IPlayerSystem, CoordinateConverter } from '../../types';
import { CHARACTER_CONFIG, ANIMATION_THRESHOLDS } from '../../utils/config';

/**
 * 플레이어(캐릭터) 시스템
 * - glTF 모델 로드
 * - 물리 기반 이동
 * - 애니메이션 상태 관리
 */
export class PlayerSystem implements IPlayerSystem {
  private model: CharacterModel | null = null;
  private mesh: THREE.Group | null = null;
  private coordinator: CoordinateConverter;

  // 플레이어 상태
  private state: PlayerState = {
    position: [0, 0], // LngLat
    worldPosition: new THREE.Vector3(),
    heading: 0, // 라디안
    velocity: 0,
    isMoving: false,
    animationState: 'idle',
    height: CHARACTER_CONFIG.height
  };

  private targetWorldPos: THREE.Vector3 | null = null;
  private lastLngLat: LngLat | null = null;

  constructor(coordinator: CoordinateConverter) {
    this.coordinator = coordinator;
  }

  /**
   * 캐릭터 모델 로드
   */
  async initialize(gltfPath: string): Promise<CharacterModel> {
    // 외부 모델 로딩 스킵 - 바로 기본 큐브 생성
    console.log('⚠️ 기본 3D 모델 생성 중...');
    
    const geometry = new THREE.BoxGeometry(0.5, 1.8, 0.5);
    const material = new THREE.MeshPhongMaterial({ color: 0xff4444 });
    const mesh = new THREE.Mesh(geometry, material);
    
    // 그림자 설정
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    this.mesh = mesh;
    this.model = {
      mesh,
      animations: [],
      mixer: new THREE.AnimationMixer(mesh),
      actions: {}
    };
    
    console.log('✅ 기본 모델 생성 완료');
    return this.model;
  }

  /**
   * 플레이어 업데이트 (GPS 위치 → World 좌표)
   */
  update(gpsPosition: LngLat, deltaTime: number = 0.016): void {
    // 이전 위치
    const prevPos = this.state.worldPosition.clone();

    // 새로운 World 좌표 계산
    const newWorldPos = (this.coordinator as CoordinateSystem).lngLatToWorld(gpsPosition);
    this.state.position = gpsPosition;
    this.state.worldPosition.copy(newWorldPos);

    // 메시 위치 동기화
    if (this.mesh) {
      this.mesh.position.copy(newWorldPos);
    }

    // 속도 계산
    const displacement = newWorldPos.clone().sub(prevPos);
    this.state.velocity = displacement.length() / deltaTime;

    // 헤딩 계산 (이전 위치와 현재 위치로부터)
    if (this.lastLngLat && calculateDistance(this.lastLngLat, gpsPosition) > 0.1) {
      const bearing = calculateBearing(this.lastLngLat, gpsPosition);
      this.state.heading = bearing;

      // 메시 회전
      if (this.mesh) {
        // Three.js: Z축이 북쪽이므로 90도 조정
        this.mesh.rotation.y = -bearing; // 반시계 방향 (좌표계 변환)
      }
    }

    this.lastLngLat = [...gpsPosition];

    // 애니메이션 상태 업데이트
    this.updateAnimationState();

    // 애니메이션 믹서 업데이트
    if (this.model && this.model.mixer) {
      this.model.mixer.update(deltaTime);
    }
  }

  /**
   * 애니메이션 상태 전환
   */
  private updateAnimationState(): void {
    let newState: 'idle' | 'walk' | 'run' = 'idle';

    if (this.state.velocity > ANIMATION_THRESHOLDS.walkToRunVelocity) {
      newState = 'run';
    } else if (this.state.velocity > ANIMATION_THRESHOLDS.walkStartVelocity) {
      newState = 'walk';
    } else {
      newState = 'idle';
    }

    // 상태 변경 필요
    if (newState !== this.state.animationState) {
      this.transitionAnimationState(newState);
      this.state.animationState = newState;
    }
  }

  /**
   * 애니메이션 상태 전환 (블렌딩)
   */
  private transitionAnimationState(newState: 'idle' | 'walk' | 'run'): void {
    if (!this.model) return;

    const { actions } = this.model;
    const fromAction = actions[this.state.animationState as keyof typeof actions];
    const toAction = actions[newState];

    if (fromAction && toAction) {
      fromAction.fadeOut(0.3);
      toAction.reset().fadeIn(0.3).play();
    }
  }

  /**
   * 목표 위치 설정
   */
  setTarget(target: THREE.Vector3): void {
    this.targetWorldPos = target.clone();
  }

  /**
   * 상태 수정
   */
  setState(state: Partial<PlayerState>): void {
    this.state = { ...this.state, ...state };
  }

  /**
   * 상태 반환
   */
  getState(): PlayerState {
    return { ...this.state };
  }

  /**
   * 메시 반환
   */
  getMesh(): THREE.Group | null {
    return this.mesh;
  }

  /**
   * 현재 위치 반환 (World)
   */
  getWorldPosition(): THREE.Vector3 {
    return this.state.worldPosition.clone();
  }

  /**
   * 현재 위치 반환 (LngLat)
   */
  getLngLat(): LngLat {
    return [...this.state.position];
  }

  /**
   * 현재 헤딩 반환
   */
  getHeading(): number {
    return this.state.heading;
  }

  /**
   * 헤딩 설정 (라디안)
   */
  setHeading(heading: number): void {
    this.state.heading = heading;
  }

  /**
   * 정리
   */
  dispose(): void {
    if (this.model) {
      this.model.mixer.stopAllAction();
    }

    if (this.mesh) {
      this.mesh.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(mat => mat.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    }

    this.model = null;
    this.mesh = null;
  }
}
