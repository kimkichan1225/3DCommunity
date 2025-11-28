import React, { useRef, useEffect, useMemo } from 'react';
import { useGLTF, useAnimations, Text } from '@react-three/drei';

function OtherPlayer({ userId, username, position, rotationY, animation }) {
  const groupRef = useRef();
  const modelRef = useRef();
  const { scene, animations } = useGLTF('/resources/Ultimate Animated Character Pack - Nov 2019/glTF/BaseCharacter.gltf');

  // Clone scene to avoid sharing geometry between instances
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

  const { actions } = useAnimations(animations, modelRef);

  // Set model ref after primitive is mounted
  useEffect(() => {
    if (clonedScene) {
      modelRef.current = clonedScene;
    }
  }, [clonedScene]);

  // Update rotation
  useEffect(() => {
    if (clonedScene && rotationY !== undefined) {
      clonedScene.rotation.y = rotationY;
    }
  }, [clonedScene, rotationY]);

  // Update animation
  useEffect(() => {
    if (!actions) return;

    const animationMap = {
      idle: 'Idle',
      walk: 'Walk',
      run: 'Walk'
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
    <group ref={groupRef} position={position || [0, 0, 0]}>
      {/* Character model */}
      <primitive
        object={clonedScene}
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
