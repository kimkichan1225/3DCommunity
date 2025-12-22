import React from 'react';
import { Text, Billboard, RoundedBox } from '@react-three/drei';

/**
 * RoomInfoBubble 컴포넌트
 * - 캐릭터 위에 미니게임 방 정보를 3D 말풍선으로 표시
 * - 방 이름과 게임 종류를 표시
 * - Billboard를 사용하여 항상 카메라를 향함
 */
function RoomInfoBubble({ roomName, gameName, position = [0, 10, 0] }) {
  console.log('🎮 [RoomInfoBubble] 렌더링:', { roomName, gameName, position });

  if (!roomName || !gameName) {
    console.log('🎮 [RoomInfoBubble] 렌더링 취소 - 데이터 없음');
    return null;
  }

  // 방 이름 길이에 따라 말풍선 크기 동적 조정
  const roomNameLength = roomName.length;
  const gameNameLength = gameName.length;
  const maxLength = Math.max(roomNameLength, gameNameLength);

  // 최대 너비 설정 (크게 증가)
  const maxWidth = 12;

  // 글자 수에 따른 너비 계산 (크게 증가)
  const bubbleWidth = Math.min(Math.max(maxLength * 0.4, 5), maxWidth);

  // 두 줄이므로 높이 (크게 증가)
  const bubbleHeight = 2.0;

  // 폰트 크기 (크게 증가)
  const fontSize = 0.6;

  return (
    <Billboard position={position} follow={true} lockX={false} lockY={false} lockZ={false}>
      <group>
        {/* 말풍선 배경 (밝은 빨간색 - 테스트용) */}
        <RoundedBox
          args={[bubbleWidth, bubbleHeight, 0.1]}
          radius={0.15}
          smoothness={4}
        >
          <meshStandardMaterial color="#FF0000" opacity={1.0} transparent={false} />
        </RoundedBox>

        {/* 말풍선 외곽선 (검은색) */}
        <RoundedBox
          args={[bubbleWidth + 0.1, bubbleHeight + 0.1, 0.08]}
          radius={0.15}
          smoothness={4}
          position={[0, 0, -0.02]}
        >
          <meshStandardMaterial color="#000000" opacity={1.0} transparent={false} />
        </RoundedBox>

        {/* 말풍선 꼬리 (작은 삼각형) */}
        <mesh position={[0, -bubbleHeight / 2 - 0.2, 0]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.2, 0.4, 3]} />
          <meshStandardMaterial color="#FFE66D" opacity={0.95} transparent />
        </mesh>

        {/* 방 이름 텍스트 */}
        <Text
          position={[0, 0.25, 0.1]}
          fontSize={fontSize}
          color="#2C3E50"
          anchorX="center"
          anchorY="middle"
          maxWidth={bubbleWidth - 0.5}
          textAlign="center"
          fontWeight="bold"
          lineHeight={1.2}
          whiteSpace="nowrap"
          overflowWrap="break-word"
        >
          {roomName}
        </Text>

        {/* 게임 종류 텍스트 */}
        <Text
          position={[0, -0.25, 0.1]}
          fontSize={fontSize * 0.85}
          color="#34495E"
          anchorX="center"
          anchorY="middle"
          maxWidth={bubbleWidth - 0.5}
          textAlign="center"
          fontWeight="500"
          lineHeight={1.2}
          whiteSpace="nowrap"
          overflowWrap="break-word"
        >
          {`🎮 ${gameName}`}
        </Text>
      </group>
    </Billboard>
  );
}

export default RoomInfoBubble;
