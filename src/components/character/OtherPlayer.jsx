import React, { useRef, useEffect } from 'react';
import { useGLTF, useAnimations, Text, Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { SkeletonUtils } from 'three-stdlib';
import * as THREE from 'three';
import ChatBubble from './ChatBubble';

const OtherPlayer = React.memo(function OtherPlayer({ userId, username, position, rotationY, animation, chatMessage, onRightClick, modelPath = '/resources/Ultimate Animated Character Pack - Nov 2019/glTF/BaseCharacter.gltf', isChangingAvatar = false }) {
  const groupRef = useRef();
  const modelRef = useRef();
  const targetPosition = useRef(position || [0, 0, 0]);
  const targetRotation = useRef(rotationY || 0);

  const { scene, animations } = useGLTF(modelPath);

  // Clone with SkeletonUtils to properly clone skinned meshes
  const clone = React.useMemo(() => {
    const cloned = SkeletonUtils.clone(scene);
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return cloned;
  }, [scene]);

  const { actions } = useAnimations(animations, modelRef);

  // Initialize position on mount
  useEffect(() => {
    if (groupRef.current && position) {
      groupRef.current.position.set(position[0], position[1], position[2]);
    }
  }, []); // Run only once on mount

  // Update target position when network data arrives
  useEffect(() => {
    if (position) {
      targetPosition.current = position;
    }
  }, [position]);

  // Update target rotation when network data arrives
  useEffect(() => {
    if (rotationY !== undefined) {
      targetRotation.current = rotationY;
    }
  }, [rotationY]);

  // Smooth interpolation in render loop
  useFrame((state, delta) => {
    if (!groupRef.current || !modelRef.current) return;

    // Lerp position (smooth movement)
    const lerpFactor = Math.min(delta * 10, 1); // Adjust speed with delta * 10
    groupRef.current.position.lerp(
      new THREE.Vector3(targetPosition.current[0], targetPosition.current[1], targetPosition.current[2]),
      lerpFactor
    );

    // Slerp rotation (smooth rotation)
    const currentQuat = new THREE.Quaternion().setFromEuler(modelRef.current.rotation);
    const targetQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetRotation.current);
    currentQuat.slerp(targetQuat, lerpFactor);
    modelRef.current.rotation.setFromQuaternion(currentQuat);
  });

  // Update animation
  useEffect(() => {
    if (!actions) return;

    const animationMap = {
      idle: 'Idle',
      walk: 'Walk',
      run: 'Run',
      jump: 'Jump'
    };

    const animationName = animationMap[animation] || 'Idle';

    // Stop all animations
    Object.values(actions).forEach((action) => {
      if (action) action.stop();
    });

    // Play current animation
    if (actions[animationName]) {
      actions[animationName].reset().fadeIn(0.2).play();
    }
  }, [animation, actions]);

  // 우클릭 핸들러
  const handleContextMenu = (event) => {
    event.stopPropagation();
    if (onRightClick) {
      onRightClick(event, { userId, username });
    }
  };

  return (
    <group ref={groupRef} onContextMenu={handleContextMenu}>
      {isChangingAvatar ? (
        /* 아바타 변경 중일 때 하늘색 구 표시 */
        <mesh position={[0, 3, 0]}>
          <sphereGeometry args={[2, 32, 32]} />
          <meshStandardMaterial
            color="#60a5fa"
            transparent={true}
            opacity={0.7}
            emissive="#60a5fa"
            emissiveIntensity={0.3}
          />
        </mesh>
      ) : (
        /* 일반 캐릭터 모델 */
        <primitive
          ref={modelRef}
          object={clone}
          scale={2}
        />
      )}

      {/* Name tag above player */}
      {username && (
        <Billboard position={[0, 7, 0]} follow={true} lockX={false} lockY={false} lockZ={false}>
          <Text
            fontSize={0.6}
            color="#60a5fa"
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
  );
}, (prevProps, nextProps) => {
  // 커스텀 비교 함수: 이 props들이 변경되지 않았으면 리렌더링하지 않음
  return (
    prevProps.userId === nextProps.userId &&
    prevProps.username === nextProps.username &&
    prevProps.position?.[0] === nextProps.position?.[0] &&
    prevProps.position?.[1] === nextProps.position?.[1] &&
    prevProps.position?.[2] === nextProps.position?.[2] &&
    prevProps.rotationY === nextProps.rotationY &&
    prevProps.animation === nextProps.animation &&
    prevProps.chatMessage === nextProps.chatMessage &&
    prevProps.modelPath === nextProps.modelPath &&
    prevProps.isChangingAvatar === nextProps.isChangingAvatar
  );
});

// Preload the model
useGLTF.preload('/resources/Ultimate Animated Character Pack - Nov 2019/glTF/BaseCharacter.gltf');

export default OtherPlayer;
