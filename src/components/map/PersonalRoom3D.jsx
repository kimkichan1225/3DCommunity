import React, { useRef, useMemo, useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky, Environment, Text, Billboard, Html } from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import multiplayerService from '../../services/multiplayerService';

// 가구 타입 정의 (export for external UI)
export const FURNITURE_TYPES = {
  sofa: { name: '소파', icon: '🛋️', defaultScale: [1, 1, 1] },
  table: { name: '테이블', icon: '🪑', defaultScale: [1, 1, 1] },
  bookshelf: { name: '책장', icon: '📚', defaultScale: [1, 1, 1] },
  lamp: { name: '램프', icon: '💡', defaultScale: [1, 1, 1] },
  plant: { name: '화분', icon: '🌿', defaultScale: [1, 1, 1] },
  tv: { name: 'TV', icon: '📺', defaultScale: [1, 1, 1] },
  rug: { name: '러그', icon: '🟤', defaultScale: [1, 1, 1] },
  chair: { name: '의자', icon: '🪑', defaultScale: [1, 1, 1] },
  bed: { name: '침대', icon: '🛏️', defaultScale: [1, 1, 1] },
};

// 초기 가구 배치 (기본값, 방이 처음 생성될 때만 사용)
const DEFAULT_FURNITURE = [
  { id: 'sofa-1', type: 'sofa', position: [10, 0, 0], rotation: [0, -Math.PI / 2, 0] },
  { id: 'table-1', type: 'table', position: [5, 0, 0], rotation: [0, 0, 0] },
  { id: 'bookshelf-1', type: 'bookshelf', position: [-16, 0, -16], rotation: [0, Math.PI / 4, 0] },
  { id: 'lamp-1', type: 'lamp', position: [14, 0, -14], rotation: [0, 0, 0] },
  { id: 'plant-1', type: 'plant', position: [-14, 0, 14], rotation: [0, 0, 0] },
  { id: 'rug-1', type: 'rug', position: [0, 0.01, 0], rotation: [0, 0, 0] },
  { id: 'tv-1', type: 'tv', position: [-19.5, 3, 0], rotation: [0, Math.PI / 2, 0] },
  { id: 'sofa-2', type: 'sofa', position: [-10, 0, 8], rotation: [0, Math.PI / 4, 0] },
  { id: 'plant-2', type: 'plant', position: [14, 0, 14], rotation: [0, 0, 0] },
  { id: 'lamp-2', type: 'lamp', position: [-14, 0, -14], rotation: [0, 0, 0] },
];

// 서버 가구 데이터를 로컬 형식으로 변환
const serverToLocalFurniture = (serverFurniture) => ({
  id: serverFurniture.furnitureId,
  type: serverFurniture.furnitureType,
  position: [serverFurniture.posX, serverFurniture.posY, serverFurniture.posZ],
  rotation: [serverFurniture.rotX, serverFurniture.rotY, serverFurniture.rotZ],
  scale: [serverFurniture.scaleX, serverFurniture.scaleY, serverFurniture.scaleZ],
  isVisible: serverFurniture.isVisible,
  color: serverFurniture.color,
});

// 로컬 가구 데이터를 서버 형식으로 변환
const localToServerFurniture = (localFurniture) => ({
  furnitureId: localFurniture.id,
  furnitureType: localFurniture.type,
  posX: localFurniture.position[0],
  posY: localFurniture.position[1],
  posZ: localFurniture.position[2],
  rotX: localFurniture.rotation[0],
  rotY: localFurniture.rotation[1],
  rotZ: localFurniture.rotation[2],
  scaleX: localFurniture.scale?.[0] ?? 1,
  scaleY: localFurniture.scale?.[1] ?? 1,
  scaleZ: localFurniture.scale?.[2] ?? 1,
  isVisible: localFurniture.isVisible ?? true,
  color: localFurniture.color,
});

/**
 * PersonalRoom3D - 개인 룸 3D 환경 (물리 + 가구 배치 기능)
 */
