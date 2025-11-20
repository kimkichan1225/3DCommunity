import React, { Suspense, useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import './App.css';
import { useKeyboardControls } from './useKeyboardControls';
import { Physics, RigidBody, CapsuleCollider } from '@react-three/rapier';
import LandingPage from './components/LandingPage';

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

function Model({ characterRef }) {
  const { scene, animations } = useGLTF('/resources/Ultimate Animated Character Pack - Nov 2019/glTF/BaseCharacter.gltf');
  const { actions } = useAnimations(animations, characterRef);

  const { forward, backward, left, right, shift } = useKeyboardControls();
  const [currentAnimation, setCurrentAnimation] = useState('none');

  // 발걸음 소리를 위한 오디오 시스템
  const stepAudioRef = useRef(null);
  const lastStepTimeRef = useRef(0);
  const stepIntervalRef = useRef(0.5); // 발걸음 간격 (초)

  // 안전한 참조를 위한 useRef
  const safeCharacterRef = useRef();
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
        position={[0, 2, 0]} // 시작 위치
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

  const handleLogin = () => {
    // TODO: 실제 로그인 로직 구현
    console.log('로그인 버튼 클릭');
    setIsLoggedIn(true);
    setShowLanding(false);
  };

  const handleRegister = () => {
    // TODO: 실제 회원가입 로직 구현
    console.log('회원가입 버튼 클릭');
    // 임시로 바로 로그인 상태로 전환
    setIsLoggedIn(true);
    setShowLanding(false);
  };

  return (
    <div className="App">
      {/* 3D 배경 (항상 렌더링) */}
      <Canvas
        camera={{ position: [-0.00, 28.35, 19.76], rotation: [-0.96, -0.00, -0.00] }}
        shadows
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
                <Model characterRef={characterRef} />
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

      {/* 랜딩 페이지 오버레이 */}
      {showLanding && (
        <LandingPage onLogin={handleLogin} onRegister={handleRegister} />
      )}
    </div>
  );
}

export default App;