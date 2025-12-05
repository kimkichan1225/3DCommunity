import React, { useRef } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

/**
 * GameIconTrigger 컴포넌트
 * - 특정 위치에 보이지 않는 트리거 영역 생성
 * - 플레이어가 진입하면 onEnter 콜백 호출
 * - 플레이어가 벗어나면 onExit 콜백 호출
 */
function GameIconTrigger({ position = [0, 0, 0], size = [5, 5, 5], onEnter, onExit, debug = false }) {
  const triggerRef = useRef();

  // 충돌 이벤트 핸들러
  const handleIntersectionEnter = (event) => {
    // 플레이어 캡슐 콜라이더와 충돌했는지 확인
    if (onEnter) {
      console.log('🎮 Game trigger entered!');
      onEnter();
    }
  };

  const handleIntersectionExit = (event) => {
    if (onExit) {
      console.log('🎮 Game trigger exited!');
      onExit();
    }
  };

  return (
    <>
      {/* 트리거 영역 - 센서 모드로 물리적 충돌 없이 감지만 수행 */}
      <RigidBody
        ref={triggerRef}
        type="fixed"
        sensor={true} // 센서 모드: 물리적 충돌 없이 감지만
        position={position}
        onIntersectionEnter={handleIntersectionEnter}
        onIntersectionExit={handleIntersectionExit}
      >
        <mesh visible={debug}>
          <boxGeometry args={size} />
          <meshBasicMaterial color="yellow" transparent opacity={0.3} wireframe />
        </mesh>
      </RigidBody>
    </>
  );
}

export default GameIconTrigger;