const PersonalRoom3D = forwardRef(function PersonalRoom3D({ roomData, onExit, onFurnitureUpdate, characterStateRef, userId, onDeleteRoom }, ref) {
  const [furniture, setFurniture] = useState([]);
  const [furnitureLoaded, setFurnitureLoaded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedFurniture, setSelectedFurniture] = useState(null);
  const [placingFurniture, setPlacingFurniture] = useState(null);
  const [showInventory, setShowInventory] = useState(false);
  const [nearbyFurniture, setNearbyFurniture] = useState(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFurnitureList, setShowFurnitureList] = useState(false); // 설치된 가구 목록 표시
  const lastCheckTimeRef = useRef(0);
  const saveTimeoutRef = useRef(null);
  
  // 호스트인지 확인 (타입 안전 비교)
  const isHost = String(roomData?.hostId) === String(userId);
  
  // 디버깅: isHost 값 확인
  useEffect(() => {
    console.log('🔍 호스트 체크:', {
      roomDataHostId: roomData?.hostId,
      userId: userId,
      roomDataHostIdType: typeof roomData?.hostId,
      userIdType: typeof userId,
      roomDataHostIdString: String(roomData?.hostId),
      userIdString: String(userId),
      isHost: isHost,
      equality: String(roomData?.hostId) === String(userId)
    });
  }, [roomData?.hostId, userId, isHost]);
  
  // 가구 변경 시 서버에 저장하는 헬퍼 함수 (즉시 실행)
  const saveToServer = useCallback((updatedFurniture) => {
    // isHost를 직접 계산 (클로저 문제 방지)
    const currentIsHost = String(roomData?.hostId) === String(userId);
    console.log('🔧 saveToServer 호출됨:', { 
      currentIsHost, 
      hostId: roomData?.hostId, 
      userId, 
      roomId: roomData?.roomId, 
      furnitureCount: updatedFurniture?.length 
    });
    
    if (!currentIsHost) {
      console.log('⚠️ 호스트가 아니라서 저장하지 않음');
      return;
    }
    if (!roomData?.roomId) {
      console.log('⚠️ roomId가 없어서 저장하지 않음');
      return;
    }
    
    // 이전 타이머 취소
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // 500ms 디바운스
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const serverFurnitures = updatedFurniture.map(localToServerFurniture);
        console.log('💾 서버에 저장 중...', { roomId: roomData.roomId, furnitures: serverFurnitures });
        const result = await multiplayerService.saveFurnitures(roomData.roomId, serverFurnitures);
        console.log('💾 가구 변경사항 서버에 저장됨:', result);
      } catch (error) {
        console.error('❌ 가구 저장 실패:', error);
      }
    }, 500);
  }, [roomData?.hostId, roomData?.roomId, userId]);
  
  // useImperativeHandle로 외부에 상태와 함수 노출
  useImperativeHandle(ref, () => ({
    // 상태
    furniture,
    editMode,
    selectedFurniture,
    showToolbar,
    showInventory,
    showFurnitureList,
    showDeleteConfirm,
    isHost,
    // 함수
    setEditMode,
    setSelectedFurniture,
    setShowToolbar,
    setShowInventory,
    setShowFurnitureList,
    setShowDeleteConfirm,
    handleAddFurniture: (type) => {
      if (!isHost) {
        console.log('⚠️ 호스트만 가구를 추가할 수 있습니다');
        return;
      }
      // 배치할 가구 정보만 설정 (실제 추가는 handlePlaceFurniture에서)
      const newFurniture = {
        id: `${type}-${Date.now()}`,
        type,
        position: [0, 0, 5],
        rotation: [0, 0, 0],
      };
      setPlacingFurniture(newFurniture);
      setEditMode(true);
      setShowInventory(false);
    },
    handleRotateFurniture: (id, direction = 1) => {
      if (!isHost) {
        console.log('⚠️ 호스트만 가구를 회전할 수 있습니다');
        return;
      }
      setFurniture(prev => {
        const updated = prev.map(f => {
          if (f.id === id) {
            const newRotation = [...f.rotation];
            newRotation[1] += (Math.PI / 4) * direction;
            return { ...f, rotation: newRotation };
          }
          return f;
        });
        saveToServer(updated);
        onFurnitureUpdate?.(updated);
        return updated;
      });
    },
    handleDeleteFurniture: (id) => {
      if (!isHost) {
        console.log('⚠️ 호스트만 가구를 삭제할 수 있습니다');
        return;
      }
      if (id) {
        setFurniture(prev => {
          const updated = prev.filter(f => f.id !== id);
          saveToServer(updated);
          onFurnitureUpdate?.(updated);
          return updated;
        });
        setSelectedFurniture(null);
      }
    },
    handleDeleteRoom: () => {
      if (onDeleteRoom) {
        onDeleteRoom(roomData.roomId);
      }
    },
  }), [furniture, editMode, selectedFurniture, showToolbar, showInventory, showFurnitureList, showDeleteConfirm, isHost, roomData, onDeleteRoom, saveToServer, onFurnitureUpdate]);
  
  // 방 입장 시 가구 데이터 로드
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    
    const loadFurnitures = async () => {
      if (!roomData?.roomId) {
        console.log('⚠️ roomId가 없어서 가구 로드 스킵');
        return;
      }
      
      console.log('🔍 가구 로드 시작 - roomId:', roomData.roomId, 'hostId:', roomData.hostId, 'userId:', userId, 'isHost:', isHost, '시도:', retryCount + 1);
      
      try {
        const serverFurnitures = await multiplayerService.fetchFurnitures(roomData.roomId);
        console.log('📥 서버 응답:', serverFurnitures);
        
        if (serverFurnitures && serverFurnitures.length > 0) {
          // 서버에서 가구 데이터 로드
          const localFurnitures = serverFurnitures
            .filter(f => f.isVisible !== false)
            .map(serverToLocalFurniture);
          setFurniture(localFurnitures);
          console.log('🛋️ 서버에서 가구 로드 완료:', localFurnitures.length, '개', localFurnitures);
          setFurnitureLoaded(true);
        } else {
          // 서버에 가구 데이터가 없으면 기본 가구 배치 + 저장 시도
          console.log('🛋️ 서버에 가구 없음, 기본 가구 배치 시도');
          
          // 호스트인 경우 기본 가구를 서버에 저장 시도
          if (isHost) {
            console.log('💾 호스트이므로 기본 가구 서버에 저장 시도...');
            const serverFurnituresData = DEFAULT_FURNITURE.map(localToServerFurniture);
            const saveResult = await multiplayerService.saveFurnitures(roomData.roomId, serverFurnituresData);
            console.log('💾 기본 가구 서버 저장 결과:', saveResult);
            
            // 저장 실패 시 (방이 아직 DB에 없을 수 있음) 재시도
            if ((!saveResult || saveResult.length === 0) && retryCount < maxRetries) {
              retryCount++;
              console.log(`⏳ 저장 실패, ${retryCount}초 후 재시도... (${retryCount}/${maxRetries})`);
              setTimeout(loadFurnitures, 1000 * retryCount);
              return;
            }
          }
          
          setFurniture(DEFAULT_FURNITURE);
          setFurnitureLoaded(true);
        }
      } catch (error) {
        console.error('❌ 가구 로드 실패:', error);
        
        // 에러 발생 시 재시도
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`⏳ 에러 발생, ${retryCount}초 후 재시도... (${retryCount}/${maxRetries})`);
          setTimeout(loadFurnitures, 1000 * retryCount);
          return;
        }
        
        setFurniture(DEFAULT_FURNITURE);
        setFurnitureLoaded(true);
      }
    };
    
    // 약간의 지연 후 로드 시작 (방 생성 후 DB 저장 대기)
    const initialDelay = setTimeout(loadFurnitures, 500);
    
    return () => clearTimeout(initialDelay);
  }, [roomData?.roomId, isHost, userId]);
  
  // 컴포넌트 언마운트 시 즉시 저장 및 타이머 정리
  useEffect(() => {
    return () => {
      // 타이머가 있으면 즉시 실행하고 취소
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        
        // 즉시 저장 (언마운트 시)
        if (isHost && roomData?.roomId && furniture.length > 0) {
          const serverFurnitures = furniture.map(localToServerFurniture);
          console.log('💾 방 나가기 전 즉시 저장:', serverFurnitures);
          multiplayerService.saveFurnitures(roomData.roomId, serverFurnitures)
            .then(result => console.log('✅ 최종 저장 완료:', result))
            .catch(error => console.error('❌ 최종 저장 실패:', error));
        }
      }
    };
  }, [isHost, roomData?.roomId, furniture]);
  
  // 캐릭터 위치 기반 근처 가구 감지 (useFrame 사용)
  useFrame(() => {
    // 100ms마다 체크
    const now = Date.now();
    if (now - lastCheckTimeRef.current < 100) return;
    lastCheckTimeRef.current = now;
    
    if (!characterStateRef?.current?.position || editMode) {
      if (nearbyFurniture) setNearbyFurniture(null);
      return;
    }
    
    const INTERACTION_DISTANCE = 4; // 상호작용 거리
    const [charX, charY, charZ] = characterStateRef.current.position;
    
    let closestFurniture = null;
    let closestDistance = Infinity;
    
    furniture.forEach(item => {
      const [fx, fy, fz] = item.position;
      const distance = Math.sqrt(
        Math.pow(charX - fx, 2) + Math.pow(charZ - fz, 2)
      );
      
      if (distance < INTERACTION_DISTANCE && distance < closestDistance) {
        closestDistance = distance;
        closestFurniture = item;
      }
    });
    
    // 상태 변경이 필요한 경우에만 업데이트
    if (closestFurniture?.id !== nearbyFurniture?.id) {
      setNearbyFurniture(closestFurniture);
    }
  });

  // 가구 추가 (호스트만 가능)
  const handleAddFurniture = useCallback((type) => {
    if (!isHost) {
      console.log('⚠️ 호스트만 가구를 추가할 수 있습니다');
      return;
    }
    const newFurniture = {
      id: `${type}-${Date.now()}`,
      type,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    };
    setPlacingFurniture(newFurniture);
    setShowInventory(false);
  }, [isHost]);

  // 가구 배치 확정
  const handlePlaceFurniture = useCallback((position) => {
    if (placingFurniture && isHost) {
      const newItem = { ...placingFurniture, position };
      setFurniture(prev => {
        const updated = [...prev, newItem];
        saveToServer(updated);
        return updated;
      });
      setPlacingFurniture(null);
      onFurnitureUpdate?.([...furniture, newItem]);
    }
  }, [placingFurniture, furniture, onFurnitureUpdate, isHost, saveToServer]);

  // 가구 선택 (호스트만 편집 가능)
  const handleSelectFurniture = useCallback((id) => {
    if (editMode && isHost) {
      setSelectedFurniture(selectedFurniture === id ? null : id);
    }
  }, [editMode, selectedFurniture, isHost]);

  // 가구 이동
  const handleMoveFurniture = useCallback((id, newPosition) => {
    if (!isHost) return;
    setFurniture(prev => {
      const updated = prev.map(f => 
        f.id === id ? { ...f, position: newPosition } : f
      );
      saveToServer(updated);
      onFurnitureUpdate?.(updated);
      return updated;
    });
  }, [onFurnitureUpdate, isHost, saveToServer]);

  // 가구 회전
  const handleRotateFurniture = useCallback((id, direction = 1) => {
    if (!isHost) return;
    setFurniture(prev => {
      const updated = prev.map(f => {
        if (f.id === id) {
          const newRotY = f.rotation[1] + (Math.PI / 4) * direction;
          return { ...f, rotation: [f.rotation[0], newRotY, f.rotation[2]] };
        }
        return f;
      });
      saveToServer(updated);
      onFurnitureUpdate?.(updated);
      return updated;
    });
  }, [onFurnitureUpdate, isHost, saveToServer]);

  // 가구 삭제
  const handleDeleteFurniture = useCallback((id) => {
    if (!isHost) return;
    setFurniture(prev => {
      const updated = prev.filter(f => f.id !== id);
      saveToServer(updated);
      onFurnitureUpdate?.(updated);
      return updated;
    });
    setSelectedFurniture(null);
  }, [onFurnitureUpdate, isHost, saveToServer]);

  // 키보드 이벤트
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 편집 모드 토글
      if (e.key === 'e' || e.key === 'E') {
        setEditMode(prev => !prev);
        setSelectedFurniture(null);
        setPlacingFurniture(null);
      }
      // 인벤토리 토글
      if (e.key === 'i' || e.key === 'I') {
        setShowInventory(prev => !prev);
        setShowFurnitureList(false);
      }
      // 설치된 가구 목록 토글
      if (e.key === 'g' || e.key === 'G') {
        setShowToolbar(true);
        setShowFurnitureList(prev => !prev);
        setShowInventory(false);
      }
      // ESC: 모든 UI 닫기
      if (e.key === 'Escape') {
        setSelectedFurniture(null);
        setPlacingFurniture(null);
        setShowInventory(false);
        setShowFurnitureList(false);
        setEditMode(false);
      }
      // F키로 방 나가기
      if (e.key === 'f' || e.key === 'F') {
        console.log('🚪 F키로 방 나가기 시도');
        onExit?.();
      }
      if (selectedFurniture) {
        if (e.key === 'r' || e.key === 'R') {
          handleRotateFurniture(selectedFurniture, 1);
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
          handleDeleteFurniture(selectedFurniture);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFurniture, handleRotateFurniture, handleDeleteFurniture, onExit]);

  return (
    <>
      <Physics gravity={[0, -9.81, 0]}>
        {/* 환경 조명 */}
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={0.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[0, 5, 0]} intensity={0.5} color="#ffeecc" />
        
        {/* 하늘 */}
        <Sky 
          sunPosition={[100, 50, 100]}
          turbidity={8}
          rayleigh={0.5}
          mieCoefficient={0.005}
          mieDirectionalG={0.8}
        />
        
        {/* 환경 맵 */}
        <Environment preset="apartment" />
        
        {/* 바닥 (물리 충돌체) */}
        <RoomFloorPhysics editMode={editMode} onPlaceFurniture={handlePlaceFurniture} placingFurniture={placingFurniture} />
        
        {/* 벽 (물리 충돌체) */}
        <RoomWallsPhysics />
        
        {/* 가구들 (물리 적용) */}
        {furniture.map(item => (
          <DraggableFurniture
            key={item.id}
            {...item}
            editMode={editMode}
            isSelected={selectedFurniture === item.id}
            onSelect={() => handleSelectFurniture(item.id)}
            onMove={(pos) => handleMoveFurniture(item.id, pos)}
            onRotate={(dir) => handleRotateFurniture(item.id, dir)}
            onDelete={() => handleDeleteFurniture(item.id)}
          />
        ))}
        
        {/* 배치 중인 가구 미리보기 */}
        {placingFurniture && (
          <FurniturePlacementPreview type={placingFurniture.type} />
        )}
        
        {/* 방 이름 표시 */}
        <Billboard position={[0, 10, 0]} follow={true}>
          <Text
            fontSize={1.2}
            color="#ffffff"
            outlineWidth={0.05}
            outlineColor="#000000"
            anchorX="center"
            anchorY="middle"
          >
            {roomData?.roomName || '개인 룸'}
          </Text>
        </Billboard>
        
        {/* 출구 포탈 */}
        <ExitPortal position={[0, 0, -18]} onExit={onExit} />
      </Physics>
      
      {/* 배치/편집 모드 안내 - Canvas 내부 표시 */}
      {(editMode || placingFurniture) && (
        <Html center position={[0, 8, 0]}>
          <div style={{
            background: placingFurniture ? 'rgba(0, 200, 83, 0.9)' : 'rgba(255, 140, 0, 0.9)',
            padding: '8px 16px',
            borderRadius: 16,
            color: '#fff',
            fontWeight: '600',
            fontSize: 12,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}>
            {placingFurniture ? '🎯 클릭하여 배치' : '🔧 편집 모드'}
          </div>
        </Html>
      )}
      
      {/* 선택된 가구 안내 */}
      {selectedFurniture && editMode && (
        <Html center position={[0, 6, 0]}>
          <div style={{
            background: 'rgba(255, 165, 0, 0.95)',
            padding: '8px 16px',
            borderRadius: 12,
            color: '#000',
            fontWeight: '600',
            fontSize: 11,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span>{FURNITURE_TYPES[furniture.find(f => f.id === selectedFurniture)?.type]?.icon}</span>
            {FURNITURE_TYPES[furniture.find(f => f.id === selectedFurniture)?.type]?.name} - 드래그 이동
          </div>
        </Html>
      )}
    </>
  );
});

/**
 * 가구 인벤토리 UI (export for external use)
 */
export function FurnitureInventory({ onSelect, onClose }) {
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(30, 30, 50, 0.95)',
      padding: 24,
      borderRadius: 16,
      border: '2px solid #4a90d9',
      maxWidth: 400,
      width: '90%',
      pointerEvents: 'auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ color: '#fff', margin: 0, fontSize: 18 }}>🪑 가구 인벤토리</h3>
        <button 
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: 20,
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
      }}>
        {Object.entries(FURNITURE_TYPES).map(([type, info]) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            style={{
              background: 'rgba(74, 144, 217, 0.3)',
              border: '1px solid #4a90d9',
              borderRadius: 8,
              padding: '16px 8px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(74, 144, 217, 0.6)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(74, 144, 217, 0.3)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span style={{ fontSize: 32 }}>{info.icon}</span>
            <span style={{ color: '#fff', fontSize: 12 }}>{info.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}



/**
 * 드래그 가능한 가구 컴포넌트
 */
function DraggableFurniture({ id, type, position, rotation, editMode, isSelected, onSelect, onMove }) {
  const groupRef = useRef();
  const rigidBodyRef = useRef();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState(null);
  const { camera, raycaster, pointer, gl } = useThree();
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const intersectPoint = useRef(new THREE.Vector3());

  // 마우스 다운 핸들러
  const handlePointerDown = useCallback((e) => {
    if (!editMode) return;
    e.stopPropagation();
    onSelect();
    
    if (isSelected) {
      setIsDragging(true);
      setDragStartPos(position);
      gl.domElement.style.cursor = 'grabbing';
    }
  }, [editMode, isSelected, onSelect, gl, position]);

  // 마우스 업 핸들러 (드래그 종료 시 저장)
  const handlePointerUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      gl.domElement.style.cursor = 'auto';
      
      // 드래그 종료 시 최종 위치만 저장
      if (rigidBodyRef.current && dragStartPos) {
        const translation = rigidBodyRef.current.translation();
        const finalPos = [translation.x, translation.y, translation.z];
        
        // 위치가 실제로 변경된 경우에만 저장
        const moved = Math.abs(finalPos[0] - dragStartPos[0]) > 0.01 || 
                      Math.abs(finalPos[2] - dragStartPos[2]) > 0.01;
        if (moved) {
          onMove(finalPos);
        }
      }
    }
  }, [isDragging, gl, dragStartPos, onMove]);

  // 드래그 중 프레임 업데이트 (저장하지 않고 위치만 업데이트)
  useFrame(() => {
    if (isDragging && rigidBodyRef.current) {
      raycaster.setFromCamera(pointer, camera);
      raycaster.ray.intersectPlane(planeRef.current, intersectPoint.current);
      
      // 위치 제한 (방 범위 내)
      const clampedX = Math.max(-18, Math.min(18, intersectPoint.current.x));
      const clampedZ = Math.max(-18, Math.min(18, intersectPoint.current.z));
      
      // 드래그 중에는 물리 엔진 위치만 업데이트 (저장은 하지 않음)
      rigidBodyRef.current.setTranslation({ x: clampedX, y: position[1], z: clampedZ }, true);
    }
  });

  // 전역 마우스 업 이벤트
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isDragging) {
        setIsDragging(false);
        gl.domElement.style.cursor = 'auto';
      }
    };
    
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
  }, [isDragging, gl]);

  // 가구 렌더링
  const FurnitureComponent = useMemo(() => {
    switch (type) {
      case 'sofa': return Sofa;
      case 'table': return CoffeeTable;
      case 'bookshelf': return Bookshelf;
      case 'lamp': return FloorLamp;
      case 'plant': return PlantPot;
      case 'rug': return Rug;
      case 'tv': return TV;
      case 'chair': return Chair;
      case 'bed': return Bed;
      default: return null;
    }
  }, [type]);

  if (!FurnitureComponent) return null;

  return (
    <RigidBody
      ref={rigidBodyRef}
      type={editMode && isSelected ? 'kinematicPosition' : 'fixed'}
      position={position}
      rotation={rotation}
      colliders={false}
    >
      <group
        ref={groupRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerOver={() => editMode && (gl.domElement.style.cursor = 'pointer')}
        onPointerOut={() => !isDragging && (gl.domElement.style.cursor = 'auto')}
      >
        <FurnitureComponent />
        
        {/* 선택 표시 */}
        {isSelected && editMode && (
          <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.5, 3, 32]} />
            <meshBasicMaterial color="#FFA500" transparent opacity={0.5} />
          </mesh>
        )}
        
        {/* 충돌체 */}
        <CuboidCollider args={getColliderSize(type)} position={getColliderPosition(type)} />
      </group>
    </RigidBody>
  );
}

