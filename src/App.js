import React, { Suspense, useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import './App.css';
import Mapbox3D from './components/Mapbox3D';
import { useKeyboardControls } from './useKeyboardControls';
import { Physics, RigidBody, CapsuleCollider } from '@react-three/rapier';
import LandingPage from './components/LandingPage';
import BoardModal from './components/BoardModal';
import MenuModal from './components/MenuModal';
import ProfileModal from './components/ProfileModal';
import { MdForum } from 'react-icons/md';
import { FaUser } from 'react-icons/fa';

// 하늘을 위한 컴포넌트
function Sky() {
  return (
    <mesh>
      <sphereGeometry args={[400, 32, 32]} />
      <meshBasicMaterial color="#87CEFA" side={THREE.BackSide} />
    </mesh>
  );
}

function CameraLogger() {
  const { log } = useKeyboardControls();
  const { camera } = useThree();
  const logRef = useRef(false);

  useEffect(() => {
    // Log only when 'c' is pressed (rising edge)
    if (log && !logRef.current) {
      const pos = camera.position.toArray().map(p => p.toFixed(2));
      const rot = camera.rotation.toArray().slice(0, 3).map(r => r.toFixed(2)); // Fixed: slice to get only numbers
      console.log(`Camera Position: [${pos.join(', ')}]`);
      console.log(`Camera Rotation: [${rot.join(', ')}]`);
    }
    logRef.current = log;
  }, [log, camera]);

  return null;
}



function CameraController({ characterRef, mainCameraRef, isLoggedIn }) {
  const { camera } = useThree();
  const cameraOffset = new THREE.Vector3(-0.00, 28.35, 19.76); // 고정된 카메라 오프셋
  const targetPositionRef = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    // 로그인 후: 캐릭터를 따라감
    if (isLoggedIn && characterRef.current) {
      // 월드 position 가져오기
      const worldPosition = new THREE.Vector3();
      characterRef.current.getWorldPosition(worldPosition);

      // 타겟 위치를 부드럽게 보간 (떨림 방지)
      targetPositionRef.current.lerp(worldPosition, delta * 10.0);

      // 타겟 위치에 고정된 오프셋을 더해서 카메라 위치 계산
      const targetCameraPosition = targetPositionRef.current.clone().add(cameraOffset);

      // 부드러운 카메라 이동 (속도 감소)
      camera.position.lerp(targetCameraPosition, delta * 3.0);

      // 타겟을 바라보도록 설정
      camera.lookAt(targetPositionRef.current);
    }
    // 로그인 전: MainCamera를 따라감
    else if (!isLoggedIn && mainCameraRef.current) {
      // MainCamera의 월드 position 가져오기
      const worldPosition = new THREE.Vector3();
      mainCameraRef.current.getWorldPosition(worldPosition);

      // 타겟 위치를 부드럽게 보간 (떨림 방지)
      targetPositionRef.current.lerp(worldPosition, delta * 10.0);

      // 타겟 위치에 고정된 오프셋을 더해서 카메라 위치 계산
      const targetCameraPosition = targetPositionRef.current.clone().add(cameraOffset);

      // 부드러운 카메라 이동 (속도 감소)
      camera.position.lerp(targetCameraPosition, delta * 3);

      // 타겟을 바라보도록 설정
      camera.lookAt(targetPositionRef.current);
    }
  });

  return null;
}

