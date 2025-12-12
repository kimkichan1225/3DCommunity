// src/core/three/ThreeManager.ts

import * as THREE from 'three';
import type { RenderConfig, IThreeManager } from '../../types';
import { LIGHTING_CONFIG } from '../../utils/config';

/**
 * Three.js 렌더러 및 씬 관리자
 */
export class ThreeManager implements IThreeManager {
  private scene: THREE.Scene | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private container: HTMLElement | null = null;
  private config: RenderConfig;

  // 성능 모니터링
  private stats: {
    fps: number;
    frameCount: number;
    lastTime: number;
  } = {
    fps: 0,
    frameCount: 0,
    lastTime: performance.now()
  };

  constructor(config: RenderConfig) {
    this.config = config;
  }

  /**
   * Three.js 초기화
   */
  initialize(container: HTMLElement, config?: Partial<RenderConfig>): void {
    this.container = container;

    // 설정 병합
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // 씬 생성
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // 하늘색
    this.scene.fog = new THREE.Fog(
      LIGHTING_CONFIG.fog.color,
      LIGHTING_CONFIG.fog.near,
      LIGHTING_CONFIG.fog.far
    );

    // 렌더러 생성
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.config.antialias,
      alpha: true,
      powerPreference: 'high-performance'
    });

    this.renderer.setPixelRatio(this.config.pixelRatio);
    this.renderer.setSize(
      container.clientWidth,
      container.clientHeight
    );
    this.renderer.shadowMap.enabled = this.config.shadowMap;

    if (this.config.shadowMap) {
      this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;
      this.renderer.shadowMap.autoUpdate = true;
    }

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.config.exposureTone;

    container.appendChild(this.renderer.domElement);

    // 카메라 생성
    const width = container.clientWidth;
    const height = container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(
      70, // FOV
      width / height,
      0.1,
      5000
    );
    this.camera.position.set(0, 5, 5);

    // 라이팅 설정
    this.setupLighting();

    // 바닥 생성
    this.createGround();

    // 윈도우 리사이징 처리
    window.addEventListener('resize', () => this.onWindowResize());

    console.log('✅ Three.js 초기화 완료');
  }

  /**
   * 라이팅 설정
   */
  private setupLighting(): void {
    if (!this.scene) return;

    // Ambient Light
    const ambientLight = new THREE.AmbientLight(
      LIGHTING_CONFIG.ambient.color,
      LIGHTING_CONFIG.ambient.intensity
    );
    this.scene.add(ambientLight);

    // Directional Light (태양)
    const dirLight = new THREE.DirectionalLight(
      LIGHTING_CONFIG.directional.color,
      LIGHTING_CONFIG.directional.intensity
    );
    dirLight.position.set(
      LIGHTING_CONFIG.directional.position[0],
      LIGHTING_CONFIG.directional.position[1],
      LIGHTING_CONFIG.directional.position[2]
    );

    if (this.config.shadowMap) {
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = this.config.shadowMapSize;
      dirLight.shadow.mapSize.height = this.config.shadowMapSize;
      dirLight.shadow.camera.left = -LIGHTING_CONFIG.directional.shadowSize;
      dirLight.shadow.camera.right = LIGHTING_CONFIG.directional.shadowSize;
      dirLight.shadow.camera.top = LIGHTING_CONFIG.directional.shadowSize;
      dirLight.shadow.camera.bottom = -LIGHTING_CONFIG.directional.shadowSize;
      dirLight.shadow.camera.near = LIGHTING_CONFIG.directional.shadowNear;
      dirLight.shadow.camera.far = LIGHTING_CONFIG.directional.shadowFar;
    }

    this.scene.add(dirLight);
  }

  /**
   * 바닥(Ground) 생성
   */
  private createGround(): void {
    if (!this.scene) return;

    // 바닥 기하학
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    
    // 바닥 재질 (녹색 잔디 느낌)
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d5016,
      roughness: 0.9,
      metalness: 0.0
    });

    // 바닥 메시
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    
    // 바닥을 Y=0에 배치하고 회전 (수평)
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = 0;
    
    // 그림자 설정
    groundMesh.receiveShadow = true;
    groundMesh.castShadow = false;

    // 씬에 추가
    this.scene.add(groundMesh);

    // 바닥 격자 생성 (선택사항 - 시각적 가이드)
    const gridHelper = new THREE.GridHelper(1000, 100, 0x4a7c3c, 0x3d5a2a);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);

    console.log('✅ 바닥 생성 완료');
  }

  /**
   * 씬 반환
   */
  getScene(): THREE.Scene {
    if (!this.scene) throw new Error('Scene이 초기화되지 않았습니다.');
    return this.scene;
  }

  /**
   * 렌더러 반환
   */
  getRenderer(): THREE.WebGLRenderer {
    if (!this.renderer) throw new Error('Renderer가 초기화되지 않았습니다.');
    return this.renderer;
  }

  /**
   * 카메라 반환
   */
  getCamera(): THREE.PerspectiveCamera {
    if (!this.camera) throw new Error('Camera가 초기화되지 않았습니다.');
    return this.camera;
  }

  /**
   * 렌더링
   */
  render(): void {
    if (!this.renderer || !this.scene || !this.camera) return;

    this.renderer.render(this.scene, this.camera);
    this.updateStats();
  }

  /**
   * 성능 통계 업데이트
   */
  private updateStats(): void {
    const now = performance.now();
    const deltaTime = now - this.stats.lastTime;

    this.stats.frameCount++;

    if (deltaTime >= 1000) {
      this.stats.fps = Math.round(this.stats.frameCount * 1000 / deltaTime);
      this.stats.frameCount = 0;
      this.stats.lastTime = now;

      // 성능 경고
      if (this.stats.fps < 30) {
        console.warn(`⚠️ 낮은 FPS: ${this.stats.fps}`);
      }
    }
  }

  /**
   * FPS 반환
   */
  getFPS(): number {
    return this.stats.fps;
  }

  /**
   * 윈도우 리사이징 처리
   */
  private onWindowResize(): void {
    if (!this.container || !this.renderer || !this.camera) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  /**
   * 정리
   */
  dispose(): void {
    if (this.renderer) {
      this.renderer.dispose();
    }

    if (this.scene) {
      this.scene.traverse((obj) => {
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

    if (this.container && this.renderer) {
      this.container.removeChild(this.renderer.domElement);
    }

    window.removeEventListener('resize', () => this.onWindowResize());

    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.container = null;
  }
}
