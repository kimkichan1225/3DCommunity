import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useKeyboardControls } from '../../useKeyboardControls';

/**
 * CameraLogger 컴포넌트
 * - C 키를 누르면 현재 카메라 위치와 회전을 콘솔에 출력
 * - 개발 디버깅용
 */
function CameraLogger() {
  const { log } = useKeyboardControls();
  const { camera } = useThree();
  const logRef = useRef(false);

  useEffect(() => {
    // Log only when 'c' is pressed (rising edge)
    if (log && !logRef.current) {
      const pos = camera.position.toArray().map(p => p.toFixed(2));
      const rot = camera.rotation.toArray().slice(0, 3).map(r => r.toFixed(2)); // Fixed: slice to get only numbers
      console.log(`Camera Position: [${pos.join(', ')}]`);
      console.log(`Camera Rotation: [${rot.join(', ')}]`);
    }
    logRef.current = log;
  }, [log, camera]);

  return null;
}

export default CameraLogger;
