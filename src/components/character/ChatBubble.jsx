import React, { useState, useEffect } from 'react';
import { Text, Billboard, RoundedBox } from '@react-three/drei';

/**
 * ChatBubble 컴포넌트
 * - 캐릭터 위에 3D 말풍선을 표시
 * - 일정 시간 후 자동으로 사라짐
 * - Billboard를 사용하여 항상 카메라를 향함
 */
function ChatBubble({ message, position = [0, 8.5, 0], duration = 5000 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration]);

  if (!visible || !message) {
    return null;
  }

  // 메시지 길이에 따라 말풍선 크기 조정
  const messageLength = message.length;
  const bubbleWidth = Math.min(Math.max(messageLength * 0.15, 2), 6);
  const bubbleHeight = 1.2;

  return (
    <Billboard position={position} follow={true} lockX={false} lockY={false} lockZ={false}>
      <group>
        {/* 말풍선 배경 */}
        <RoundedBox
          args={[bubbleWidth, bubbleHeight, 0.1]}
          radius={0.15}
          smoothness={4}
        >
          <meshStandardMaterial color="#ffffff" opacity={0.95} transparent />
        </RoundedBox>

        {/* 말풍선 외곽선 */}
        <RoundedBox
          args={[bubbleWidth + 0.05, bubbleHeight + 0.05, 0.08]}
          radius={0.15}
          smoothness={4}
          position={[0, 0, -0.02]}
        >
          <meshStandardMaterial color="#333333" opacity={0.8} transparent />
        </RoundedBox>

        {/* 말풍선 꼬리 (작은 삼각형) */}
        <mesh position={[0, -bubbleHeight / 2 - 0.2, 0]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.2, 0.4, 3]} />
          <meshStandardMaterial color="#ffffff" opacity={0.95} transparent />
        </mesh>

        {/* 텍스트 */}
        <Text
          position={[0, 0, 0.1]}
          fontSize={0.4}
          color="#222222"
          anchorX="center"
          anchorY="middle"
          maxWidth={bubbleWidth - 0.4}
          textAlign="center"
          fontWeight="500"
        >
          {message}
        </Text>
      </group>
    </Billboard>
  );
}

export default ChatBubble;
