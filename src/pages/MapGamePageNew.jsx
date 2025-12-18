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
    rotation: 0
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

  // 캐릭터 위치를 지도에 마커로 표시 - 초기 생성만
  useEffect(() => {
    if (!mapboxManagerRef.current || !isReady) return;

    const map = mapboxManagerRef.current.getMap();

    // 마커 생성 (처음 한번만)
    if (!window.characterMarker && characterStateRef.current) {
      const [charX, charY, charZ] = characterStateRef.current.position;
      const characterLng = userLocation[0] + (charX / 100000);
      const characterLat = userLocation[1] - (charZ / 100000);  // Z축은 부호 반대

      const markerElement = document.createElement('div');
      markerElement.style.width = '16px';
      markerElement.style.height = '16px';
      markerElement.style.borderRadius = '50%';
      markerElement.style.backgroundColor = '#ff0000';
      markerElement.style.border = '2px solid #ffffff';
      markerElement.style.boxShadow = '0 0 8px rgba(255, 0, 0, 0.8)';

      window.characterMarker = new mapboxgl.Marker(markerElement)
        .setLngLat([characterLng, characterLat])
        .addTo(map);
    }

    return () => {
      if (window.characterMarker) {
        window.characterMarker.remove();
        window.characterMarker = null;
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
      {/* 뒤로가기 버튼 */}
      <button className="map-game-back-button" onClick={handleBack}>
        ← 뒤로가기
      </button>

      {/* 좌측: Three.js 캐릭터 */}
      <div className="map-game-left">
        <Canvas
          camera={{
            position: [0, 28, 20],
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
          
          {/* 바닥 - 밝은 초록색 */}
          <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[50, 50]} />
            <meshStandardMaterial color={0x90EE90} />
          </mesh>

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

      {/* HUD 정보 */}
      {isReady && (
        <div className="map-game-hud">
          <div style={{ fontSize: '12px', color: '#0f0', fontFamily: 'monospace' }}>
            <strong>📊 게임 상태</strong>
            <div>상태: ✅ 준비 완료</div>
            {userLocation && (
              <div style={{ marginTop: '4px', fontSize: '10px', color: '#0f0' }}>
                📍 위치: {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
              </div>
            )}
            <div style={{ marginTop: '6px', fontSize: '10px', color: '#888' }}>
              WASD: 이동<br/>
              Shift: 달리기<br/>
              화살표: 이동 방향
            </div>
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

    // 상태 공유
    characterStateRef.current.position = [
      modelGroupRef.current.position.x,
      modelGroupRef.current.position.y,
      modelGroupRef.current.position.z
    ];
    characterStateRef.current.rotation = lastRotationYRef.current;
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
  const cameraOffset = new THREE.Vector3(0, 28.35, 19.76); // CameraController와 동일한 오프셋
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
    // 스케일: 100000으로 나눠서 지도 화면 내에서 적당히 이동하도록 조정
    const SCALE = 100000;
    const characterLng = userLocation[0] + (charX / SCALE);
    const characterLat = userLocation[1] - (charZ / SCALE);  // Z축은 부호 반대 (Three.js Z가 음수 = 북쪽)

    // 마커 업데이트 (매 프레임마다 실시간 동기화)
    if (window.characterMarker) {
      window.characterMarker.setLngLat([characterLng, characterLat]);
      
      // 지도 중심을 빨간점 위치로 이동
      map.setCenter([characterLng, characterLat]);
    }
  });

  return null;
}
