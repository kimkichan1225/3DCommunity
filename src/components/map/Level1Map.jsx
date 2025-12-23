import React, { useMemo, useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

/**
 * Level1Map 컴포넌트
 * - PublicSquare.glb 3D 모델 로드
 * - MainCamera 참조 저장
 * - 물리 충돌 처리 (trimesh collider)
 * - cliff_block_rock002 위치 정보 전달
 */
function Level1Map({ mainCameraRef, onCliffBlockFound, ...props }) {
  const { scene } = useGLTF('/resources/GameView/PublicSquare-v2.glb');
  const cliffInfoSentRef = useRef(false); // 전역 플래그로 완전히 한 번만 실행
  const cliffDataRef = useRef(null); // cliff 데이터 임시 저장

  // Level1Map 모델을 복사해서 각 인스턴스가 독립적으로 작동하도록 함
  const clonedScene = useMemo(() => {
    const cloned = scene.clone();

    // MainCamera 및 cliff_block_rock002 찾기
    cloned.traverse((child) => {
      if (child.name === 'MainCamera') {
        if (mainCameraRef) {
          mainCameraRef.current = child;
        }
      }

      // cliff_block_rock002 찾기 (한 번만 실행)
      if (child.name === 'cliff_block_rock002' && !cliffDataRef.current) {
        // 월드 위치 계산
        const worldPosition = new THREE.Vector3();
        child.getWorldPosition(worldPosition);

        // BoundingBox 계산
        let bboxSize = new THREE.Vector3(10, 5, 10); // 기본값
        if (child.geometry) {
          child.geometry.computeBoundingBox();
          const bbox = child.geometry.boundingBox;

          // BoundingBox 크기 계산 (스케일 반영)
          bboxSize = new THREE.Vector3();
          bbox.getSize(bboxSize);
          bboxSize.multiply(child.scale); // 스케일 적용
        }

        // 데이터 저장 (렌더링 중에는 state 업데이트 안 함)
        cliffDataRef.current = {
          position: worldPosition.toArray(),
          size: bboxSize.toArray()
        };
      }

      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return cloned;
  }, [scene, mainCameraRef]);

  // useEffect로 안전하게 부모 컴포넌트에 데이터 전달
  useEffect(() => {
    if (cliffDataRef.current && onCliffBlockFound && !cliffInfoSentRef.current) {
      cliffInfoSentRef.current = true;
      console.log('🪨 cliff_block_rock002 트리거 설정 완료');
      onCliffBlockFound(cliffDataRef.current);
    }
  }, [onCliffBlockFound]);

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <primitive object={clonedScene} {...props} />
    </RigidBody>
  );
}

useGLTF.preload('/resources/GameView/PublicSquare-v2.glb');

export default Level1Map;
