import React from 'react';
import * as THREE from 'three';

// 하늘을 위한 컴포넌트
export default function Sky() {
  return (
    <mesh>
      <sphereGeometry args={[400, 32, 32]} />
      <meshBasicMaterial color="#87CEFA" side={THREE.BackSide} />
    </mesh>
  );
}
