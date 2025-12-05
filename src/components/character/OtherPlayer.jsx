import React, { useRef, useEffect } from 'react';
import { useGLTF, useAnimations, Text, Billboard } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import ChatBubble from './ChatBubble';

function OtherPlayer({ userId, username, position, rotationY, animation, chatMessage, onRightClick }) {
  const groupRef = useRef();
  const modelRef = useRef();

  const { scene, animations } = useGLTF('/resources/Ultimate Animated Character Pack - Nov 2019/glTF/BaseCharacter.gltf');

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

  // Update position
  useEffect(() => {
    if (groupRef.current && position) {
      groupRef.current.position.set(position[0], position[1], position[2]);
    }
  }, [position]);

  // Update rotation
  useEffect(() => {
    if (modelRef.current && rotationY !== undefined) {
      modelRef.current.rotation.y = rotationY;
    }
  }, [rotationY]);

  // Update animation
  useEffect(() => {
    if (!actions) return;

    const animationMap = {
      idle: 'Idle',
      walk: 'Walk',
      run: 'Run'
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
      <primitive
        ref={modelRef}
        object={clone}
        scale={2}
      />

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
}

// Preload the model
useGLTF.preload('/resources/Ultimate Animated Character Pack - Nov 2019/glTF/BaseCharacter.gltf');

export default OtherPlayer;
