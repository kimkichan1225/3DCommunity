import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * CameraController 컴포넌트
 * - 캐릭터 또는 MainCamera를 따라다니는 카메라 제어
 * - 로그인 전: MainCamera 추적
 * - 로그인 후: Character 추적
 * - 방 경계 감지 및 카메라 충돌 방지 (벽 밖이 보이지 않도록)
 */
function CameraController({ characterRef, mainCameraRef, isLoggedIn, inPersonalRoom = false }) {
  const { camera, raycaster } = useThree();
  const cameraOffset = new THREE.Vector3(-0.00, 28.35, 19.76); // 고정된 카메라 오프셋
  const targetPositionRef = useRef(new THREE.Vector3());

  // 방 경계 (개인 방용)
  const ROOM_BOUNDS = {
    minX: -19.5,
    maxX: 19.5,
    minZ: -19.5,
    maxZ: 19.5,
    minY: 1,
    maxY: 40,
  };

  /**
   * 카메라 위치를 방 경계 내로 제한
   */
  const clampCameraToRoom = (position) => {
    if (!inPersonalRoom) return position;

    return new THREE.Vector3(
      Math.max(ROOM_BOUNDS.minX, Math.min(ROOM_BOUNDS.maxX, position.x)),
      Math.max(ROOM_BOUNDS.minY, Math.min(ROOM_BOUNDS.maxY, position.y)),
      Math.max(ROOM_BOUNDS.minZ, Math.min(ROOM_BOUNDS.maxZ, position.z))
    );
  };

  /**
   * 카메라와 캐릭터 사이에 벽이 있는지 레이캐스팅으로 확인
   */
  const checkWallCollision = (characterPos, cameraPos) => {
    if (!inPersonalRoom) return { hasCollision: false, distance: 0 };

    const direction = new THREE.Vector3().subVectors(cameraPos, characterPos).normalize();
    const distance = characterPos.distanceTo(cameraPos);

    // 캐릭터에서 카메라 방향으로 레이 발사
    raycaster.set(characterPos, direction);
    raycaster.far = distance;

    // 간단한 벽 충돌 감지 (카메라가 방 경계에 너무 가까우면 충돌로 간주)
    const margin = 3; // 벽으로부터의 안전 거리
    const isNearWall = 
      cameraPos.x < ROOM_BOUNDS.minX + margin ||
      cameraPos.x > ROOM_BOUNDS.maxX - margin ||
      cameraPos.z < ROOM_BOUNDS.minZ + margin ||
      cameraPos.z > ROOM_BOUNDS.maxZ - margin;

    if (isNearWall) {
      // 벽에 가까우면 줌인 필요
      const safeDistance = distance * 0.6; // 원래 거리의 60%로 줌인
      return { hasCollision: true, distance: safeDistance };
    }

    return { hasCollision: false, distance: distance };
  };

  useFrame((state, delta) => {
    // 로그인 후: 캐릭터를 따라감
    if (isLoggedIn && characterRef.current) {
      // 월드 position 가져오기
      const worldPosition = new THREE.Vector3();
      characterRef.current.getWorldPosition(worldPosition);

      // 타겟 위치를 부드럽게 보간 (떨림 방지)
      targetPositionRef.current.lerp(worldPosition, delta * 10.0);

      // 타겟 위치에 오프셋을 더해서 카메라 위치 계산
      let targetCameraPosition = targetPositionRef.current.clone().add(cameraOffset);

      // 개인 방에서는 벽 충돌 감지 및 카메라 조정
      if (inPersonalRoom) {
        const collision = checkWallCollision(targetPositionRef.current, targetCameraPosition);
        
        if (collision.hasCollision) {
          // 벽이 감지되면 카메라를 캐릭터 쪽으로 이동 (줌인)
          const direction = new THREE.Vector3()
            .subVectors(targetCameraPosition, targetPositionRef.current)
            .normalize();
          targetCameraPosition = targetPositionRef.current.clone()
            .add(direction.multiplyScalar(collision.distance));
        }

        // 카메라 위치를 방 경계 내로 제한
        targetCameraPosition = clampCameraToRoom(targetCameraPosition);
      }

      // 부드러운 카메라 이동
      camera.position.lerp(targetCameraPosition, delta * 5.0);

      // 고정된 각도 유지 (lookAt 제거)
      // camera.lookAt(targetPositionRef.current);
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

      // 고정된 각도 유지 (lookAt 제거)
      // camera.lookAt(targetPositionRef.current);
    }
  });

  return null;
}

export default CameraController;
