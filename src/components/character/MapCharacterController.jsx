import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import { useKeyboardControls } from '../../useKeyboardControls';
import ChatBubble from './ChatBubble';

/**
 * MapCharacterController 컴포넌트
 * - 지도 모드에서만 사용되는 캐릭터 컨트롤러
 * - 지면(MapFloor) 위에서 움직임
 */
function MapCharacterController({
  characterRef,
  isMovementDisabled,
  username,
  userId,
  multiplayerService,
  chatMessage,
  onPositionUpdate,
  modelPath = '/resources/Ultimate Animated Character Pack - Nov 2019/glTF/BaseCharacter.gltf'
}) {
  const { scene, animations } = useGLTF(modelPath);
  const { actions } = useAnimations(animations, characterRef);

  const { forward, backward, left, right, shift } = useKeyboardControls();
  const [currentAnimation, setCurrentAnimation] = useState('none');

  // Multiplayer position update throttle
  const lastPositionUpdateRef = useRef(0);
  const positionUpdateIntervalRef = useRef(100);
  const lastRotationYRef = useRef(0);

  // 발걸음 소리
  const stepAudioRef = useRef(null);
  const lastStepTimeRef = useRef(0);
  const stepIntervalRef = useRef(0.5);

  // 안전한 참조
  const rigidBodyRef = useRef();
  const currentRotationRef = useRef(new THREE.Quaternion());
  const modelGroupRef = useRef();

  useEffect(() => {
    const audioPaths = [
      '/resources/Sounds/Step2.wav',
      '/resources/Sounds/step2.wav',
      '/Sounds/Step2.wav',
      '/resources/Sounds/Step2.mp3',
      '/resources/Sounds/step2.mp3',
      '/Sounds/Step2.mp3'
    ];

    stepAudioRef.current = new Audio(audioPaths[0]);
    stepAudioRef.current.volume = 1.0;
    stepAudioRef.current.preload = 'auto';
  }, []);

  const playStepSound = () => {
    if (stepAudioRef.current) {
      stepAudioRef.current.currentTime = 0;
      stepAudioRef.current.play().catch(() => { });
    }
  };

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

  useEffect(() => {
    let animToPlay = 'none';
    if (forward || backward || left || right) {
      animToPlay = shift ? 'Run' : 'Walk';
    } else {
      animToPlay = 'Idle';
    }

    if (currentAnimation !== animToPlay) {
      const oldAction = actions[currentAnimation];
      const newAction = actions[animToPlay];

      if (oldAction) oldAction.fadeOut(0.5);
      if (newAction) {
        newAction.reset().fadeIn(0.5).play();
      }

      setCurrentAnimation(animToPlay);

      if (animToPlay === 'Walk' || animToPlay === 'Run') {
        lastStepTimeRef.current = Date.now();
        stepIntervalRef.current = animToPlay === 'Run' ? 0.45 : 0.6;
      }
    }
  }, [forward, backward, left, right, shift, actions, currentAnimation]);

  useFrame((state, delta) => {
    if (!rigidBodyRef.current || !modelGroupRef.current) {
      console.warn('⚠️ MapCharacterController useFrame: rigidBodyRef 또는 modelGroupRef가 설정되지 않음');
      return;
    }

    // 이동 비활성화
    if (isMovementDisabled) {
      rigidBodyRef.current.setLinvel({ x: 0, y: rigidBodyRef.current.linvel().y, z: 0 }, true);
      rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      return;
    }

    const speed = shift ? 20 : 10;
    const direction = new THREE.Vector3();

    if (forward) direction.z -= 1;
    if (backward) direction.z += 1;
    if (left) direction.x -= 1;
    if (right) direction.x += 1;

    let targetAngleForNetwork = null;

    if (direction.length() > 0) {
      direction.normalize();

      const targetAngle = Math.atan2(direction.x, direction.z);
      targetAngleForNetwork = targetAngle;

      const targetQuaternion = new THREE.Quaternion();
      targetQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngle);
      currentRotationRef.current.slerp(targetQuaternion, 0.25);

      const velocityX = direction.x * speed;
      const velocityZ = direction.z * speed;
      const currentVel = rigidBodyRef.current.linvel();

      rigidBodyRef.current.setLinvel(
        { x: velocityX, y: currentVel.y, z: velocityZ },
        true
      );

      // 발걸음 소리
      const now = Date.now();
      if (now - lastStepTimeRef.current > stepIntervalRef.current * 1000) {
        playStepSound();
        lastStepTimeRef.current = now;
      }

      lastRotationYRef.current = targetAngle;
    } else {
      // 정지
      const currentVel = rigidBodyRef.current.linvel();
      rigidBodyRef.current.setLinvel(
        { x: 0, y: currentVel.y, z: 0 },
        true
      );
    }

    // 모델 회전 적용
    modelGroupRef.current.quaternion.copy(currentRotationRef.current);

    // 위치 동기화
    const translation = rigidBodyRef.current.translation();
    modelGroupRef.current.position.set(translation.x, translation.y, translation.z);

    // RigidBody 회전을 항상 0으로 고정 (기울임 방지)
    rigidBodyRef.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
    rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

    // 부모 컴포넌트에 위치 업데이트 전달 (지도 중심 이동용)
    if (onPositionUpdate) {
      onPositionUpdate([translation.x, translation.y, translation.z]);
    }

    // 멀티플레이어 위치 업데이트 (100ms마다)
    const now = Date.now();
    if (now - lastPositionUpdateRef.current > positionUpdateIntervalRef.current) {
      lastPositionUpdateRef.current = now;

      if (multiplayerService) {
        const translation = rigidBodyRef.current.translation();
        multiplayerService.sendPositionUpdate(
          [translation.x, translation.y, translation.z],
          targetAngleForNetwork !== null ? targetAngleForNetwork : lastRotationYRef.current,
          currentAnimation
        );
      }
    }
  });

  // 렌더링 시 디버깅 로그
  console.log('MapCharacterController 렌더링:', {
    sceneLoaded: !!scene,
    modelGroupRefSet: !!modelGroupRef,
    rigidBodyRefSet: !!rigidBodyRef
  });

  return (
    <group ref={modelGroupRef} position={[0, 0, 0]}>
      <RigidBody
        ref={rigidBodyRef}
        colliders={false}
        mass={1}
        linearDamping={0.5}
        angularDamping={1.0}
        lockRotation
      >
        <CapsuleCollider args={[1.0, 0.8]} position={[0, 1.0, 0]} />
        <primitive object={scene} scale={2.5} position={[0, 0, 0]} />
      </RigidBody>

      {/* 닉네임 표시 */}
      <Billboard position={[0, 4.2, 0]}>
        <mesh>
          <planeGeometry args={[2, 0.5]} />
          <meshBasicMaterial transparent color="white" />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[1.8, 0.4]} />
          <meshBasicMaterial
            transparent
            map={new THREE.CanvasTexture(
              (() => {
                const canvas = document.createElement('canvas');
                canvas.width = 512;
                canvas.height = 128;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(0, 0, 512, 128);
                ctx.fillStyle = 'white';
                ctx.font = 'bold 80px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(username, 256, 64);
                return canvas;
              })()
            )}
          />
        </mesh>
      </Billboard>

      {/* 채팅 말풍선 */}
      {chatMessage && <ChatBubble message={chatMessage} />}
    </group>
  );
}

export default MapCharacterController;