// 가구별 충돌체 크기
function getColliderSize(type) {
  switch (type) {
    case 'sofa': return [1.5, 0.9, 0.7];
    case 'table': return [0.75, 0.3, 0.4];
    case 'bookshelf': return [0.75, 1.5, 0.2];
    case 'lamp': return [0.2, 1.1, 0.2];
    case 'plant': return [0.3, 0.75, 0.3];
    case 'rug': return [3, 0.05, 3];
    case 'tv': return [1.25, 0.75, 0.1];
    case 'chair': return [0.5, 0.5, 0.5];
    case 'bed': return [1.5, 0.5, 1];
    default: return [1, 1, 1];
  }
}

// 가구별 충돌체 위치
function getColliderPosition(type) {
  switch (type) {
    case 'sofa': return [0, 0.9, 0];
    case 'table': return [0, 0.3, 0];
    case 'bookshelf': return [0, 1.5, 0];
    case 'lamp': return [0, 1.1, 0];
    case 'plant': return [0, 0.75, 0];
    case 'rug': return [0, 0.05, 0];
    case 'tv': return [0, 0, 0];
    case 'chair': return [0, 0.5, 0];
    case 'bed': return [0, 0.5, 0];
    default: return [0, 0.5, 0];
  }
}

/**
 * 가구 배치 미리보기
 */
