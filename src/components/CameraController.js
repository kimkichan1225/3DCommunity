import { useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function CameraController({ characterRef, mainCameraRef, isLoggedIn }) {
  const { camera } = useThree();
  const cameraOffset = new THREE.Vector3(-0.00, 28.35, 19.76); // 고정된 카메라 오프셋
  const targetPositionRef = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    // 로그인 후: 캐릭터를 따라감
    if (isLoggedIn && characterRef.current) {
      // 월드 position 가져오기
      const worldPosition = new THREE.Vector3();
      characterRef.current.getWorldPosition(worldPosition);

      // 타겟 위치를 부드럽게 보간 (떨림 방지)
      targetPositionRef.current.lerp(worldPosition, delta * 10.0);

      // 타겟 위치에 고정된 오프셋을 더해서 카메라 위치 계산
      const targetCameraPosition = targetPositionRef.current.clone().add(cameraOffset);

      // 부드러운 카메라 이동 (속도 감소)
      camera.position.lerp(targetCameraPosition, delta * 3.0);

      // 타겟을 바라보도록 설정
      camera.lookAt(targetPositionRef.current);
    }
    // 로그인 전: MainCamera를 따라감
    else if (!isLoggedIn && mainCameraRef.current) {
      // MainCamera의 월드 position 가져오기
      const worldPosition = new THREE.Vector3();
      mainCameraRef.current.getWorldPosition(worldPosition);

      // 타겟 위치를 부드럽게 보간 (떨림 방지)
      targetPositionRef.current.lerp(worldPosition, delta * 10.0);

      // 타겟 위치에 고정된 오프셋을 더해서 카메라 위치 계산
      const targetCameraPosition = targetPositionRef.current.clone().add(cameraOffset);

      // 부드러운 카메라 이동 (속도 감소)
      camera.position.lerp(targetCameraPosition, delta * 3);

      // 타겟을 바라보도록 설정
      camera.lookAt(targetPositionRef.current);
    }
  });

  return null;
}
