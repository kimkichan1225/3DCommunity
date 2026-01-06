import React, { useState, useEffect } from 'react';
import { Text, Billboard, RoundedBox } from '@react-three/drei';

/**
 * ChatBubble 컴포넌트
 * - 캐릭터 위에 3D 말풍선을 표시
 * - 일정 시간 후 자동으로 사라짐
 * - Billboard를 사용하여 항상 카메라를 향함
 */
const ChatBubble = React.memo(function ChatBubble({ message, position = [0, 8.5, 0], duration = 5000 }) {
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

  // 메시지 길이에 따라 말풍선 크기 동적 조정
  const messageLength = message.length;

  // 글자 수에 따른 너비 계산 (한글은 약 2배 넓이)
  const charWidth = 0.12;
  const minWidth = 1.2;
  const maxWidth = 4;
  const bubbleWidth = Math.min(Math.max(messageLength * charWidth, minWidth), maxWidth);

  // 줄 수 계산
  const charsPerLine = Math.floor(maxWidth / charWidth);
  const estimatedLines = Math.ceil(messageLength / charsPerLine);
  const lineHeight = 0.35;
  const bubbleHeight = Math.max(0.6, Math.min(estimatedLines * lineHeight + 0.3, 2));

  // 폰트 크기
  const fontSize = 0.22;

  return (
    <Billboard position={position} follow={true} lockX={false} lockY={false} lockZ={false}>
      <group>
        {/* 말풍선 외곽선 (그림자 효과) */}
        <RoundedBox
          args={[bubbleWidth + 0.08, bubbleHeight + 0.08, 0.05]}
          radius={0.18}
          smoothness={8}
          position={[0, 0, -0.03]}
        >
          <meshBasicMaterial color="#1a1a1a" opacity={0.3} transparent />
        </RoundedBox>

        {/* 말풍선 배경 */}
        <RoundedBox
          args={[bubbleWidth, bubbleHeight, 0.05]}
          radius={0.15}
          smoothness={8}
        >
          <meshBasicMaterial color="#ffffff" />
        </RoundedBox>

        {/* 말풍선 꼬리 */}
        <mesh position={[0, -bubbleHeight / 2 - 0.12, 0]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.12, 0.2, 3]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* 꼬리 그림자 */}
        <mesh position={[0.02, -bubbleHeight / 2 - 0.14, -0.02]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.13, 0.22, 3]} />
          <meshBasicMaterial color="#1a1a1a" opacity={0.2} transparent />
        </mesh>

        {/* 텍스트 */}
        <Text
          position={[0, 0, 0.04]}
          fontSize={fontSize}
          color="#333333"
          anchorX="center"
          anchorY="middle"
          maxWidth={bubbleWidth - 0.3}
          textAlign="center"
          lineHeight={1.3}
          whiteSpace="normal"
          overflowWrap="break-word"
        >
          {message}
        </Text>
      </group>
    </Billboard>
  );
});

export default ChatBubble;
