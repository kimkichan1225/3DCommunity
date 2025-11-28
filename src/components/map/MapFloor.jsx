import React, { useRef } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';

/**
 * MapFloor 컴포넌트
 * - 지도 영역을 물리 바닥면으로 설정
 * - 캐릭터가 이 위에서 움직임
 * - 투명한 바닥으로 시각적으로 지도가 보이도록 함
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
      {/* 반투명 바닥 메시 - 지도가 보이도록 투명하게 */}
      <mesh receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial 
          color="#ffffff"
          metalness={0.1}
          roughness={0.8}
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 물리 충돌 콜라이더 - 캐릭터가 서 있을 수 있도록 */}
      <CuboidCollider 
        args={[1000, 0.5, 1000]} 
        position={[0, 0, 0]}
      />
    </RigidBody>
  );
}
