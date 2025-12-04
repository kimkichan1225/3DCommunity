import React, { useRef } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';

/**
 * MapFloor 컴포넌트
 * - 지도 영역을 물리 바닥면으로 설정
 * - 캐릭터가 이 위에서 움직임
 * - 격자 패턴의 바닥으로 지도 위에 시각적으로 표시
 */
export default function MapFloor() {
  const floorRef = useRef();

  // 격자 캔버스 텍스처 생성
  const createGridTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // 배경 (연한 회색)
    ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
    ctx.fillRect(0, 0, 512, 512);
    
    // 격자 선 (진한 회색)
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
    ctx.lineWidth = 2;
    
    // 작은 격자 (32px)
    for (let i = 0; i <= 512; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
    
    // 큰 격자 (128px)
    ctx.strokeStyle = 'rgba(50, 50, 50, 0.7)';
    ctx.lineWidth = 4;
    
    for (let i = 0; i <= 512; i += 128) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.repeat.set(10, 10);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  };

  return (
    <RigidBody 
      ref={floorRef} 
      type="fixed" 
      colliders={false}
      position={[0, -0.5, 0]}
    >
      {/* 격자 패턴 바닥 메시 - 지도 위에 표시 */}
      <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial 
          map={createGridTexture()}
          metalness={0.2}
          roughness={0.7}
          transparent
          opacity={0.6}
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
