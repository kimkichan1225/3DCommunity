import React, { Suspense, useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations, shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';
import './App.css';
import { useKeyboardControls } from './useKeyboardControls';
import { PortalVortex } from './PortalVortex';
import AuthOverlay from './components/auth/AuthOverlay';
import GameMenu from './components/menu/GameMenu';
import useAuthStore from './store/useAuthStore';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';

// 찰랑거리는 물 효과를 위한 셰이더 머티리얼
const WaterMaterial = shaderMaterial(
  // Uniforms
  {
    uTime: 0,
    uWaterColor: new THREE.Color('#D0F0FF'), // 매우 밝은 하늘색
    uWaterColorDeep: new THREE.Color('#D0F0FF'), // 매우 밝은 하늘색 (통일)
  },
  // Vertex Shader
  `
  uniform float uTime;
  varying vec3 vWorldPosition;
  varying float vElevation;
  varying vec3 vNormal;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);

    // 물결 효과 (여러 개의 사인파 조합)
    float wave1 = sin(worldPosition.x * 0.1 + uTime * 0.5) * 0.3;
    float wave2 = sin(worldPosition.z * 0.15 + uTime * 0.7) * 0.2;
    float wave3 = sin((worldPosition.x + worldPosition.z) * 0.08 + uTime * 0.3) * 0.25;

    vElevation = wave1 + wave2 + wave3;
    worldPosition.y += vElevation;

    vWorldPosition = worldPosition.xyz;
    vNormal = vec3(0.0, 1.0, 0.0); // 항상 위를 향하도록 (어두운 선 제거)

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
  `,
  // Fragment Shader
  `
  uniform vec3 uWaterColor;
  uniform vec3 uWaterColorDeep;
  uniform float uTime;
  varying vec3 vWorldPosition;
  varying float vElevation;
  varying vec3 vNormal;

  void main() {
    // 하늘색 기본 색상
    vec3 baseColor = uWaterColor;

    // 부드러운 물 반짝임 효과
    float sparkle = sin(vWorldPosition.x * 0.5 + uTime * 0.5) + sin(vWorldPosition.z * 0.3 + uTime * 0.7);
    sparkle = sparkle * 0.03 + 0.97; // 더 미세한 반짝임

    vec3 finalColor = baseColor * sparkle;

    gl_FragColor = vec4(finalColor, 1.0);
  }
  `
);

extend({ WaterMaterial });

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



const portalPosition = new THREE.Vector3(-20, 7.5, -20);
const portalRadius = 2;
const portalLevel2ToLevel1Position = new THREE.Vector3(0, 7.5, 23.5);
const portalLevel2ToLevel1Radius = 2;
const level2PortalFrontPosition = new THREE.Vector3(-20, 0, -15); // Level2 포탈 앞 위치

function CameraController({ gameState, characterRef }) {
  const { camera } = useThree();
  const cameraOffset = new THREE.Vector3(-0.00, 28.35, 19.76); // 고정된 카메라 오프셋
  
  // 이전 카메라 상태를 추적하기 위한 useRef
  const prevCameraState = useRef({
    isInCar: false,
    targetType: 'character'
  });

  useFrame((state, delta) => {
    if (!characterRef.current || !characterRef.current.position) return;

    if (gameState === 'entering_portal') {
      const characterPosition = characterRef.current.position;
      const targetPosition = characterPosition.clone().add(new THREE.Vector3(0, 3, 5));
      camera.position.lerp(targetPosition, delta * 2.0);
      camera.lookAt(characterPosition);
      return;
    }

    if (gameState === 'playing_level1' || gameState === 'playing_level2') {
      let targetPosition;
      let currentTargetType = 'character';
      
      // 자동차에 탑승한 상태인지 확인하고 타겟 위치 결정
      if (characterRef.current?.isInCar && 
          characterRef.current?.safeCarRef?.current) {
        // 자동차에 탑승한 경우: 캐릭터 위치 사용 (자동차와 동기화됨)
        targetPosition = characterRef.current.position;
        currentTargetType = 'car';
        
        // 자동차 상태 확인 완료
      } else {
        // 일반 상태: 캐릭터 위치 사용
        targetPosition = characterRef.current.position;
        currentTargetType = 'character';
      }
      
      // 상태 변화 추적
      if (prevCameraState.current.targetType !== currentTargetType) {
        prevCameraState.current.targetType = currentTargetType;
      }
      
      // 타겟 위치에 고정된 오프셋을 더해서 카메라 위치 계산
      const targetCameraPosition = targetPosition.clone().add(cameraOffset);
      
      // 자동차 위치 변화 감지 로그 제거
      
      // 부드러운 카메라 이동 (X, Z만 따라가고 Y는 고정)
      camera.position.lerp(targetCameraPosition, delta * 5.0);
      
      // 타겟을 바라보도록 설정
      camera.lookAt(targetPosition);
    }
  });

  return null;
}

function Model({ characterRef, gameState, setGameState }) {
  const { scene, animations } = useGLTF('/resources/Ultimate Animated Character Pack - Nov 2019/glTF/BaseCharacter.gltf');
  const { actions } = useAnimations(animations, characterRef);
  
  const { forward, backward, left, right, shift, e } = useKeyboardControls();
  const [currentAnimation, setCurrentAnimation] = useState('none');
  const [isInCar, setIsInCar] = useState(false);
  const [carRef, setCarRef] = useState(null);
  const [carOriginalPosition] = useState(new THREE.Vector3(0, 0, 0));
  const [carOriginalRotation] = useState(new THREE.Euler(0, Math.PI / 2, 0));
  const [isTransitioning, setIsTransitioning] = useState(false); // 상태 전환 중 플래그
  const [frontWheelAngle, setFrontWheelAngle] = useState(0); // 앞바퀴 조향 각도
  const [currentSpeed, setCurrentSpeed] = useState(0); // 현재 속도
  const [targetSpeed, setTargetSpeed] = useState(0); // 목표 속도
  
  // 발걸음 소리를 위한 오디오 시스템
  const stepAudioRef = useRef(null);
  const lastStepTimeRef = useRef(0);
  const stepIntervalRef = useRef(0.5); // 발걸음 간격 (초)
  
  // 자동차 소리를 위한 오디오 시스템
  const carOpenAudioRef = useRef(null);
  const carCloseAudioRef = useRef(null);
  

  
  // 안전한 참조를 위한 useRef
  const safeCharacterRef = useRef();
  const safeCarRef = useRef();
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

  // 자동차 소리 로드 및 재생 함수
  useEffect(() => {
    // 자동차 문 열기 소리 로드
    carOpenAudioRef.current = new Audio('/sounds/opencar.mp3');
    carOpenAudioRef.current.volume = 0.8;
    carOpenAudioRef.current.preload = 'auto';
    
    // 자동차 문 닫기 소리 로드
    carCloseAudioRef.current = new Audio('/sounds/closecar.mp3');
    carCloseAudioRef.current.volume = 0.8;
    carCloseAudioRef.current.preload = 'auto';
    
    // 오디오 로드 확인
    carOpenAudioRef.current.addEventListener('canplaythrough', () => {
      // 자동차 문 열기 소리 로드 완료
    });
    
    carCloseAudioRef.current.addEventListener('canplaythrough', () => {
      // 자동차 문 닫기 소리 로드 완료
    });
    
    carOpenAudioRef.current.addEventListener('error', (e) => {
      console.log('자동차 문 열기 소리 로드 실패:', e);
    });
    
    carCloseAudioRef.current.addEventListener('error', (e) => {
      console.log('자동차 문 닫기 소리 로드 실패:', e);
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

  // 자동차 소리 재생 함수들
  const playCarOpenSound = () => {
    if (carOpenAudioRef.current) {
      carOpenAudioRef.current.currentTime = 0; // 처음부터 재생
      carOpenAudioRef.current.play().catch(e => {
        console.log('자동차 문 열기 소리 재생 실패:', e);
      });
    }
  };

  const playCarCloseSound = () => {
    if (carCloseAudioRef.current) {
      carCloseAudioRef.current.currentTime = 0; // 처음부터 재생
      carCloseAudioRef.current.play().catch(e => {
        console.log('자동차 문 닫기 소리 재생 실패:', e);
      });
    }
  };


  
  // CameraController에서 접근할 수 있도록 characterRef에 저장
  useEffect(() => {
    if (characterRef.current && safeCarRef.current) {
      characterRef.current.safeCarRef = safeCarRef;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeCarRef.current]);

  useEffect(() => {
    if (gameState === 'playing_level2') {
      characterRef.current.position.set(0, 0, 10);
      characterRef.current.scale.set(2, 2, 2);
    }

    // Enable shadows on all meshes in the character model
    if (characterRef.current) {
      characterRef.current.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Model 컴포넌트의 handleSetCarRef 함수를 characterRef에 설정
      characterRef.current.modelHandleSetCarRef = handleSetCarRef;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  useEffect(() => {
    let animToPlay = 'Idle';
    if (gameState === 'playing_level1' || gameState === 'playing_level2') {
      if (!isInCar && (forward || backward || left || right)) {
        animToPlay = shift ? 'Run' : 'Walk';
      }
    } 

    if (currentAnimation !== animToPlay) {
      const oldAction = actions[currentAnimation];
      const newAction = actions[animToPlay];

      if (oldAction) oldAction.fadeOut(0.5);
      if (newAction) {
        newAction.reset().fadeIn(0.5).play();
        // 애니메이션 재생 속도 조정
        if (animToPlay === 'Walk') {
          newAction.timeScale = 1.4; // 걷기 애니메이션 1.5배 빠르게
        } else if (animToPlay === 'Run') {
          newAction.timeScale = 1.3; // 뛰기 애니메이션 1.3배 빠르게
        }
      }

      setCurrentAnimation(animToPlay);
      
      // 걷기/뛰기 애니메이션 시작 시 발걸음 소리 시작
      if (animToPlay === 'Walk' || animToPlay === 'Run') {
        lastStepTimeRef.current = Date.now();
        stepIntervalRef.current = animToPlay === 'Run' ? 0.45 : 0.6; // 더 빠른 발걸음 간격
      }
    }
  }, [forward, backward, left, right, shift, actions, currentAnimation, gameState, isInCar]);

  // E키 상태 추적을 위한 useRef
  const lastEKeyState = useRef(false);
  
  // 자동차 탑승/하차 처리 (useFrame에서 처리)
  const handleCarInteraction = () => {
    // E키가 눌렸을 때만 처리 (상태 변화 감지)
    if (e && !lastEKeyState.current) {
      if (gameState === 'playing_level2' && (characterRef.current?.carRef || safeCarRef.current)) {
        if (!isInCar && !isTransitioning) {
          // 자동차 탑승
          enterCar();
        } else if (isInCar && !isTransitioning) {
          // 자동차 하차
          exitCar();
        }
      }
    }
    
    // E키 상태 업데이트
    lastEKeyState.current = e;
  };

  // carRef 설정 함수
  const handleSetCarRef = (ref) => {
    if (ref && characterRef.current) {
      // 안전한 참조에 저장 (ref는 이미 자동차 모델 자체)
      safeCharacterRef.current = characterRef.current;
      safeCarRef.current = ref;
      
      // characterRef.current에도 저장
      characterRef.current.carRef = ref;
      
      // 상태도 업데이트
      setCarRef(ref);
      
            // 자동차의 월드 위치 계산
      if (ref.position) {
        const worldPosition = new THREE.Vector3();
        ref.getWorldPosition(worldPosition);
        ref.worldPosition = worldPosition;
      }
    }
  };

  const enterCar = () => {
    if (!safeCarRef.current || isInCar || isTransitioning) {
      return;
    }
    
    // 자동차 문 열기 소리 재생
    playCarOpenSound();
    
    // 상태 전환 중 플래그 설정
    setIsTransitioning(true);
    
    // 즉시 탑승 상태 설정
    setIsInCar(true);
    
    // 안전한 참조에 상태 저장
    if (safeCharacterRef.current) {
      safeCharacterRef.current.isInCar = true;
      safeCharacterRef.current.carRef = safeCarRef.current;
      
      // characterRef.current에도 상태 저장
      if (characterRef.current) {
        characterRef.current.isInCar = true;
        characterRef.current.carRef = safeCarRef.current;
      }
    }
    
    // 캐릭터를 자동차 중앙으로 이동
    if (safeCharacterRef.current && safeCarRef.current) {
      const carPosition = safeCarRef.current.position.clone();
      safeCharacterRef.current.position.copy(carPosition);
      
      // 캐릭터 방향을 자동차가 바라보는 방향으로 변경
      safeCharacterRef.current.rotation.y = safeCarRef.current.rotation.y;
      
      // 캐릭터를 자동차 중앙으로 이동 완료
    }
    
    // 상태 전환 완료
    setIsTransitioning(false);
  };

  const exitCar = () => {
    if (!safeCarRef.current || !isInCar || isTransitioning) {
      return;
    }
    
    // 자동차 문 닫기 소리 재생
    playCarCloseSound();
    
    // 상태 전환 중 플래그 설정
    setIsTransitioning(true);
    
    // 즉시 하차 상태 설정
    setIsInCar(false);
    
    // 안전한 참조에 상태 저장
    if (safeCharacterRef.current) {
      safeCharacterRef.current.isInCar = false;
      safeCharacterRef.current.carRef = null;
      
      // characterRef.current에도 상태 제거
      if (characterRef.current) {
        characterRef.current.isInCar = false;
        characterRef.current.carRef = null;
      }
    }
    
    // 자동차를 원래 위치로 복원
    if (safeCarRef.current) {
      safeCarRef.current.position.copy(carOriginalPosition);
      safeCarRef.current.rotation.copy(carOriginalRotation);
    }
    
    // 캐릭터를 자동차 바깥으로 이동
    if (safeCharacterRef.current && safeCarRef.current) {
      const exitPosition = safeCarRef.current.position.clone().add(
        new THREE.Vector3(3, 0, 0).applyEuler(safeCarRef.current.rotation)
      );
      safeCharacterRef.current.position.copy(exitPosition);
    }
    
    // 상태 전환 완료
    setIsTransitioning(false);
    setCurrentSpeed(0); // 속도 초기화
    setTargetSpeed(0); // 목표 속도 초기화
  };

  useFrame((state, delta) => {
    // 자동차 상호작용 처리
    handleCarInteraction();
    
    // characterRef.current 손실 시 safeCharacterRef.current 사용
    const currentCharacter = characterRef.current || safeCharacterRef.current;
    if (!currentCharacter) return;

    if (gameState === 'entering_portal') {
      const portalCenter = portalPosition.clone();
      currentCharacter.position.lerp(portalCenter, delta * 2.0);
      currentCharacter.scale.lerp(new THREE.Vector3(0.01, 0.01, 0.01), delta * 2);

      if (currentCharacter.scale.x < 0.05) { 
        if (gameState !== 'switched') {
          setGameState('playing_level2');
        }
      }
      return;
    }

    if (gameState === 'entering_portal_back_to_level1') {
      // Level1로 바로 이동하고 Level2 포탈 앞에 위치
      currentCharacter.position.copy(level2PortalFrontPosition);
      currentCharacter.scale.set(2, 2, 2);
      setGameState('playing_level1');
      return;
    }

    const isPlaying = gameState === 'playing_level1' || gameState === 'playing_level2';
    if (!isPlaying) return;

    const speed = shift ? 15 : 6; // 물리 기반 속도 (걷기: 3, 뛰기: 5)
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
      if (!isInCar && (currentAnimation === 'Walk' || currentAnimation === 'Run')) {
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

    if (gameState === 'playing_level1') {
      const characterPos = currentCharacter.position.clone();

      // Check Level2 portal
      const portalPos = portalPosition.clone();
      characterPos.y = 0;
      portalPos.y = 0;
      const distanceToPortal = characterPos.distanceTo(portalPos);
      if (distanceToPortal < portalRadius) {
        setGameState('entering_portal');
        return;
      }
    }

    if (gameState === 'playing_level2') {
      if (isInCar && safeCarRef.current) {
        // 자동차 이동 로직 (후륜구동 + 전륜조향 + 가속도 시스템)
        if (safeCarRef.current) {
          const car = safeCarRef.current;
          const maxSpeed = shift ? 1.2 : 0.8; // 최대 속도
          
          // 목표 속도 설정
          let newTargetSpeed = 0;
          if (forward) newTargetSpeed = maxSpeed;
          else if (backward) newTargetSpeed = -maxSpeed;
          
          setTargetSpeed(newTargetSpeed);
          
          // 가속도 적용 (부드러운 가속/감속)
          const acceleration = 0.015; // 가속도 (조금 느리게)
          const deceleration = 0.015; // 감속도 (더 빠르게)
          
          if (Math.abs(newTargetSpeed - currentSpeed) > 0.01) {
            if (newTargetSpeed > currentSpeed) {
              // 가속
              setCurrentSpeed(prev => Math.min(prev + acceleration, newTargetSpeed));
            } else if (newTargetSpeed < currentSpeed) {
              // 감속
              setCurrentSpeed(prev => Math.max(prev - deceleration, newTargetSpeed));
            }
          }
          
          // 현재 속도로 이동 계산
          const speed = currentSpeed;
          
          // 앞바퀴 조향 (A/D키) - 독립적으로 처리 (더 빠르게)
          if (left) {
            setFrontWheelAngle(prev => Math.max(prev - 0.02, -0.2)); // 좌회전 (최대 -0.2, 더 빠르게)
          } else if (right) {
            setFrontWheelAngle(prev => Math.min(prev + 0.02, 0.2)); // 우회전 (최대 0.2, 더 빠르게)
          } else {
            // 중앙으로 복귀 (매우 부드럽게)
            setFrontWheelAngle(prev => {
              if (Math.abs(prev) < 0.01) return 0;
              return prev > 0 ? prev - 0.005 : prev + 0.005;
            });
          }
          
          // 전진/후진 (후륜구동) - 앞바퀴 조향에 따라 회전
          if (Math.abs(speed) > 0.01) { // 속도가 있을 때만 이동
            const moveSpeed = speed; // speed는 이미 방향이 포함됨 (양수: 전진, 음수: 후진)
            
            // 앞바퀴 조향이 있을 때만 회전
            if (Math.abs(frontWheelAngle) > 0.01) {
              // 조향 각도에 따른 회전 (매우 부드럽게)
              const turnSpeed = -frontWheelAngle * moveSpeed * 0.2; // 회전 속도 원래대로
              car.rotation.y += turnSpeed; // 회전 방향 수정
            }
            
            // 차량 이동 (회전된 방향으로)
            car.position.add(car.getWorldDirection(new THREE.Vector3()).multiplyScalar(moveSpeed));
            
            // 바퀴 회전
            if (car.wheels) {
              const wheelSpeed = Math.abs(moveSpeed) * 30;
              
              // 앞바퀴: 조향이 없을 때만 회전 + 조향이 있을 때는 조향만
              if (car.frontWheels) {
                car.frontWheels.forEach(wheel => {
                  // 원래 위치로 복원 (z축 고정)
                  wheel.position.z = wheel.originalPosition.z;
                  
                  // 조향이 거의 없을 때만 회전 처리 (계속 굴러가도록)
                  if (Math.abs(frontWheelAngle) < 0.01 && Math.abs(moveSpeed) > 0.01) {
                    wheel.rotation.x -= wheelSpeed; // 누적 회전 (계속 굴러감)
                  } else {
                    wheel.rotation.x = wheel.originalRotation.x; // 조향이 있으면 원래 위치로
                  }
                  
                  // 조향 처리 (항상 적용)
                  wheel.rotation.y = wheel.originalRotation.y - frontWheelAngle; // y축 조향 (방향 수정)
                });
              }
              
              // 뒷바퀴: 회전만
              if (car.rearWheels) {
                car.rearWheels.forEach(wheel => {
                  wheel.rotation.x -= wheelSpeed;
                });
              }
            }
          } else {
            // 정지 시 앞바퀴만 조향 (z축 고정, y축 조향, 회전 없음)
            if (car.frontWheels) {
              car.frontWheels.forEach(wheel => {
                // 원래 위치로 복원 (z축 고정)
                wheel.position.z = wheel.originalPosition.z;
                
                // 회전은 하지 않고 조향만 처리
                wheel.rotation.x = wheel.originalRotation.x; // 회전하지 않음
                wheel.rotation.y = wheel.originalRotation.y - frontWheelAngle; // y축 조향만
              });
            }
          }
          
          // 자동차에 탑승한 상태에서는 항상 캐릭터를 자동차와 동기화
          if (safeCharacterRef.current && isInCar) {
            safeCharacterRef.current.position.copy(car.position);
            safeCharacterRef.current.rotation.y = car.rotation.y;
          }
          
          // CameraController에서 접근할 수 있도록 속도 정보 저장
          if (safeCharacterRef.current) {
            safeCharacterRef.current.currentSpeed = currentSpeed;
            safeCharacterRef.current.isMoving = Math.abs(currentSpeed) > 0.01;
          }
          

        }
      } else if (safeCharacterRef.current) {
        // 일반 캐릭터 이동
        const characterPos = safeCharacterRef.current.position.clone();
        
        // Check Level2 to Level1 portal
        const portalLevel2ToLevel1Pos = portalLevel2ToLevel1Position.clone();
        characterPos.y = 0;
        portalLevel2ToLevel1Pos.y = 0;
        const distanceToPortalLevel2ToLevel1 = characterPos.distanceTo(portalLevel2ToLevel1Pos);
        if (distanceToPortalLevel2ToLevel1 < portalLevel2ToLevel1Radius) {
          setGameState('entering_portal_back_to_level1');
        }
      }
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      colliders="ball"
      mass={1}
      linearDamping={0.5}
      enabledRotations={[false, true, false]} // Y축 회전만 허용
      position={[0, 2, 0]} // 시작 위치
    >
      <primitive
        ref={characterRef}
        object={scene}
        scale={2}
        castShadow
        receiveShadow
        visible={!isInCar} // 자동차 탑승 시 투명하게
      />
    </RigidBody>
  );
}

function PortalBase(props) {
  const { scene } = useGLTF('/portalbase.glb');
  
  // 포털베이스 모델을 복사해서 각 인스턴스가 독립적으로 작동하도록 함
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
  
  return <primitive object={clonedScene} {...props} />;
}

useGLTF.preload('/portalbase.glb');

// RaceFuture 컴포넌트 추가
function RaceFuture({ onCarRef, characterRef, ...props }) {
  const { scene } = useGLTF('/resources/kenney_car-kit/Models/GLB-format/race-future.glb');
  const carRef = useRef();
  
  const clonedScene = useMemo(() => {
    const cloned = scene.clone();
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    // 바퀴 참조 저장 (앞바퀴와 뒷바퀴 구분)
    cloned.wheels = [];
    cloned.frontWheels = [];
    cloned.rearWheels = [];
    
    cloned.traverse((child) => {
      if (child.name && child.name.includes('wheel')) {
        cloned.wheels.push(child);
        
        // 앞바퀴와 뒷바퀴 구분
        if (child.name.includes('front')) {
          cloned.frontWheels.push(child);
          // 앞바퀴의 원래 위치와 회전 저장 (z축 고정용)
          child.originalPosition = child.position.clone();
          child.originalRotation = child.rotation.clone();
        } else if (child.name.includes('back') || child.name.includes('rear')) {
          cloned.rearWheels.push(child);
        }
      }
    });
    
    // 자동차의 초기 위치 설정
    cloned.position.set(props.position[0], props.position[1], props.position[2]);
    cloned.rotation.set(props.rotation[0], props.rotation[1], props.rotation[2]);
    
    // 바퀴 분류 및 위치 설정 완료

    return cloned;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, props.position, props.rotation]);

  useEffect(() => {
    if (onCarRef && carRef.current && !window.raceFutureInitialized) {
      window.raceFutureInitialized = true; // 전역 플래그로 중복 실행 방지
      console.log('RaceFuture 초기화 시작');
      
      // 즉시 호출하되, characterRef 설정이 완료된 후에만
      const checkAndCall = () => {
        if (characterRef?.current?.handleSetCarRef) {
          onCarRef(clonedScene);
        } else {
          setTimeout(checkAndCall, 50);
        }
      };
      checkAndCall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 의존성 배열을 비워서 한 번만 실행

  // Model 컴포넌트에 carRef 설정 함수 추가
  useEffect(() => {
    if (characterRef?.current && !window.handleSetCarRefSet) {
      window.handleSetCarRefSet = true; // 중복 설정 방지
      
      // Model 컴포넌트의 handleSetCarRef 함수를 직접 호출할 수 있도록 설정
      characterRef.current.handleSetCarRef = (ref) => {
        if (ref) {
          // 바퀴 참조를 ref에 추가
          ref.wheels = clonedScene.wheels;
          ref.frontWheels = clonedScene.frontWheels;
          ref.rearWheels = clonedScene.rearWheels;
          
          // Model 컴포넌트의 handleSetCarRef 함수 직접 호출
          if (characterRef.current.modelHandleSetCarRef) {
            characterRef.current.modelHandleSetCarRef(ref);
          }
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clonedScene.frontWheels, clonedScene.rearWheels]);

  // 실시간으로 월드 위치 업데이트
  useFrame(() => {
    if (carRef.current) {
      // 월드 위치 계산 및 저장
      const worldPosition = new THREE.Vector3();
      carRef.current.getWorldPosition(worldPosition);
      carRef.current.worldPosition = worldPosition;
    }
  });

  return <primitive ref={carRef} object={clonedScene} {...props} />;
}
useGLTF.preload('/resources/kenney_car-kit/Models/GLB-format/race-future.glb');

// PublicSquare 맵 컴포넌트 (물리 충돌 포함)
function PublicSquare(props) {
  const { scene } = useGLTF('/resources/Map/PublicSquare.glb');

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

useGLTF.preload('/resources/Map/PublicSquare.glb');

function Level1({ characterRef }) {
  const waterRef = useRef();

  // 물 애니메이션
  useFrame((state) => {
    if (waterRef.current) {
      waterRef.current.uTime = state.clock.elapsedTime;
    }
  });

  return (
    <>
      <Sky />

      {/* PublicSquare 맵 추가 */}
      <PublicSquare position={[0, 0, 0]} scale={1} />

      <PortalBase position={portalPosition} scale={20} castShadow receiveShadow />
      <PortalVortex position={[-19.7, 8, -22]} scale={[7, 9.8, 1]} castShadow receiveShadow />

      {/* 찰랑거리는 물 바닥 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[500, 500, 100, 100]} />
        <waterMaterial ref={waterRef} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

function Level2({ onCarRef, characterRef }) {
  // level2map.png 텍스처 로드
  const level2Texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const texture = loader.load('/resources/level2map.png');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    return texture;
  }, []);

  return (
    <>
      <Sky />
      
      {/* RaceFuture 자동차 추가 */}
      <RaceFuture 
        position={[0, 0, 0]} 
        scale={5} 
        rotation={[0, Math.PI / 2, 0]} 
        onCarRef={onCarRef}
        characterRef={characterRef}
        castShadow
        receiveShadow
      />
      
      {/* Level1으로 돌아가는 포탈 - 캐릭터 뒤쪽에 배치 */}
      <PortalBase position={[0, 7.5, 23.5]} scale={20} castShadow receiveShadow />
      <PortalVortex position={[0.3, 8, 22]} scale={[7, 9.8, 1]} castShadow receiveShadow />
      
      {/* Floor with level2map.png texture */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial map={level2Texture} />
      </mesh>
    </>
  );
}

function App() {
  const [gameState, setGameState] = useState('playing_level1');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const characterRef = useRef();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { escape } = useKeyboardControls();
  const lastEscapeState = useRef(false);

  // ESC 키로 메뉴 토글
  useEffect(() => {
    if (escape && !lastEscapeState.current && isAuthenticated) {
      setIsMenuOpen((prev) => !prev);
    }
    lastEscapeState.current = escape;
  }, [escape, isAuthenticated]);

  return (
    <div className="App">
      {/* 3D 광장 배경 (항상 렌더링) */}
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
          <Physics gravity={[0, -9.81, 0]} debug>
            {/* 로그인한 경우에만 캐릭터 렌더링 */}
            {isAuthenticated && (
              <Model characterRef={characterRef} gameState={gameState} setGameState={setGameState} />
            )}
            <CameraController gameState={gameState} characterRef={characterRef} />
            <CameraLogger />
            {gameState === 'playing_level2' ? <Level2 onCarRef={(ref) => {
              if (characterRef.current?.handleSetCarRef) {
                characterRef.current.handleSetCarRef(ref);
              }
            }} characterRef={characterRef} /> : <Level1 characterRef={characterRef} />}
          </Physics>
        </Suspense>
      </Canvas>

      {/* 로그인하지 않은 경우 인증 오버레이 표시 */}
      {!isAuthenticated && <AuthOverlay />}

      {/* 게임 메뉴 (ESC로 열기/닫기) */}
      {isAuthenticated && (
        <GameMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      )}
    </div>
  );
}

export default App;