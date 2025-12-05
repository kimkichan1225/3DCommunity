import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import { useKeyboardControls } from '../../useKeyboardControls';
import ChatBubble from './ChatBubble';

/**
 * Character 컴포넌트
 * - 플레이어 캐릭터 모델 및 애니메이션 관리
 * - 물리 기반 이동 및 충돌 처리
 * - 발걸음 소리 재생
 * - 닉네임 표시
 * - 멀티플레이어 위치 동기화
 * - 채팅 말풍선 표시
 */
function Character({ characterRef, initialPosition, isMovementDisabled, username, userId, multiplayerService, isMapFull = false, onPositionUpdate, chatMessage }) {
  const { scene, animations } = useGLTF('/resources/Ultimate Animated Character Pack - Nov 2019/glTF/BaseCharacter.gltf');
  const { actions } = useAnimations(animations, characterRef);

  const { forward, backward, left, right, shift } = useKeyboardControls();
  const [currentAnimation, setCurrentAnimation] = useState('none');

  // Multiplayer position update throttle
  const lastPositionUpdateRef = useRef(0);
  const positionUpdateIntervalRef = useRef(100); // Update every 100ms (10 times per second)
  const lastRotationYRef = useRef(0); // 마지막 회전 각도 저장 (idle 시 사용)

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

  // initialPosition이 변경되면 RigidBody 위치 업데이트 (지도 모드에서는 제외)
  useEffect(() => {
    if (initialPosition && rigidBodyRef.current && modelGroupRef.current && !isMapFull) {
      const [x, y, z] = initialPosition;
      const currentPos = rigidBodyRef.current.translation();
      
      // 위치 차이 계산
      const dx = currentPos.x - x;
      const dy = currentPos.y - y;
      const dz = currentPos.z - z;
      const distanceSq = dx * dx + dy * dy + dz * dz;
      
      // 거리가 0.1보다 크면 위치 복구
      if (distanceSq > 0.01) {
        console.log('🔄 위치 복귀 시작:', initialPosition, '→', [currentPos.x, currentPos.y, currentPos.z]);
        
        // 물리 엔진에서 위치 설정
        rigidBodyRef.current.setTranslation(
          { x, y, z },
          true // wake - 절대 필요!
        );
        
        // 모델도 즉시 동기화
        if (modelGroupRef.current) {
          modelGroupRef.current.position.set(x, y, z);
        }
        
        // 속도 초기화 (중요)
        rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
        
        console.log('✅ 위치 복귀 완료:', initialPosition);
      }
    }
  }, [initialPosition, isMapFull]);

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

    const speed = shift ? 20 : 10; // 물리 기반 속도 (걷기: 10, 뛰기: 20)
    const direction = new THREE.Vector3();

    if (forward) direction.z -= 1;
    if (backward) direction.z += 1;
    if (left) direction.x -= 1;
    if (right) direction.x += 1;

    let targetAngleForNetwork = null; // 네트워크 전송용 각도 저장

    if (direction.length() > 0) {
      direction.normalize();

      // 회전 처리 - 부드럽게 회전 (모델만)
      const targetAngle = Math.atan2(direction.x, direction.z);
      targetAngleForNetwork = targetAngle; // 네트워크 전송용으로 저장

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

    // 위치가 업데이트되면 부모 컴포넌트에 알림 (Level1 위치 저장용)
    if (onPositionUpdate) {
      onPositionUpdate([rbPosition.x, rbPosition.y, rbPosition.z]);
    }

    // 모델의 회전은 입력에 의한 회전만 적용
    modelGroupRef.current.quaternion.copy(currentRotationRef.current);

    // Send position updates to multiplayer service (throttled)
    if (multiplayerService && userId) {
      const currentTime = Date.now();
      if (currentTime - lastPositionUpdateRef.current > positionUpdateIntervalRef.current) {
        // Use target angle if moving, otherwise use last known rotation
        let rotationY;
        if (targetAngleForNetwork !== null) {
          rotationY = targetAngleForNetwork;
          lastRotationYRef.current = rotationY; // 이동 중일 때 마지막 각도 저장
        } else {
          rotationY = lastRotationYRef.current; // idle 시 마지막 각도 유지
        }

        // Determine animation state
        let animState = 'idle';
        if (currentAnimation === 'Walk') animState = 'walk';
        else if (currentAnimation === 'Run') animState = 'run';

        multiplayerService.sendPositionUpdate(
          [rbPosition.x, rbPosition.y, rbPosition.z],
          rotationY,
          animState
        );

        lastPositionUpdateRef.current = currentTime;
      }
    }
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

        {/* 채팅 말풍선 */}
        {chatMessage && (
          <ChatBubble message={chatMessage} position={[0, 8.5, 0]} duration={5000} />
        )}
      </group>
    </>
  );
}

useGLTF.preload('/resources/Ultimate Animated Character Pack - Nov 2019/glTF/BaseCharacter.gltf');

export default Character;