function FurniturePlacementPreview({ type }) {
  const groupRef = useRef();
  const { camera, raycaster, pointer } = useThree();
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const intersectPoint = useRef(new THREE.Vector3());

  useFrame(() => {
    if (groupRef.current) {
      raycaster.setFromCamera(pointer, camera);
      raycaster.ray.intersectPlane(planeRef.current, intersectPoint.current);
      
      const clampedX = Math.max(-18, Math.min(18, intersectPoint.current.x));
      const clampedZ = Math.max(-18, Math.min(18, intersectPoint.current.z));
      
      groupRef.current.position.set(clampedX, 0, clampedZ);
    }
  });

  const FurnitureComponent = useMemo(() => {
    switch (type) {
      case 'sofa': return Sofa;
      case 'table': return CoffeeTable;
      case 'bookshelf': return Bookshelf;
      case 'lamp': return FloorLamp;
      case 'plant': return PlantPot;
      case 'rug': return Rug;
      case 'tv': return TV;
      case 'chair': return Chair;
      case 'bed': return Bed;
      default: return null;
    }
  }, [type]);

  if (!FurnitureComponent) return null;

  return (
    <group ref={groupRef}>
      <FurnitureComponent />
      {/* 반투명 표시 */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2, 32]} />
        <meshBasicMaterial color="#00FF00" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

/**
 * 방 바닥 (물리 충돌체 포함)
 */
function RoomFloorPhysics({ editMode, onPlaceFurniture, placingFurniture }) {
  const { camera, raycaster, pointer } = useThree();
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const intersectPoint = useRef(new THREE.Vector3());

  const floorTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, 512, 512);
    
    ctx.strokeStyle = '#5D3A1A';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * 64);
      ctx.lineTo(512, i * 64);
      ctx.stroke();
    }
    
    for (let row = 0; row < 8; row++) {
      const offset = (row % 2) * 128;
      for (let col = 0; col < 5; col++) {
        ctx.beginPath();
        ctx.moveTo(col * 128 + offset, row * 64);
        ctx.lineTo(col * 128 + offset, row * 64 + 64);
        ctx.stroke();
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }, []);

  const handleClick = useCallback((e) => {
    if (placingFurniture) {
      e.stopPropagation();
      raycaster.setFromCamera(pointer, camera);
      raycaster.ray.intersectPlane(planeRef.current, intersectPoint.current);
      
      const clampedX = Math.max(-18, Math.min(18, intersectPoint.current.x));
      const clampedZ = Math.max(-18, Math.min(18, intersectPoint.current.z));
      
      onPlaceFurniture([clampedX, 0, clampedZ]);
    }
  }, [placingFurniture, onPlaceFurniture, camera, raycaster, pointer]);

  return (
    <RigidBody type="fixed" position={[0, -0.1, 0]}>
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0.1, 0]} 
        receiveShadow
        onClick={handleClick}
      >
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial 
          map={floorTexture}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      <CuboidCollider args={[20, 0.1, 20]} />
    </RigidBody>
  );
}

