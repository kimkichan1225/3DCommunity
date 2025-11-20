import React, { Suspense, useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import './App.css';
import { useKeyboardControls } from './useKeyboardControls';
import { Physics, RigidBody, CapsuleCollider } from '@react-three/rapier';
import BoardList from './components/board/BoardList';

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



function CameraController({ characterRef }) {
  const { camera } = useThree();
  const cameraOffset = new THREE.Vector3(-0.00, 28.35, 19.76); // 고정된 카메라 오프셋

  useFrame((state, delta) => {
    if (!characterRef.current) return;

    // 월드 position 가져오기
    const worldPosition = new THREE.Vector3();
    characterRef.current.getWorldPosition(worldPosition);

    // 타겟 위치 설정
    const targetPosition = worldPosition;

    // 타겟 위치에 고정된 오프셋을 더해서 카메라 위치 계산
    const targetCameraPosition = targetPosition.clone().add(cameraOffset);

    // 부드러운 카메라 이동
    camera.position.lerp(targetCameraPosition, delta * 5.0);

    // 타겟을 바라보도록 설정
    camera.lookAt(targetPosition);
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
  const currentRotationRef = useRef(new THREE.Quaternion()); // 현재 회전 저장
  
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
    const currentCharacter = characterRef.current || safeCharacterRef.current;
    if (!currentCharacter) return;

    const speed = shift ? 18 : 8; // 물리 기반 속도 (걷기: 8, 뛰기: 18)
    const direction = new THREE.Vector3();

    if (forward) direction.z -= 1;
    if (backward) direction.z += 1;
    if (left) direction.x -= 1;
    if (right) direction.x += 1;

    if (direction.length() > 0) {
      direction.normalize();

      // 회전 처리 - 부드럽게 회전
      const targetAngle = Math.atan2(direction.x, direction.z);
      const targetQuaternion = new THREE.Quaternion();
      targetQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngle);

      // 현재 회전에서 목표 회전으로 부드럽게 보간 (slerp)
      currentRotationRef.current.slerp(targetQuaternion, 0.25);

      if (rigidBodyRef.current) {
        // 보간된 회전을 RigidBody에 적용
        rigidBodyRef.current.setRotation({
          x: currentRotationRef.current.x,
          y: currentRotationRef.current.y,
          z: currentRotationRef.current.z,
          w: currentRotationRef.current.w
        }, true);
      }

      // 물리 기반 이동 (setLinvel 사용)
      if (rigidBodyRef.current) {
        const currentVel = rigidBodyRef.current.linvel();
        rigidBodyRef.current.setLinvel({
          x: direction.x * speed,
          y: currentVel.y, // Y축은 중력 유지
          z: direction.z * speed
        });
      }

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
      if (rigidBodyRef.current) {
        const currentVel = rigidBodyRef.current.linvel();
        rigidBodyRef.current.setLinvel({ x: 0, y: currentVel.y, z: 0 });
      }
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      colliders={false}
      mass={1}
      linearDamping={0.5}
      enabledRotations={[false, true, false]} // Y축 회전만 허용
      position={[0, 2, 0]} // 시작 위치
    >
      <CapsuleCollider args={[2, 1.3]} position={[0, 3.2, 0]} />
      <primitive
        ref={characterRef}
        object={scene}
        scale={2}
        castShadow
        receiveShadow
      />
    </RigidBody>
  );
}

function Level1Map(props) {
  const { scene } = useGLTF('/resources/GameView/PublicSquare.glb');

  // Level1Map 모델을 복사해서 각 인스턴스가 독립적으로 작동하도록 함
  const clonedScene = useMemo(() => {
    const cloned = scene.clone();
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return cloned;
  }, [scene]);

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <primitive object={clonedScene} {...props} />
    </RigidBody>
  );
}

useGLTF.preload('/resources/Ultimate Animated Character Pack - Nov 2019/glTF/BaseCharacter.gltf');
useGLTF.preload('/resources/GameView/PublicSquare.glb');

function Level1({ characterRef }) {
  return (
    <>
      <Sky />

      {/* Level1 Map */}
      <Level1Map
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
  const [showBoard, setShowBoard] = useState(false);

  return (
    <div className="App">
      {/* 게시판 토글 버튼 */}
      <button
        onClick={() => setShowBoard(!showBoard)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '12px',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          fontSize: '24px',
          width: '50px',
          height: '50px',
          cursor: 'pointer',
          zIndex: 999,
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        📋
      </button>

      {/* 게시판 */}
      {showBoard && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 998,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            boxSizing: 'border-box'
          }}
          onClick={() => setShowBoard(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '80%',
              height: '90%',
              overflow: 'auto',
              borderRadius: '12px'
            }}
          >
            <BoardList />
          </div>
        </div>
      )}

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
            <Model characterRef={characterRef} />
            <CameraController characterRef={characterRef} />
            <CameraLogger />
            <Level1 characterRef={characterRef} />
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;