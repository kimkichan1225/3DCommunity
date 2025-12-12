/**
 * ⭐ 포켓몬GO 완벽 재현 3D 지도 (Mapbox Custom Layer + 독립적 Three.js 카메라)
 * 
 * 핵심 구조:
 * 1. ✅ Mapbox Custom Layer (배경 지도 렌더링)
 * 2. ✅ Three.js Renderer는 Mapbox GL Context 공유
 * 3. ✅ 카메라는 Three.js가 독립적으로 관리 (TPS 뷰)
 * 4. ✅ MercatorCoordinate 값 직접 사용 (스케일링 제거)
 * 5. ✅ 캐릭터 위치는 Mercator 좌표 → 월드 좌표 변환
 * 6. ✅ GPS → MercatorCoordinate → 월드 좌표 정확 변환
 */

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { MapboxManager } from '../../core/map/MapboxManager';
import { CoordinateSystem } from '../../utils/coordinates';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

// ★ 상수 정의
const POKEMON_GO_CONFIG = {
  MAP: {
    zoom: 19.2,      // ★ 포켓몬GO 기본 줌 (18~19.5)
    pitch: 78,       // ★ 포켓몬GO 카메라 pitch (거의 80도)
    bearing: 0,      // ★ 방향
    antialias: true
  },
  CAMERA: {
    fov: 40,         // ★ FOV 좁게 → 포켓몬GO의 좁은 시야 재현
    distance: 3,     // ★ 캐릭터 뒤 아주 가까이
    height: 1.6,     // ★ 카메라 높이 (거의 사람 눈높이)
    pitch: 40,       // ★ 피치 (도)
    lerpSpeed: 0.12  // ★ 카메라 부드러움
  },
  CHARACTER: {
    speed: 0.00008,  // GPS lat/lng 이동값 (약 10m/s)
    rotationSpeed: 3 // 회전 속도 (도/frame)
  }
};