function Model({ characterRef, initialPosition, isMovementDisabled, username }) {
  const { scene, animations } = useGLTF('/resources/Ultimate Animated Character Pack - Nov 2019/glTF/BaseCharacter.gltf');
  const { actions } = useAnimations(animations, characterRef);

  const { forward, backward, left, right, shift } = useKeyboardControls();
  const [currentAnimation, setCurrentAnimation] = useState('none');

  // 발걸음 소리를 위한 오디오 시스템
  const stepAudioRef = useRef(null);
  const lastStepTimeRef = useRef(0);
  const stepIntervalRef = useRef(0.5); // 발걸음 간격 (초)

  // 안전한 참조를 위한 useRef
  const rigidBodyRef = useRef(); // Rapier RigidBody 참조
  const currentRotationRef = useRef(new THREE.Quaternion()); // 현재 회전 저장 (모델용)
  const modelGroupRef = useRef(); // 캐릭터 모델 그룹 참조
  
  // 발걸음 소리 로드 및 재생 함수
  useEffect(() => {
    // 발걸음 소리 로드 (여러 경로 시도, .wav 파일 우선)
    const audioPaths = [
      '/resources/Sounds/Step2.wav',
      '/resources/Sounds/step2.wav',
      '/Sounds/Step2.wav',
      '/resources/Sounds/Step2.mp3',
      '/resources/Sounds/step2.mp3',
      '/Sounds/Step2.mp3'
    ];
    
    // 첫 번째 경로로 시도
    stepAudioRef.current = new Audio(audioPaths[0]);
    stepAudioRef.current.volume = 1.0; // 볼륨을 최대로 설정
    stepAudioRef.current.preload = 'auto';
    
    // 오디오 로드 확인
    stepAudioRef.current.addEventListener('canplaythrough', () => {
      // 발걸음 소리 로드 완료
    });
    
    stepAudioRef.current.addEventListener('error', (e) => {
      // 다른 경로 시도
      for (let i = 1; i < audioPaths.length; i++) {
        const newAudio = new Audio(audioPaths[i]);
        newAudio.volume = 1.0;
        newAudio.preload = 'auto';
        
        newAudio.addEventListener('canplaythrough', () => {
          stepAudioRef.current = newAudio;
        });
        
        newAudio.addEventListener('error', () => {
          // 발걸음 소리 로드 실패
        });
      }
    });
  }, []);

  // 발걸음 소리 재생 함수
  const playStepSound = () => {
    if (stepAudioRef.current) {
      stepAudioRef.current.currentTime = 0; // 처음부터 재생
      stepAudioRef.current.play().catch(e => {
        // 발걸음 소리 재생 실패
      });
    }
  };

  useEffect(() => {
    // Enable shadows on all meshes in the character model
    if (characterRef.current) {
      characterRef.current.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }

    // characterRef를 modelGroupRef로 설정 (카메라가 추적할 수 있도록)
    if (modelGroupRef.current) {
      characterRef.current = modelGroupRef.current;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let animToPlay = 'Idle';
    if (forward || backward || left || right) {
      animToPlay = shift ? 'Run' : 'Walk';
    }

    if (currentAnimation !== animToPlay) {
      const oldAction = actions[currentAnimation];
      const newAction = actions[animToPlay];

      if (oldAction) oldAction.fadeOut(0.5);
      if (newAction) newAction.reset().fadeIn(0.5).play();

      setCurrentAnimation(animToPlay);

      // 걷기/뛰기 애니메이션 시작 시 발걸음 소리 시작
      if (animToPlay === 'Walk' || animToPlay === 'Run') {
        lastStepTimeRef.current = Date.now();
        stepIntervalRef.current = animToPlay === 'Run' ? 0.45 : 0.6; // 더 빠른 발걸음 간격
      }
    }
  }, [forward, backward, left, right, shift, actions, currentAnimation]);

  useFrame((state, delta) => {
    if (!rigidBodyRef.current || !modelGroupRef.current) return;

    // 모달이 열려있으면 이동 비활성화
    if (isMovementDisabled) {
      // 속도를 0으로 설정하여 정지
      rigidBodyRef.current.setLinvel({ x: 0, y: rigidBodyRef.current.linvel().y, z: 0 }, true);
      return;
    }

    const speed = shift ? 18 : 8; // 물리 기반 속도 (걷기: 8, 뛰기: 18)
    const direction = new THREE.Vector3();

    if (forward) direction.z -= 1;
    if (backward) direction.z += 1;
    if (left) direction.x -= 1;
    if (right) direction.x += 1;

    if (direction.length() > 0) {
      direction.normalize();

      // 회전 처리 - 부드럽게 회전 (모델만)
      const targetAngle = Math.atan2(direction.x, direction.z);
      const targetQuaternion = new THREE.Quaternion();
      targetQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngle);

      // 현재 회전에서 목표 회전으로 부드럽게 보간 (slerp)
      currentRotationRef.current.slerp(targetQuaternion, 0.25);

      // 물리 기반 이동 (setLinvel 사용)
      const currentVel = rigidBodyRef.current.linvel();
      rigidBodyRef.current.setLinvel({
        x: direction.x * speed,
        y: currentVel.y, // Y축은 중력 유지
        z: direction.z * speed
      });

      // 발걸음 소리 재생
      if (currentAnimation === 'Walk' || currentAnimation === 'Run') {
        const currentTime = Date.now();
        if (currentTime - lastStepTimeRef.current > stepIntervalRef.current * 1000) {
          playStepSound();
          lastStepTimeRef.current = currentTime;
        }
      }
    } else {
      // 정지 시 속도 0
      const currentVel = rigidBodyRef.current.linvel();
      rigidBodyRef.current.setLinvel({ x: 0, y: currentVel.y, z: 0 });
    }

    // RigidBody의 위치를 모델에 동기화
    const rbPosition = rigidBodyRef.current.translation();
    modelGroupRef.current.position.set(rbPosition.x, rbPosition.y, rbPosition.z);

    // 모델의 회전은 입력에 의한 회전만 적용
    modelGroupRef.current.quaternion.copy(currentRotationRef.current);
  });

  return (
    <>
      {/* 물리 충돌용 RigidBody (보이지 않음) */}
      <RigidBody
        ref={rigidBodyRef}
        type="dynamic"
        colliders={false}
        mass={1}
        linearDamping={2.0} // 증가: 더 빠르게 감속 (떨림 방지)
        angularDamping={1.0} // 회전 감쇠 추가
        enabledRotations={[false, false, false]} // 물리적 회전 완전 잠금
        position={initialPosition ? initialPosition : [0, 2, 0]} // 시작 위치 (App에서 initialPosition prop으로 설정 가능)
        lockRotations={true} // 회전 완전 잠금
        canSleep={false} // 절대 sleep 상태로 전환되지 않음 (플레이어 캐릭터용)
      >
        <CapsuleCollider args={[2, 1.3]} position={[0, 3.2, 0]} />
      </RigidBody>

      {/* 캐릭터 모델 (RigidBody와 분리) */}
      <group ref={modelGroupRef}>
        <primitive
          ref={characterRef}
          object={scene}
          scale={2}
          castShadow
          receiveShadow
        />

        {/* 닉네임 표시 (캐릭터 머리 위) - 3D Text with Billboard */}
        {username && (
          <Billboard position={[0, 7, 0]} follow={true} lockX={false} lockY={false} lockZ={false}>
            <Text
              fontSize={0.6}
              color="white"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.05}
              outlineColor="black"
              outlineOpacity={1}
              fontWeight="bold"
            >
              {username}
            </Text>
          </Billboard>
        )}
      </group>
    </>
  );
}

