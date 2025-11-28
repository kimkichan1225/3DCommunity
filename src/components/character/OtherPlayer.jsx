import React, { useRef, useEffect, useMemo } from 'react';
import { useGLTF, useAnimations, Text } from '@react-three/drei';

function OtherPlayer({ userId, username, position, rotationY, animation }) {
  const groupRef = useRef();
  const modelGroupRef = useRef();
  const { scene, animations } = useGLTF('/resources/Ultimate Animated Character Pack - Nov 2019/glTF/BaseCharacter.gltf');
  const { actions } = useAnimations(animations, modelGroupRef);

  // Clone scene to avoid sharing geometry between instances
  const clonedScene = useMemo(() => {
    const cloned = scene.clone();
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    console.log(`[OtherPlayer] Model cloned for ${username}`, cloned);
    return cloned;
  }, [scene, username]);

  // Debug log on mount
  useEffect(() => {
    console.log(`[OtherPlayer] Mounted: ${username}`, { position, rotationY, animation });
  }, []);

  // Update rotation
  useEffect(() => {
    if (modelGroupRef.current && rotationY !== undefined) {
      modelGroupRef.current.rotation.y = rotationY;
    }
  }, [rotationY]);

  // Update animation
  useEffect(() => {
    if (!actions || !modelGroupRef.current) return;

    // Wait for the model to be fully mounted
    const timer = setTimeout(() => {
      // Stop all animations
      Object.values(actions).forEach((action) => {
        try {
          action.stop();
        } catch (e) {
          // Ignore errors
        }
      });

      // Play current animation
      const animationMap = {
        idle: 'Idle',
        walk: 'Walk',
        run: 'Walk' // Use walk animation for run (or add a run animation if available)
      };

      const animationName = animationMap[animation] || 'Idle';
      if (actions[animationName]) {
        try {
          actions[animationName].reset().play();
        } catch (e) {
          console.warn(`Failed to play animation ${animationName}:`, e);
        }
      }
    }, 100); // Small delay to ensure model is ready

    return () => clearTimeout(timer);
  }, [animation, actions]);

  // Add cloned scene to ref
  useEffect(() => {
    if (modelGroupRef.current && clonedScene) {
      modelGroupRef.current.add(clonedScene);
      console.log(`[OtherPlayer] Scene added to group for ${username}`);

      return () => {
        if (modelGroupRef.current) {
          modelGroupRef.current.remove(clonedScene);
        }
      };
    }
  }, [clonedScene, username]);

  return (
    <group ref={groupRef} position={position || [0, 0, 0]}>
      <group ref={modelGroupRef} scale={2} />

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
