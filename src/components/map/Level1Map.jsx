import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';

/**
 * Level1Map 컴포넌트
 * - PublicSquare.glb 3D 모델 로드
 * - MainCamera 참조 저장
 * - 물리 충돌 처리 (trimesh collider)
 */
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

useGLTF.preload('/resources/GameView/PublicSquare.glb');

export default Level1Map;