function Level1Map({ mainCameraRef, ...props }) {
  const { scene } = useGLTF('/resources/GameView/PublicSquare.glb');

  // Level1Map 모델을 복사해서 각 인스턴스가 독립적으로 작동하도록 함
  const clonedScene = useMemo(() => {
    const cloned = scene.clone();

    // MainCamera 찾기
    cloned.traverse((child) => {
      if (child.name === 'MainCamera') {
        console.log('✅ MainCamera 발견 및 ref 저장!', child);
        if (mainCameraRef) {
          mainCameraRef.current = child;
        }
      }

      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return cloned;
  }, [scene, mainCameraRef]);

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <primitive object={clonedScene} {...props} />
    </RigidBody>
  );
}

useGLTF.preload('/resources/Ultimate Animated Character Pack - Nov 2019/glTF/BaseCharacter.gltf');
useGLTF.preload('/resources/GameView/PublicSquare.glb');

function Level1({ characterRef, mainCameraRef }) {
  return (
    <>
      <Sky />

      {/* Level1 Map */}
      <Level1Map
        mainCameraRef={mainCameraRef}
        position={[0, 0, 0]}
        scale={1.0}
        rotation={[0, 0, 0]}
        castShadow
        receiveShadow
      />
    </>
  );
}

function App() {
  const characterRef = useRef();
  const mainCameraRef = useRef();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [mapHelpers, setMapHelpers] = useState(null);
  const [initialPosition, setInitialPosition] = useState(null);
  const [isMapFull, setIsMapFull] = useState(false);
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [username, setUsername] = useState('');
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1IjoiYmluc3MwMTI0IiwiYSI6ImNtaTcyM24wdjAwZDMybHEwbzEyenJ2MjEifQ.yi82NwUcsPMGP4M3Ri136g';

  // 모달이 열려있는지 확인
  const isAnyModalOpen = showBoardModal || showMenuModal || showProfileModal || showLanding;

  // Map가 준비되면 호출됩니다. mapbox의 projection helper를 받아와
  // 현재 위치(geolocation)를 Three.js 월드 좌표로 변환해 캐릭터 초기 위치를 설정합니다.
  const handleMapReady = ({ map, project }) => {
    setMapHelpers({ map, project });

    // Try to get browser geolocation; fallback to map center
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lng = pos.coords.longitude;
          const lat = pos.coords.latitude;

          try {
            const center = map.getCenter();
            const centerMerc = project([center.lng, center.lat], 0);
            const userMerc = project([lng, lat], 0);

            // Convert mercator units difference to meters
            const unitsPerMeter = userMerc.meterInMercatorCoordinateUnits || 1;
            const dx = (userMerc.translateX - centerMerc.translateX) / unitsPerMeter;
            const dz = (userMerc.translateY - centerMerc.translateY) / unitsPerMeter;

            // Mapbox의 Y increases northwards; Three.js Z forward is negative, adjust sign if needed
            const threeX = dx;
            const threeY = 2; // 약간 띄워서 시작
            const threeZ = -dz;

            setInitialPosition([threeX, threeY, threeZ]);
            console.log('Initial character position (Three.js):', [threeX, threeY, threeZ]);
          } catch (e) {
            console.warn('map projection failed', e);
          }
        },
        (err) => {
          console.warn('Geolocation denied or unavailable, using map center', err);
          // use map center as fallback
          const threeX = 0;
          const threeY = 2;
          const threeZ = 0;
          setInitialPosition([threeX, threeY, threeZ]);
        }
      );
    } else {
      console.warn('Geolocation not supported, using map center');
      setInitialPosition([0, 2, 0]);
    }
  };

  const toggleMapFull = (e) => {
    e && e.stopPropagation();
    // Only toggle the boolean; Mapbox3D will mount when isMapFull becomes true
    setIsMapFull((v) => !v);
  };

  // Helper: request geolocation and set initialPosition using provided project helper
  const requestGeolocationAndSet = (project, map) => {
    if (!project || !map) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lng = pos.coords.longitude;
          const lat = pos.coords.latitude;
          try {
            const center = map.getCenter();
            const centerMerc = project([center.lng, center.lat], 0);
            const userMerc = project([lng, lat], 0);
            const unitsPerMeter = userMerc.meterInMercatorCoordinateUnits || 1;
            const dx = (userMerc.translateX - centerMerc.translateX) / unitsPerMeter;
            const dz = (userMerc.translateY - centerMerc.translateY) / unitsPerMeter;
            const threeX = dx;
            const threeY = 2;
            const threeZ = -dz;
            setInitialPosition([threeX, threeY, threeZ]);
            console.log('Initial character position (from toggle):', [threeX, threeY, threeZ]);
          } catch (e) {
            console.warn('map projection failed', e);
          }
        },
        (err) => {
          console.warn('Geolocation denied/unavailable when opening map', err);
        }
      );
    }
  };

  const handleLoginSuccess = (user) => {
    console.log('로그인 성공:', user);
    setIsLoggedIn(true);
    setShowLanding(false);
    setUsername(user.username || 'Guest');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowLanding(true);
    setUsername('');
  };

  // ESC 키 이벤트 핸들러
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isLoggedIn && !showLanding) {
        setShowMenuModal((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoggedIn, showLanding]);

  return (
    <div className="App">
      {/* Mapbox 배경 및 Three.js 오버레이 */}
      {isMapFull && (
        <Mapbox3D onMapReady={handleMapReady} isFull={isMapFull} />
      )}

      {/* 프로필 아이콘 (좌측 상단, 로그인한 사용자만 표시) */}
      {isLoggedIn && (
        <button className="profile-icon-button" onClick={() => setShowProfileModal(true)} title="프로필">
          <img src="/resources/Icon/Profile-icon.png" alt="Profile" />
        </button>
      )}

      {/* 아이콘 메뉴 (로그인한 사용자만 표시) */}
      {isLoggedIn && (
        <div className={`icon-menu-container ${isMenuExpanded ? 'expanded' : ''}`}>
          {/* 토글 화살표 */}
          <button
            className="menu-toggle-arrow"
            onClick={() => setIsMenuExpanded(!isMenuExpanded)}
          >
            <img
              src={isMenuExpanded ? '/resources/Icon/rightarrow.png' : '/resources/Icon/leftarrow.png'}
              alt={isMenuExpanded ? 'Close' : 'Open'}
            />
          </button>

          {/* 확장 시 보이는 아이콘들 */}
          <div className={`secondary-icons ${isMenuExpanded ? 'show' : 'hide'}`}>
            <button className="icon-button" onClick={() => console.log('알람')} title="알람">
              <img src="/resources/Icon/Alarm-icon.png" alt="Alarm" />
            </button>
            <button className="icon-button" onClick={() => console.log('채팅')} title="채팅">
              <img src="/resources/Icon/Chat-icon.png" alt="Chat" />
            </button>
            <button className="icon-button" onClick={() => console.log('이벤트')} title="이벤트">
              <img src="/resources/Icon/Event-icon.png" alt="Event" />
            </button>
            <button className="icon-button" onClick={() => console.log('친구목록')} title="친구목록">
              <img src="/resources/Icon/Friend-icon.png" alt="Friend" />
            </button>
            <button className="icon-button" onClick={() => setShowMenuModal(true)} title="설정">
              <img src="/resources/Icon/Setting-icon.png" alt="Setting" />
            </button>
            <button className="icon-button" onClick={() => console.log('상점')} title="상점">
              <img src="/resources/Icon/Shop-icon.png" alt="Shop" />
            </button>
          </div>

          {/* 게시판 아이콘 */}
          <button className="icon-button primary-board" onClick={() => setShowBoardModal(true)} title="게시판">
            <img src="/resources/Icon/Board-icon.png" alt="Board" />
          </button>

          {/* 지도 아이콘 */}
          <button className="icon-button primary-map" onClick={toggleMapFull} title="지도">
            <img src="/resources/Icon/Map-icon.png" alt="Map" />
          </button>
        </div>
      )}

      {/* Token warning if user opens map but token missing */}
      {isMapFull && !mapboxToken && (
        <div className="map-token-warning">Mapbox token not set. Fill `REACT_APP_MAPBOX_TOKEN` in your `.env`.</div>
      )}

      {/* 3D 배경 (항상 렌더링) - 지도 위에 오버레이로 렌더링됩니다 */}
      <div className="three-overlay">
      <Canvas
        className="three-canvas"
        camera={{ position: [-0.00, 28.35, 19.76], rotation: [-0.96, -0.00, -0.00] }}
        shadows
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[50, 50, 25]}
          intensity={6}
          castShadow
          shadow-mapSize-width={8192}
          shadow-mapSize-height={8192}
          shadow-camera-far={1000}
          shadow-camera-left={-500}
          shadow-camera-right={500}
          shadow-camera-top={500}
          shadow-camera-bottom={-500}
          shadow-bias={-0.0001}
          shadow-normalBias={0.02}
          shadow-radius={4}
        />
        {/* Sun visual */}
        <mesh position={[50, 50, 25]}>
          <sphereGeometry args={[3, 16, 16]} />
          <meshBasicMaterial color="#FDB813" />
        </mesh>

        <Suspense fallback={null}>
          <Physics gravity={[0, -40, 0]} debug>
            {/* 로그인 후에만 캐릭터 표시 */}
            {isLoggedIn && (
              <>
                <Model
                  characterRef={characterRef}
                  initialPosition={initialPosition}
                  isMovementDisabled={isAnyModalOpen}
                  username={username}
                />
                <CameraLogger />
              </>
            )}
            {/* CameraController는 항상 렌더링 (로그인 전: MainCamera, 로그인 후: Character) */}
            <CameraController
              characterRef={characterRef}
              mainCameraRef={mainCameraRef}
              isLoggedIn={isLoggedIn}
            />
            <Level1 characterRef={characterRef} mainCameraRef={mainCameraRef} />
          </Physics>
        </Suspense>
      </Canvas>
      </div>

      {/* 랜딩 페이지 오버레이 (지도 전체화면일 때는 숨김) */}
      {showLanding && !isMapFull && (
        <LandingPage onLoginSuccess={handleLoginSuccess} />
      )}

      {/* 맵 전체화면일 때 뒤로가기 버튼 (왼쪽 상단) */}
      {isMapFull && (
        <button className="map-back-button" onClick={toggleMapFull}>Back</button>
      )}

      {/* 게시판 모달 */}
      {showBoardModal && (
        <BoardModal onClose={() => setShowBoardModal(false)} />
      )}

      {/* ESC 메뉴 모달 */}
      {showMenuModal && (
        <MenuModal
          onClose={() => setShowMenuModal(false)}
          onLogout={handleLogout}
        />
      )}

      {/* 프로필 모달 */}
      {showProfileModal && (
        <ProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  );
}

export default App;