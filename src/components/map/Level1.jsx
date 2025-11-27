import React from 'react';
import Sky from './Sky';
import Level1Map from './Level1Map';

/**
 * Level1 컴포넌트
 * - 레벨 1의 전체 씬 구성
 * - Sky + Level1Map 결합
 */
function Level1({ characterRef, mainCameraRef }) {
  return (
    <>
      <Sky />

      {/* Level1 Map */}
      <Level1Map
        mainCameraRef={mainCameraRef}
        position={[0, 0, 0]}
        scale={1.0}
        rotation={[0, 0, 0]}
        castShadow
        receiveShadow
      />
    </>
  );
}

export default Level1;
