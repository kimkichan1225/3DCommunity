import React from 'react';
import * as THREE from 'three';

/**
 * Sky 컴포넌트
 * - 하늘 배경을 위한 큰 구체
 * - 안쪽이 보이도록 BackSide 사용
 */
function Sky() {
  return (
    <mesh>
      <sphereGeometry args={[400, 32, 32]} />
      <meshBasicMaterial color="#87CEFA" side={THREE.BackSide} />
    </mesh>
  );
}

export default Sky;