/**
 * 방 벽 (물리 충돌체 포함)
 */
function RoomWallsPhysics() {
  const wallTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#F5F5DC';
    ctx.fillRect(0, 0, 256, 256);
    
    ctx.fillStyle = 'rgba(200, 180, 150, 0.1)';
    for (let i = 0; i < 100; i++) {
      ctx.fillRect(
        Math.random() * 256,
        Math.random() * 256,
        Math.random() * 10,
        Math.random() * 10
      );
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 1);
    return texture;
  }, []);

  return (
    <group>
      {/* 뒤쪽 벽 */}
      <RigidBody type="fixed" position={[0, 6, -20]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[40, 12, 0.3]} />
          <meshStandardMaterial map={wallTexture} />
        </mesh>
        <CuboidCollider args={[20, 6, 0.15]} />
      </RigidBody>
      
      {/* 왼쪽 벽 */}
      <RigidBody type="fixed" position={[-20, 6, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[40, 12, 0.3]} />
          <meshStandardMaterial map={wallTexture} />
        </mesh>
        <CuboidCollider args={[20, 6, 0.15]} />
      </RigidBody>
      
      {/* 오른쪽 벽 */}
      <RigidBody type="fixed" position={[20, 6, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[40, 12, 0.3]} />
          <meshStandardMaterial map={wallTexture} />
        </mesh>
        <CuboidCollider args={[20, 6, 0.15]} />
      </RigidBody>
      
      {/* 앞쪽 벽 (창문 있음) */}
      <RigidBody type="fixed" position={[-12, 6, 20]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[16, 12, 0.3]} />
          <meshStandardMaterial map={wallTexture} />
        </mesh>
        <CuboidCollider args={[8, 6, 0.15]} />
      </RigidBody>
      
      <RigidBody type="fixed" position={[12, 6, 20]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[16, 12, 0.3]} />
          <meshStandardMaterial map={wallTexture} />
        </mesh>
        <CuboidCollider args={[8, 6, 0.15]} />
      </RigidBody>
      
      <mesh position={[0, 9, 20]} receiveShadow castShadow>
        <boxGeometry args={[8, 6, 0.3]} />
        <meshStandardMaterial map={wallTexture} />
      </mesh>
      
      {/* 창문 */}
      <mesh position={[0, 4, 20]}>
        <boxGeometry args={[8.2, 8.2, 0.4]} />
        <meshStandardMaterial color="#4a3728" />
      </mesh>
      <mesh position={[0, 4, 20.1]}>
        <boxGeometry args={[7.8, 7.8, 0.1]} />
        <meshStandardMaterial 
          color="#87CEEB"
          transparent
          opacity={0.3}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
}

// ============ 가구 컴포넌트들 ============

function Chair() {
  return (
    <group>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.8, 0.1, 0.8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[0, 0.9, -0.35]} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.1]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      {[[-0.3, 0.25, 0.3], [0.3, 0.25, 0.3], [-0.3, 0.25, -0.3], [0.3, 0.25, -0.3]].map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <boxGeometry args={[0.08, 0.5, 0.08]} />
          <meshStandardMaterial color="#5D3A1A" />
        </mesh>
      ))}
    </group>
  );
}

