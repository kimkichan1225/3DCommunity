import React, { useState } from 'react';
import Sky from './Sky';
import Level1Map from './Level1Map';
import GameIconTrigger from '../triggers/GameIconTrigger';

/**
 * Level1 컴포넌트
 * - 레벨 1의 전체 씬 구성
 * - Sky + Level1Map 결합
 * - GameIconTrigger 포함 (cliff_block_rock002 위치)
 */
function Level1({ characterRef, mainCameraRef, onGameTriggerEnter, onGameTriggerExit }) {
  const [cliffBlockInfo, setCliffBlockInfo] = useState(null);

  // Level1Map에서 cliff_block_rock002 위치를 받아옴
  const handleCliffBlockFound = (info) => {
    // 이미 설정되어 있으면 중복 실행 방지
    if (!cliffBlockInfo) {
      setCliffBlockInfo(info);
    }
  };

  return (
    <>
      <Sky />

      {/* Level1 Map */}
      <Level1Map
        mainCameraRef={mainCameraRef}
        onCliffBlockFound={handleCliffBlockFound}
        position={[0, 0, 0]}
        scale={1.0}
        rotation={[0, 0, 0]}
        castShadow
        receiveShadow
      />

      {/* Game Icon Trigger - cliff_block_rock002 위치에 동적으로 배치 */}
      {cliffBlockInfo && (
        <GameIconTrigger
          position={[
            cliffBlockInfo.position[0],
            cliffBlockInfo.position[1] + cliffBlockInfo.size[1] / 2 + 2, // 바위 위쪽에 배치
            cliffBlockInfo.position[2]
          ]}
          size={[
            cliffBlockInfo.size[0] * 1.2, // 약간 넓게
            cliffBlockInfo.size[1] + 4, // 높이 여유
            cliffBlockInfo.size[2] * 1.2 // 약간 넓게
          ]}
          onEnter={onGameTriggerEnter}
          onExit={onGameTriggerExit}
          debug={true} // 트리거 영역을 노란색 와이어프레임으로 표시
        />
      )}
    </>
  );
}

export default Level1;