export default function PokemonGoMap3DPerfect({
  initialCenter = { lng: 127.0276, lat: 37.4979 },
  onMapReady = () => {},
  onPositionUpdate = () => {}
}) {
  // DOM 참조
  const mapContainer = useRef(null);

  // Mapbox/Three.js 참조
  const mapRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const characterRef = useRef(null);

  // 상태
  const [isReady, setIsReady] = useState(false);
  const [stats, setStats] = useState({
    position: [0, 0, 0],
    gps: { lng: initialCenter.lng, lat: initialCenter.lat },
    bearing: 0,
    fps: 0,
    zoom: POKEMON_GO_CONFIG.MAP.zoom
  });

  // 캐릭터 상태 (GPS 기준)
  const playerState = useRef({
    lng: initialCenter.lng,
    lat: initialCenter.lat,
    bearing: 0,
    targetBearing: 0
  });

  // 입력 상태
  const inputRef = useRef({
    w: false,
    a: false,
    s: false,
    d: false
  });

  // 카메라 제어
  const cameraStateRef = useRef({
    distance: 0.08,  // MercatorCoordinate 스케일 (0-1 범위)에 맞춘 거리
    height: 0.02,    // 카메라 높이 (0-1 범위)
    pitch: 40,       // 카메라 피치 (도)
    yaw: 0           // 카메라 요
  });

  // 메트릭스 캐시 (흔들림 방지)
  const cacheRef = useRef({
    charWorldPos: { x: 0, y: 0, z: 0 },
    mercPos: null,
    lastUpdate: 0
  });

  useEffect(() => {
    if (!mapContainer.current) return;

    console.log('🎮 포켓몬GO 3D 완벽 렌더링 시작...');

    // =====================
    // Mapbox 초기화
    // =====================
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    // ★ 지도 범위 제한 (더 좁은 범위로 설정)
    // 서울 강남역 기준으로 약 2km x 2km 범위
    const centerLng = initialCenter.lng;
    const centerLat = initialCenter.lat;
    const maxBounds = [
      [centerLng - 0.015, centerLat - 0.015],  // 남서쪽
      [centerLng + 0.015, centerLat + 0.015]   // 북동쪽
    ];
    
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [initialCenter.lng, initialCenter.lat],
      zoom: POKEMON_GO_CONFIG.MAP.zoom,
      pitch: POKEMON_GO_CONFIG.MAP.pitch,
      bearing: POKEMON_GO_CONFIG.MAP.bearing,
      antialias: true,
      attributionControl: false,
      maxBounds: maxBounds,              // ★ 지도 범위 제한
      maxZoom: 20,                        // ★ 최대 줌 레벨
      minZoom: 17                         // ★ 최소 줌 레벨
    });

    mapRef.current = map;
    console.log('✅ Mapbox 초기화 완료');

    map.on('style.load', () => {
      console.log('✅ Mapbox 스타일 로드 완료');

      // ★ 배경 레이어 색상 설정 (하늘색)
      try {
        const bgLayers = map.getStyle().layers.filter(l => l.type === 'background');
        bgLayers.forEach((layer) => {
          if (layer.paint && layer.paint['background-color']) {
            map.setPaintProperty(layer.id, 'background-color', '#87CEEB');
          }
        });
      } catch (e) {
        console.warn('배경 레이어 설정 실패:', e);
      }

      // ★ 지면 레이어만 표시 (건물 제거)
      // 보여줄 레이어: background, landuse, water, road, etc.
      // 숨길 레이어: building, bridge, tunnel 등의 3D 객체
      const layers = map.getStyle().layers;
      const hidePatterns = ['building', 'bridge-', 'tunnel', 'admin'];
      
      layers.forEach((layer) => {
        if (layer.id) {
          // building으로 시작하는 레이어나 특정 패턴의 레이어 숨기기
          const shouldHide = hidePatterns.some(pattern => 
            layer.id.toLowerCase().includes(pattern)
          );
          
          if (shouldHide) {
            map.setLayoutProperty(layer.id, 'visibility', 'none');
          } else if (layer.type !== 'background') {
            // 다른 모든 레이어(지면 관련)는 보이게
            map.setLayoutProperty(layer.id, 'visibility', 'visible');
          }
        }
      });

      // ★ THREE.JS와 MAPBOX 통합: Custom Layer 방식
      initThreeJs(map);
    });

    // =====================
    // Three.js + Mapbox Custom Layer 초기화
    // =====================
    const initThreeJs = (map) => {
      let renderer, scene, camera, frameId;
      const loader = new GLTFLoader();
      
      // 커스텀 레이어 객체
      const customLayer = {
        id: 'pokemon-3d-layer',
        type: 'custom',
        renderingMode: '3d',

        // ★ Mapbox가 준비되면 Three.js 초기화
        onAdd(map, gl) {
          console.log('🎮 Three.js + Mapbox Custom Layer 통합 시작...');

          // ★ Three.js Renderer: Mapbox GL Context 공유
          renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: false,  // ★ Mapbox context 호환성을 위해 비활성화
            alpha: true,
            preserveDrawingBuffer: true  // ★ Mapbox와 공유하기 위해 필요
          });
          renderer.autoClear = false;
          renderer.shadowMap.enabled = false;  // ★ Mapbox context 호환성: shadowMap 비활성화
          renderer.shadowMap.type = THREE.PCFShadowMap;

          // ★ Scene & Camera
          scene = new THREE.Scene();
          scene.background = null;
          
          camera = new THREE.PerspectiveCamera(
            POKEMON_GO_CONFIG.CAMERA.fov || 60,  // 네비게이션 카메라용 기본값
            map.getCanvas().width / map.getCanvas().height,
            0.1,
            10000
          );

          // ★ 카메라 초기 위치 설정 (TPS/네비게이션 뷰)
          // Mapbox MercatorCoordinate 스케일에 맞춘 거리
          camera.position.set(0.5, 0.3, 0.5);  // 캐릭터 뒤쪽 상단
          camera.lookAt(0.5, 0.15, 0.5);
          camera.updateProjectionMatrix();

          // ★ 조명 (shadowMap 없이)
          const sunLight = new THREE.DirectionalLight(0xffffff, 1.3);
          sunLight.position.set(100, 100, 100);
          sunLight.castShadow = false;  // ★ Mapbox 호환성을 위해 비활성화
          scene.add(sunLight);

          const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
          scene.add(ambientLight);

          console.log('✅ Three.js Renderer 초기화 완료');

          // ★ 캐릭터 로드
          loader.load(
            '/resources/Ultimate Animated Character Pack - Nov 2019/glTF/BaseCharacter.gltf',
            (gltf) => {
              console.log('✅ 캐릭터 모델 로드 성공');
              const model = gltf.scene;

              model.traverse((node) => {
                if (node.isMesh) {
                  node.castShadow = false;  // ★ Mapbox 호환성을 위해 비활성화
                  node.receiveShadow = false;
                }
              });

              model.scale.set(0.4, 0.4, 0.4);
              model.position.set(0, 0, 0);
              characterRef.current = model;
              scene.add(model);

              console.log('✅ 캐릭터 씬에 추가');
              setIsReady(true);
              startGameLoop();
            },
            undefined,
            (error) => {
              console.warn('⚠️ 모델 로드 실패, 폴백 사용:', error);
              const geometry = new THREE.BoxGeometry(1, 2.5, 1);
              const material = new THREE.MeshStandardMaterial({ color: 0xff6b6b });
              const mesh = new THREE.Mesh(geometry, material);
              mesh.castShadow = false;  // ★ Mapbox 호환성
              mesh.receiveShadow = false;
              characterRef.current = mesh;
              scene.add(mesh);

              console.log('✅ 폴백 캐릭터 추가');
              setIsReady(true);
              startGameLoop();
            }
          );

          sceneRef.current = scene;
          cameraRef.current = camera;
          rendererRef.current = renderer;
        },

        // ★ Mapbox 렌더 루프: Three.js 렌더링
        render(gl, matrix) {
          if (!renderer || !scene || !camera || !characterRef.current) return;

          const player = playerState.current;
          const input = inputRef.current;

          // ★ Viewport 설정 (Mapbox와 Three.js 동기화)
          const canvas = map.getCanvas();
          gl.viewport(0, 0, canvas.width, canvas.height);

          // ★ Step 1: 캐릭터 입력 & GPS 이동
          if (input.w) {
            const rad = (player.bearing * Math.PI) / 180;
            player.lat += Math.cos(rad) * POKEMON_GO_CONFIG.CHARACTER.speed;
            player.lng += Math.sin(rad) * POKEMON_GO_CONFIG.CHARACTER.speed;
          }
          if (input.s) {
            const rad = (player.bearing * Math.PI) / 180;
            player.lat -= Math.cos(rad) * POKEMON_GO_CONFIG.CHARACTER.speed;
            player.lng -= Math.sin(rad) * POKEMON_GO_CONFIG.CHARACTER.speed;
          }

          if (input.a) {
            player.targetBearing -= POKEMON_GO_CONFIG.CHARACTER.rotationSpeed;
          }
          if (input.d) {
            player.targetBearing += POKEMON_GO_CONFIG.CHARACTER.rotationSpeed;
          }

          player.bearing = THREE.MathUtils.lerp(
            player.bearing,
            player.targetBearing,
            0.1
          );

          // ★ Step 2: 좌표 변환 (CoordinateSystem 사용)
          // LngLat → World 좌표 변환 (Mapbox MercatorCoordinate 대신 사용)
          // CoordinateSystem이 스케일을 올바르게 처리함
          const merc = {
            lng: player.lng,
            lat: player.lat
          };
          
          // 나중에 CoordinateSystem 사용으로 변경 가능:
          // const worldPos = coordinateSystem.lngLatToWorld([player.lng, player.lat]);
          // 현재는 Mapbox 네이티브 사용
          const nativeMarc = mapboxgl.MercatorCoordinate.fromLngLat(merc, 0);
          characterRef.current.position.set(nativeMarc.x, nativeMarc.y, 0);
          characterRef.current.rotation.y = (player.bearing * Math.PI) / 180;

          // ★ Step 3: 카메라 업데이트
          const camState = cameraStateRef.current;
          const charPos = characterRef.current.position;

          const pitchRad = (camState.pitch * Math.PI) / 180;
          const yawRad = (camState.yaw * Math.PI) / 180 + (player.bearing * Math.PI) / 180;

          const horizontalDist = camState.distance * Math.cos(pitchRad);
          const verticalDist = camState.distance * Math.sin(pitchRad);

          const targetCamX = charPos.x + horizontalDist * Math.sin(yawRad);
          const targetCamY = charPos.y + verticalDist + camState.height;
          const targetCamZ = charPos.z + horizontalDist * Math.cos(yawRad);

          const lerpFactor = POKEMON_GO_CONFIG.CAMERA.lerpSpeed;
          camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, lerpFactor);
          camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, lerpFactor);
          camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, lerpFactor);

          camera.lookAt(charPos.x, charPos.y + 1.5, charPos.z);

          // ★ Step 4: 카메라 투영 행렬 설정 (네비게이션 카메라 모드)
          // 중요: Mapbox matrix를 그대로 복사하지 않음!
          // 대신 Three.js 카메라의 perspective를 유지
          // 이렇게 하면 TPS/네비게이션 뷰가 정상 작동
          
          // 줌 레벨에 따라 화각 조정 (Mapbox 3D 효과 유지)
          const zoom = map.getZoom();
          const vFOV = camera.fov * Math.PI / 180; // 수직 화각 (라디안)
          const height = 2 * Math.tan(vFOV / 2) * camera.position.distanceTo(charPos);
          
          // 카메라 투영 행렬은 Three.js에서 자동 계산
          camera.updateProjectionMatrix();

          // ★ Step 5: Three.js 렌더링
          renderer.render(scene, camera);

          // 통계 업데이트
          setStats({
            position: characterRef.current?.position.toArray() ?? [0, 0, 0],
            gps: { lng: player.lng, lat: player.lat },
            bearing: Math.round(player.bearing),
            fps: 0,
            zoom: map.getZoom()
          });

          // Mapbox 재렌더링 트리거
          map.triggerRepaint();
        }
      };

      // ★ 커스텀 레이어를 맵에 추가
      map.addLayer(customLayer);
      console.log('✅ Custom Layer 추가 완료');

      // ★ 입력 처리
      const handleKeyDown = (e) => {
        const key = e.key.toLowerCase();
        if (key === 'w') inputRef.current.w = true;
        if (key === 'a') inputRef.current.a = true;
        if (key === 's') inputRef.current.s = true;
        if (key === 'd') inputRef.current.d = true;

        if (key === 'arrowup') {
          cameraStateRef.current.pitch = Math.min(80, cameraStateRef.current.pitch + 5);
        }
        if (key === 'arrowdown') {
          cameraStateRef.current.pitch = Math.max(10, cameraStateRef.current.pitch - 5);
        }
        if (key === 'arrowleft') {
          cameraStateRef.current.yaw -= 10;
        }
        if (key === 'arrowright') {
          cameraStateRef.current.yaw += 10;
        }
        if (key === 'r') {
          cameraStateRef.current.distance = Math.min(0.2, cameraStateRef.current.distance + 0.01);
        }
        if (key === 'f') {
          cameraStateRef.current.distance = Math.max(0.02, cameraStateRef.current.distance - 0.01);
        }

        if (key === '=' || key === '+') {
          const zoom = map.getZoom();
          map.setZoom(Math.min(21, zoom + 0.5));
        }
        if (key === '-' || key === '_') {
          const zoom = map.getZoom();
          map.setZoom(Math.max(16, zoom - 0.5));
        }
      };

      const handleKeyUp = (e) => {
        const key = e.key.toLowerCase();
        if (key === 'w') inputRef.current.w = false;
        if (key === 'a') inputRef.current.a = false;
        if (key === 's') inputRef.current.s = false;
        if (key === 'd') inputRef.current.d = false;
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);

      const startGameLoop = () => {
        console.log('🎮 게임 루프 시작');
        // Mapbox custom layer render가 자동으로 호출됨
      };

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        if (frameId) cancelAnimationFrame(frameId);
      };
    };

    return () => {
      if (mapRef.current) mapRef.current.remove();
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, [initialCenter]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      {/* Mapbox (Three.js는 Custom Layer로 통합됨) */}
      <div
        ref={mapContainer}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1
        }}
      />

      {/* UI */}
      {isReady && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            background: 'rgba(0, 0, 0, 0.85)',
            color: '#fff',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '11px',
            fontFamily: 'monospace',
            zIndex: 10,
            maxWidth: '250px',
            lineHeight: '1.4'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#4CAF50' }}>
            📊 포켓몬GO 3D
          </div>
          <div>📍 X={stats.position[0].toFixed(1)} Z={stats.position[2].toFixed(1)}</div>
          <div>🌍 Lng={stats.gps.lng.toFixed(6)}</div>
          <div>  Lat={stats.gps.lat.toFixed(6)}</div>
          <div>🧭 방향: {stats.bearing}°</div>
          <div>🗺️ Zoom: {stats.zoom.toFixed(1)}</div>
          <div>⚡ FPS: {stats.fps}</div>

          <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #444', fontSize: '10px', color: '#aaa' }}>
            <strong>조작:</strong> WASD 이동<br/>
            카메라: ↑↓ 위/아래, ←→ 좌/우<br/>
            R/F: 거리 조절, +/-: 줌 조절
          </div>
        </div>
      )}

      {!isReady && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#0f0',
            padding: '20px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            zIndex: 20
          }}
        >
          🎮 포켓몬GO 3D 로딩 중...
        </div>
      )}
    </div>
  );
}