function Bed() {
  return (
    <group>
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[3, 0.3, 2]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[2.8, 0.2, 1.8]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0, 0.9, -0.9]} castShadow>
        <boxGeometry args={[3, 1.2, 0.15]} />
        <meshStandardMaterial color="#5D3A1A" />
      </mesh>
      <mesh position={[0.5, 0.75, -0.6]} castShadow>
        <boxGeometry args={[0.6, 0.15, 0.4]} />
        <meshStandardMaterial color="#E6E6FA" />
      </mesh>
      <mesh position={[-0.5, 0.75, -0.6]} castShadow>
        <boxGeometry args={[0.6, 0.15, 0.4]} />
        <meshStandardMaterial color="#E6E6FA" />
      </mesh>
    </group>
  );
}

/**
 * 소파
 */
function Sofa() {
  return (
    <group>
      {/* 좌석 */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[3, 0.6, 1.2]} />
        <meshStandardMaterial color="#4169E1" />
      </mesh>
      {/* 등받이 */}
      <mesh position={[0, 1.2, -0.5]} castShadow>
        <boxGeometry args={[3, 1.2, 0.3]} />
        <meshStandardMaterial color="#4169E1" />
      </mesh>
      {/* 팔걸이 */}
      <mesh position={[-1.4, 0.8, 0]} castShadow>
        <boxGeometry args={[0.3, 0.8, 1.2]} />
        <meshStandardMaterial color="#4169E1" />
      </mesh>
      <mesh position={[1.4, 0.8, 0]} castShadow>
        <boxGeometry args={[0.3, 0.8, 1.2]} />
        <meshStandardMaterial color="#4169E1" />
      </mesh>
      {/* 쿠션 */}
      <mesh position={[-0.7, 0.95, 0]} castShadow>
        <boxGeometry args={[0.8, 0.15, 0.8]} />
        <meshStandardMaterial color="#FFD700" />
      </mesh>
      <mesh position={[0.7, 0.95, 0]} castShadow>
        <boxGeometry args={[0.8, 0.15, 0.8]} />
        <meshStandardMaterial color="#FFD700" />
      </mesh>
    </group>
  );
}

