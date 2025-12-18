import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import mapboxgl from 'mapbox-gl';
import { MapboxManager } from '../core/map/MapboxManager';
import { useKeyboardControls } from '../useKeyboardControls';
import '../pages/MapGamePageNew.css';

/**
 * 새로운 지도 게임 페이지
 * 좌측: Three.js 3D 캐릭터 (Level1과 동일한 이동 로직)
 * 우측: Mapbox 지도 (GPS 위치)
 */
function MapGamePageNew() {
  const navigate = useNavigate();
  const mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN;
  const mapContainerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // 캐릭터 상태 공유
  const characterStateRef = useRef({
    position: [0, 0, 0],
    rotation: 0,
    isMoving: false
  });

  // Mapbox 참조
  const mapboxManagerRef = useRef(null);

  // GPS 위치 요청
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([longitude, latitude]);
          console.log('📍 GPS 위치:', { latitude, longitude });
        },
        (error) => {
          console.warn('⚠️ GPS 접근 실패:', error.message);
          setLocationError(error.message);
          // 기본값으로 설정
          setUserLocation([127.0276, 37.4979]);
        }
      );
    } else {
      setLocationError('Geolocation을 지원하지 않습니다');
      setUserLocation([127.0276, 37.4979]);
    }
  }, []);

  // Mapbox 초기화
  useEffect(() => {
    const initializeMap = async () => {
      try {
        if (!mapContainerRef.current) {
          throw new Error('Map container not found');
        }

        console.log('🗺️ 지도 초기화 시작...');

        const mapCenter = userLocation || [127.0276, 37.4979];

        // Mapbox 초기화
        const mapboxManager = new MapboxManager({
          accessToken: mapboxToken,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: mapCenter,
          zoom: 20.2,
          pitch: 60,
          bearing: 0
        });

        // Promise 기반으로 초기화 완료 대기
        await mapboxManager.initialize(mapContainerRef.current);
        mapboxManagerRef.current = mapboxManager;

        const map = mapboxManager.getMap();

        // 3D 레이어 추가 함수
        const add3DLayers = () => {
          console.log('🏗️ 3D 레이어 추가 시작...');
          
          // 3D 건물 추가
          const layers = map.getStyle().layers;
          const labelLayerId = layers.find(
            (layer) => layer.type === 'symbol' && layer.layout['text-field']
          )?.id;

          // 이미 레이어가 있으면 추가하지 않음
          if (!map.getLayer('3d-buildings')) {
            map.addLayer(
              {
                id: '3d-buildings',
                source: 'composite',
                'source-layer': 'building',
                filter: ['==', 'extrude', 'true'],
                type: 'fill-extrusion',
                minzoom: 15,
                paint: {
                  'fill-extrusion-color': '#aaa',
                  'fill-extrusion-height': [
                    'interpolate', ['linear'], ['zoom'],
                    15, 0,
                    15.05, ['get', 'height']
                  ],
                  'fill-extrusion-base': [
                    'interpolate', ['linear'], ['zoom'],
                    15, 0,
                    15.05, ['get', 'min_height']
                  ],
                  'fill-extrusion-opacity': 0.6
                }
              },
              labelLayerId
            );
            console.log('✅ 3D 건물 레이어 추가 완료');
          }

          // 캐릭터 마커 생성 (Three.js CustomLayer 대신 SVG/CSS 마커 사용)
          if (!window.characterMarker) {
            const markerElement = document.createElement('div');
            markerElement.className = 'character-marker-3d';
            markerElement.innerHTML = `
              <div style="
                width: 60px;
                height: 80px;
                display: flex;
                flex-direction: column;
                align-items: center;
                transform: translateY(-40px);
              ">
                <div style="
                  width: 50px;
                  height: 50px;
                  background: linear-gradient(180deg, #4a90d9 0%, #357abd 100%);
                  border-radius: 50%;
                  border: 3px solid #fff;
                  box-shadow: 0 4px 15px rgba(0,0,0,0.4), 0 0 20px rgba(74,144,217,0.5);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 24px;
                ">
                  🧑
                </div>
                <div style="
                  width: 0;
                  height: 0;
                  border-left: 10px solid transparent;
                  border-right: 10px solid transparent;
                  border-top: 15px solid #357abd;
                  margin-top: -2px;
                "></div>
                <div style="
                  width: 30px;
                  height: 8px;
                  background: radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%);
                  border-radius: 50%;
                  margin-top: 5px;
                "></div>
              </div>
            `;

            window.characterMarker = new mapboxgl.Marker({
              element: markerElement,
              anchor: 'bottom'
            })
              .setLngLat(mapCenter)
              .addTo(map);
            
            console.log('✅ 캐릭터 마커 생성 완료');
          }
        };

        // 지도가 이미 로드되었으면 바로 실행, 아니면 load 이벤트 대기
        if (map.loaded()) {
          add3DLayers();
        } else {
          map.on('load', add3DLayers);
        }

        console.log('✅ Mapbox 초기화 완료');
        setIsReady(true);
      } catch (err) {
        console.error('❌ 지도 초기화 실패:', err);
        setError(err.message || '지도를 초기화할 수 없습니다');
      }
    };

    if (mapboxToken && userLocation) {
      initializeMap();
    }

    return () => {
      if (mapboxManagerRef.current) {
        mapboxManagerRef.current.dispose();
      }
    };
  }, [mapboxToken, userLocation]);

  // 3D 캐릭터가 지도에 표시되므로 마커는 더 이상 필요 없음
  // 지도 중심 이동용으로만 사용
  useEffect(() => {
    if (!mapboxManagerRef.current || !isReady) return;

    // cleanup
    return () => {
      if (window.mapCharacter) {
        window.mapCharacter = null;
        window.mapMixer = null;
        window.mapActions = null;
      }
    };
  }, [isReady, userLocation]);

  const handleBack = () => {
    navigate(-1);
  };

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100vh',
        background: '#1a1a1a',
        color: '#ff6b6b',
        fontFamily: 'monospace',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div>⚠️ 오류</div>
        <div style={{ fontSize: '12px', color: '#aaa' }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="map-game-split-container">
      {/* 좌측: Three.js 캐릭터 */}
      <div className="map-game-left">
        <Canvas
          camera={{
            position: [0, 38, 45],
            fov: 60,
            near: 0.1,
            far: 10000
          }}
          style={{ width: '100%', height: '100%' }}
          gl={{ antialias: true, alpha: false }}
          onCreated={(state) => {
            state.gl.setClearColor(0x87CEEB, 1); // 하늘색 배경
          }}
        >
          <ambientLight intensity={0.8} />
          <directionalLight
            position={[5, 5, 5]}
            intensity={1.2}
            castShadow
          />
          
          {/* 가상 풀숲 바닥 */}
          <VirtualGrassGround />

          {/* 캐릭터 */}
          <CharacterViewer characterStateRef={characterStateRef} />
          
          {/* 카메라 제어 */}
          <CameraTracker characterStateRef={characterStateRef} />
          
          {/* 지도 마커 업데이트 (실시간) */}
          <MarkerUpdater characterStateRef={characterStateRef} mapboxManagerRef={mapboxManagerRef} userLocation={userLocation} isReady={isReady} />
        </Canvas>
        
        {!isReady && (
          <div className="map-game-loading-overlay">
            🎮 로딩 중...
          </div>
        )}
      </div>

      {/* 우측: Mapbox 지도 */}
      <div className="map-game-right">
        <div
          ref={mapContainerRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
        />
        
        {!isReady && (
          <div className="map-game-loading-overlay">
            🗺️ 지도 로딩 중...
          </div>
        )}
      </div>

      {/* 하단 통합 UI 바 */}
      {isReady && (
        <div className="map-game-bottom-bar">
          {/* 좌측: 뒤로가기 */}
          <div className="bottom-bar-left">
            <button className="map-game-back-button" onClick={handleBack}>
              ← 뒤로가기
            </button>
          </div>

          {/* 중앙: 방 생성/입장 버튼 */}
          <div className="bottom-bar-center">
            <button className="room-button room-create-button">
              🏠 방 생성
            </button>
            <button className="room-button room-join-button">
              📍 방 입장
            </button>
          </div>

          {/* 우측: 액션 버튼들 */}
          <div className="bottom-bar-right">
            <button className="bottom-bar-button" title="채팅">
              💬
            </button>
            <button className="bottom-bar-button" title="설정">
              ⚙️
            </button>
            <button className="bottom-bar-button" title="메뉴">
              ☰
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 캐릭터 뷰어 컴포넌트
 * MapCharacterController와 동일한 이동 로직 사용
 */
function CharacterViewer({ characterStateRef }) {
  const characterRef = useRef(null);
  const groupRef = useRef(null);
  const modelGroupRef = useRef(null);
  const [currentAnimation, setCurrentAnimation] = useState('Idle');
  const currentRotationRef = useRef(new THREE.Quaternion());
  const lastRotationYRef = useRef(0);
  
  // MapCharacterController와 동일하게 useKeyboardControls 사용
  const { forward, backward, left, right, shift } = useKeyboardControls();
  
  // GLTF 로드
  const { scene, animations } = useGLTF('/resources/Ultimate Animated Character Pack - Nov 2019/glTF/BaseCharacter.gltf');
  const { actions } = useAnimations(animations, characterRef);

  // 애니메이션 상태 관리
  useEffect(() => {
    let animToPlay = 'Idle';
    if (forward || backward || left || right) {
      animToPlay = shift ? 'Run' : 'Walk';
    } else {
      animToPlay = 'Idle';
    }

    if (currentAnimation !== animToPlay && actions) {
      const oldAction = actions[currentAnimation];
      const newAction = actions[animToPlay];

      if (oldAction) oldAction.fadeOut(0.5);
      if (newAction) {
        newAction.reset().fadeIn(0.5).play();
      }

      setCurrentAnimation(animToPlay);
    }
  }, [forward, backward, left, right, shift, actions, currentAnimation]);

  // 모델 초기화
  useEffect(() => {
    if (characterRef.current) {
      characterRef.current.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }

    if (modelGroupRef.current) {
      characterRef.current = modelGroupRef.current;
      console.log('📍 MapCharacterController 초기화 완료 - 캐릭터 참조 설정');
    }
  }, []);

  // 프레임 업데이트 - MapCharacterController와 동일한 로직
  useFrame((state, delta) => {
    if (!modelGroupRef.current) {
      return;
    }

    const speed = shift ? 20 : 10; // 물리 기반 속도 (걷기: 10, 뛰기: 20)
    const direction = new THREE.Vector3();

    if (forward) direction.z -= 1;
    if (backward) direction.z += 1;
    if (left) direction.x -= 1;
    if (right) direction.x += 1;

    const isMoving = direction.length() > 0;
    let targetAngleForNetwork = null;

    if (direction.length() > 0) {
      direction.normalize(); // 정규화 - MapCharacterController와 동일

      // 회전 처리 - slerp를 사용한 부드러운 회전
      const targetAngle = Math.atan2(direction.x, direction.z);
      targetAngleForNetwork = targetAngle;

      const targetQuaternion = new THREE.Quaternion();
      targetQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngle);
      currentRotationRef.current.slerp(targetQuaternion, 0.25);

      // 위치 업데이트 (delta 기반)
      modelGroupRef.current.position.x += direction.x * speed * delta;
      modelGroupRef.current.position.z += direction.z * speed * delta;

      lastRotationYRef.current = targetAngle;
    }

    // 모델 회전 적용
    modelGroupRef.current.quaternion.copy(currentRotationRef.current);

    // 상태 공유 (isMoving 포함)
    characterStateRef.current.position = [
      modelGroupRef.current.position.x,
      modelGroupRef.current.position.y,
      modelGroupRef.current.position.z
    ];
    characterStateRef.current.rotation = lastRotationYRef.current;
    characterStateRef.current.isMoving = isMoving;
  });

  return (
    <group ref={modelGroupRef} position={[0, 0, 0]}>
      <primitive
        ref={characterRef}
        object={scene}
        scale={2.5}
        position={[0, 0, 0]}
      />
    </group>
  );
}

export default MapGamePageNew;

/**
 * 카메라 추적 컴포넌트
 * CameraController와 동일한 로직으로 캐릭터를 따라감
 */
function CameraTracker({ characterStateRef }) {
  const { camera } = useThree();
  const cameraOffset = new THREE.Vector3(0, 38, 45); // 각도를 낮춘 카메라 오프셋
  const targetPositionRef = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    if (!characterStateRef.current) return;

    // 캐릭터 위치 가져오기
    const [charX, charY, charZ] = characterStateRef.current.position;
    const characterPosition = new THREE.Vector3(charX, charY, charZ);

    // 타겟 위치를 부드럽게 보간 (떨림 방지)
    targetPositionRef.current.lerp(characterPosition, delta * 10.0);

    // 타겟 위치에 고정된 오프셋을 더해서 카메라 위치 계산
    const targetCameraPosition = targetPositionRef.current.clone().add(cameraOffset);

    // 부드러운 카메라 이동 (속도 감소)
    camera.position.lerp(targetCameraPosition, delta * 3.0);

    // 캐릭터를 바라보도록 설정
    camera.lookAt(targetPositionRef.current);
  });

  return null;
}

/**
 * 지도 마커 업데이트 컴포넌트
 * useFrame으로 실시간 마커 위치 업데이트 (WASD 입력과 동기화)
 */
function MarkerUpdater({ characterStateRef, mapboxManagerRef, userLocation, isReady }) {
  useFrame(() => {
    if (!mapboxManagerRef.current || !isReady || !userLocation) return;

    const map = mapboxManagerRef.current.getMap();
    if (!map || !characterStateRef.current) return;

    const [charX, charY, charZ] = characterStateRef.current.position;

    // 3D 좌표를 지도상의 GPS 좌표로 변환
    const SCALE = 100000;
    const characterLng = userLocation[0] + (charX / SCALE);
    const characterLat = userLocation[1] - (charZ / SCALE);

    // 캐릭터 마커 위치 업데이트
    if (window.characterMarker) {
      window.characterMarker.setLngLat([characterLng, characterLat]);
    }

    // 지도 중심을 캐릭터 위치로 이동
    map.setCenter([characterLng, characterLat]);
  });

  return null;
}

/**
 * 가상 풀숲 바닥 컴포넌트
 * 포켓몬 고 스타일의 풀밭 느낌 - 무한 맵
 */
function VirtualGrassGround() {
  const grassPatches = [];
  
  // 랜덤 풀 패치 생성 - 더 넓은 범위
  for (let i = 0; i < 500; i++) {
    const x = (Math.random() - 0.5) * 500;
    const z = (Math.random() - 0.5) * 500;
    const scale = 0.3 + Math.random() * 0.5;
    const rotation = Math.random() * Math.PI * 2;
    grassPatches.push({ x, z, scale, rotation, key: i });
  }

  return (
    <group>
      {/* 메인 바닥 - 무한 잔디 (매우 큰 크기) */}
      <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial 
          color={0x4CAF50}
          roughness={0.9}
          metalness={0}
        />
      </mesh>

      {/* 풀 패치들 - 작은 원형 */}
      {grassPatches.map(({ x, z, scale, rotation, key }) => (
        <group key={key} position={[x, -1.17, z]} rotation={[0, rotation, 0]}>
          {/* 풀 뭉치 */}
          <mesh scale={[scale, 0.1, scale]}>
            <cylinderGeometry args={[0.8, 1, 0.3, 8]} />
            <meshStandardMaterial 
              color={key % 3 === 0 ? 0x388E3C : key % 3 === 1 ? 0x43A047 : 0x2E7D32}
              roughness={0.9}
            />
          </mesh>
        </group>
      ))}

      {/* 나무들 (랜덤 배치 - 더 많이) */}
      {[...Array(50)].map((_, i) => {
        const x = (Math.random() - 0.5) * 400;
        const z = (Math.random() - 0.5) * 400;
        // 중앙 근처는 피함
        if (Math.abs(x) < 15 && Math.abs(z) < 15) return null;
        const treeScale = 1 + Math.random() * 0.5;
        return (
          <group key={`tree-${i}`} position={[x, -1.2, z]} scale={[treeScale, treeScale, treeScale]}>
            {/* 나무 줄기 */}
            <mesh position={[0, 1.5, 0]}>
              <cylinderGeometry args={[0.3, 0.5, 3, 8]} />
              <meshStandardMaterial color={0x5D4037} roughness={0.9} />
            </mesh>
            {/* 나무 잎 */}
            <mesh position={[0, 4, 0]}>
              <coneGeometry args={[2, 4, 8]} />
              <meshStandardMaterial color={0x2E7D32} roughness={0.8} />
            </mesh>
            <mesh position={[0, 5.5, 0]}>
              <coneGeometry args={[1.5, 3, 8]} />
              <meshStandardMaterial color={0x388E3C} roughness={0.8} />
            </mesh>
          </group>
        );
      })}

      {/* 꽃들 (랜덤 배치 - 더 많이) */}
      {[...Array(100)].map((_, i) => {
        const x = (Math.random() - 0.5) * 300;
        const z = (Math.random() - 0.5) * 300;
        const colors = [0xE91E63, 0xFFEB3B, 0x9C27B0, 0xFF9800, 0x03A9F4];
        const color = colors[i % colors.length];
        return (
          <mesh key={`flower-${i}`} position={[x, -1.1, z]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
          </mesh>
        );
      })}

      {/* 돌멩이들 - 더 많이 */}
      {[...Array(40)].map((_, i) => {
        const x = (Math.random() - 0.5) * 300;
        const z = (Math.random() - 0.5) * 300;
        const scale = 0.2 + Math.random() * 0.4;
        return (
          <mesh key={`rock-${i}`} position={[x, -1.1, z]} scale={[scale, scale * 0.6, scale]}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={0x757575} roughness={0.95} />
          </mesh>
        );
      })}
    </group>
  );
}
