import React, { useRef, useEffect } from 'react';
import { useGLTF, useAnimations, Text } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';

function OtherPlayer({ userId, username, position, rotationY, animation }) {
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

  return (
    <group ref={groupRef}>
      <primitive
        ref={modelRef}
        object={clone}
        scale={2}
      />

      {/* Name tag above player */}
      <Text
        position={[0, 5, 0]}
        fontSize={0.5}
        color="#60a5fa"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {username}
      </Text>
    </group>
  );
}

// Preload the model
useGLTF.preload('/resources/Ultimate Animated Character Pack - Nov 2019/glTF/BaseCharacter.gltf');

export default OtherPlayer;