/**
 * 커피 테이블
 */
function CoffeeTable() {
  return (
    <group>
      {/* 상판 */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.5, 0.1, 0.8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      {/* 다리 */}
      {[[-0.6, 0.25, 0.3], [0.6, 0.25, 0.3], [-0.6, 0.25, -0.3], [0.6, 0.25, -0.3]].map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <boxGeometry args={[0.1, 0.5, 0.1]} />
          <meshStandardMaterial color="#5D3A1A" />
        </mesh>
      ))}
    </group>
  );
}

/**
 * 책장
 */
function Bookshelf() {
  return (
    <group>
      {/* 프레임 */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[1.5, 3, 0.4]} />
        <meshStandardMaterial color="#5D3A1A" />
      </mesh>
      {/* 선반 */}
      {[0.5, 1.5, 2.5].map((y, i) => (
        <mesh key={i} position={[0, y, 0.05]} castShadow>
          <boxGeometry args={[1.4, 0.1, 0.35]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      ))}
      {/* 책들 */}
      <Books position={[0, 0.7, 0.1]} />
      <Books position={[0, 1.7, 0.1]} />
      <Books position={[0, 2.7, 0.1]} />
    </group>
  );
}

/**
 * 책
 */
function Books({ position }) {
  const colors = ['#8B0000', '#006400', '#00008B', '#8B008B', '#FF8C00'];
  return (
    <group position={position}>
      {colors.map((color, i) => (
        <mesh key={i} position={[(i - 2) * 0.2, 0.25, 0]} castShadow>
          <boxGeometry args={[0.15, 0.5, 0.3]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * 플로어 램프
 */
function FloorLamp() {
  return (
    <group>
      {/* 베이스 */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      {/* 기둥 */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      {/* 갓 */}
      <mesh position={[0, 2.2, 0]} castShadow>
        <coneGeometry args={[0.4, 0.5, 16, 1, true]} />
        <meshStandardMaterial color="#FFFACD" side={THREE.DoubleSide} />
      </mesh>
      {/* 빛 */}
      <pointLight position={[0, 2, 0]} intensity={0.5} color="#FFF8DC" distance={5} />
    </group>
  );
}

/**
 * 화분
 */
function PlantPot() {
  return (
    <group>
      {/* 화분 */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.2, 0.6, 16]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      {/* 흙 */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.1, 16]} />
        <meshStandardMaterial color="#3D2817" />
      </mesh>
      {/* 식물 줄기 */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 1, 8]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>
      {/* 잎 */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh 
          key={i} 
          position={[Math.sin(i * 1.2) * 0.3, 1.2 + i * 0.1, Math.cos(i * 1.2) * 0.3]}
          rotation={[Math.random() * 0.5, i * 1.2, Math.random() * 0.5]}
          castShadow
        >
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial color="#32CD32" />
        </mesh>
      ))}
    </group>
  );
}

/**
 * 러그
 */
function Rug() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[6, 32]} />
      <meshStandardMaterial color="#CD853F" />
    </mesh>
  );
}

/**
 * TV
 */
function TV() {
  return (
    <group>
      {/* 프레임 */}
      <mesh castShadow>
        <boxGeometry args={[2.5, 1.5, 0.15]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* 화면 */}
      <mesh position={[0, 0, 0.08]}>
        <boxGeometry args={[2.3, 1.3, 0.01]} />
        <meshStandardMaterial 
          color="#000000"
          emissive="#111133"
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}

/**
 * 출구 포탈
 */
function ExitPortal({ position, onExit }) {
  const portalRef = useRef();
  
  useFrame((state) => {
    if (portalRef.current) {
      portalRef.current.rotation.y += 0.02;
    }
  });
  
  return (
    <group position={position}>
      {/* 포탈 링 */}
      <mesh ref={portalRef}>
        <torusGeometry args={[1.5, 0.2, 16, 32]} />
        <meshStandardMaterial 
          color="#00BFFF"
          emissive="#00BFFF"
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* 포탈 내부 */}
      <mesh>
        <circleGeometry args={[1.3, 32]} />
        <meshStandardMaterial
          color="#001133"
          emissive="#0066FF"
          emissiveIntensity={0.3}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* 나가기 텍스트 */}
      <Billboard position={[0, 2.5, 0]}>
        <Text
          fontSize={0.4}
          color="#00BFFF"
          outlineWidth={0.02}
          outlineColor="#001133"
        >
          🚪 나가기 (F키)
        </Text>
      </Billboard>
      
      {/* 빛 */}
      <pointLight position={[0, 0, 1]} color="#00BFFF" intensity={1} distance={5} />
    </group>
  );
}

export default PersonalRoom3D;
