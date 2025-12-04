import React, { useRef } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';

/**
 * MapFloor 컴포넌트
 * - 투명한 물리 바닥면만 제공
 * - Mapbox 지도가 시각적 바닥으로 표시됨
 * - 캐릭터가 지도 위에서 움직일 수 있도록 콜라이더 제공
 */
export default function MapFloor() {
  const floorRef = useRef();

  return (
    <RigidBody 
      ref={floorRef} 
      type="fixed" 
      colliders={false}
      position={[0, 0, 0]}
    >
      {/* 투명한 물리 콜라이더만 - Mapbox 지도가 시각적 역할 담당 */}
      <CuboidCollider 
        args={[2000, 0.1, 2000]}
        position={[0, 0, 0]}
      />
    </RigidBody>
  );
}
