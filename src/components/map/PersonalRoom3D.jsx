import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky, Environment, Text, Billboard, Html } from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';

// 가구 타입 정의
const FURNITURE_TYPES = {
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

// 초기 가구 배치
const INITIAL_FURNITURE = [
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

/**
 * PersonalRoom3D - 개인 룸 3D 환경 (물리 + 가구 배치 기능)
 */
function PersonalRoom3D({ roomData, onExit, onFurnitureUpdate, characterStateRef }) {
  const [furniture, setFurniture] = useState(INITIAL_FURNITURE);
  const [editMode, setEditMode] = useState(false);
  const [selectedFurniture, setSelectedFurniture] = useState(null);
  const [placingFurniture, setPlacingFurniture] = useState(null);
  const [showInventory, setShowInventory] = useState(false);
  const [nearbyFurniture, setNearbyFurniture] = useState(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const lastCheckTimeRef = useRef(0);
  
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

  // 가구 추가
  const handleAddFurniture = useCallback((type) => {
    const newFurniture = {
      id: `${type}-${Date.now()}`,
      type,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    };
    setPlacingFurniture(newFurniture);
    setShowInventory(false);
  }, []);

  // 가구 배치 확정
  const handlePlaceFurniture = useCallback((position) => {
    if (placingFurniture) {
      const newItem = { ...placingFurniture, position };
      setFurniture(prev => [...prev, newItem]);
      setPlacingFurniture(null);
      onFurnitureUpdate?.([...furniture, newItem]);
    }
  }, [placingFurniture, furniture, onFurnitureUpdate]);

  // 가구 선택
  const handleSelectFurniture = useCallback((id) => {
    if (editMode) {
      setSelectedFurniture(selectedFurniture === id ? null : id);
    }
  }, [editMode, selectedFurniture]);

  // 가구 이동
  const handleMoveFurniture = useCallback((id, newPosition) => {
    setFurniture(prev => {
      const updated = prev.map(f => 
        f.id === id ? { ...f, position: newPosition } : f
      );
      onFurnitureUpdate?.(updated);
      return updated;
    });
  }, [onFurnitureUpdate]);

  // 가구 회전
  const handleRotateFurniture = useCallback((id, direction = 1) => {
    setFurniture(prev => {
      const updated = prev.map(f => {
        if (f.id === id) {
          const newRotY = f.rotation[1] + (Math.PI / 4) * direction;
          return { ...f, rotation: [f.rotation[0], newRotY, f.rotation[2]] };
        }
        return f;
      });
      onFurnitureUpdate?.(updated);
      return updated;
    });
  }, [onFurnitureUpdate]);

  // 가구 삭제
  const handleDeleteFurniture = useCallback((id) => {
    setFurniture(prev => {
      const updated = prev.filter(f => f.id !== id);
      onFurnitureUpdate?.(updated);
      return updated;
    });
    setSelectedFurniture(null);
  }, [onFurnitureUpdate]);

  // 키보드 이벤트
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'e' || e.key === 'E') {
        setEditMode(prev => !prev);
        setSelectedFurniture(null);
        setPlacingFurniture(null);
      }
      if (e.key === 'i' || e.key === 'I') {
        setShowInventory(prev => !prev);
      }
      if (e.key === 'Escape') {
        setSelectedFurniture(null);
        setPlacingFurniture(null);
        setShowInventory(false);
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
  }, [selectedFurniture, handleRotateFurniture, handleDeleteFurniture]);

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
      
      {/* UI 오버레이 */}
      <Html fullscreen>
        {/* 우측 상단 꾸미기 버튼 */}
        <div style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 100,
          pointerEvents: 'auto',
        }}>
          <button
            onClick={() => setShowToolbar(!showToolbar)}
            style={{
              background: showToolbar ? 'rgba(156, 39, 176, 0.9)' : 'rgba(103, 58, 183, 0.85)',
              border: 'none',
              borderRadius: 8,
              padding: '10px 16px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(123, 31, 162, 0.95)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = showToolbar ? 'rgba(156, 39, 176, 0.9)' : 'rgba(103, 58, 183, 0.85)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {showToolbar ? '✕' : '🎨'}
          </button>
        </div>
        
        {/* 툴바 (꾸미기 버튼 클릭 시 표시) */}
        {showToolbar && (
          <div style={{
            position: 'fixed',
            top: 60,
            right: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            pointerEvents: 'auto',
            zIndex: 99,
          }}>
            <button
              onClick={() => {
                setEditMode(!editMode);
                if (!editMode) setShowToolbar(true);
              }}
              style={{
                background: editMode ? 'rgba(255, 165, 0, 0.9)' : 'rgba(50, 50, 70, 0.85)',
                border: 'none',
                borderRadius: 8,
                padding: '10px 14px',
                color: editMode ? '#000' : '#fff',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              {editMode ? '✅ 편집중' : '🔧 편집'}
            </button>
            
            <button
              onClick={() => setShowInventory(!showInventory)}
              style={{
                background: showInventory ? 'rgba(74, 144, 217, 0.9)' : 'rgba(50, 50, 70, 0.85)',
                border: 'none',
                borderRadius: 8,
                padding: '10px 14px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              🪑 가구
            </button>
          </div>
        )}
        
        {/* 편집 모드 알림 배너 */}
        {editMode && !placingFurniture && (
          <div style={{
            position: 'fixed',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 140, 0, 0.9)',
            padding: '8px 16px',
            borderRadius: 16,
            color: '#fff',
            fontWeight: '600',
            fontSize: 12,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'none',
            zIndex: 50,
          }}>
            🔧 편집 모드
          </div>
        )}
        
        {/* 배치 중 알림 */}
        {placingFurniture && (
          <div style={{
            position: 'fixed',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 200, 83, 0.9)',
            padding: '8px 16px',
            borderRadius: 16,
            color: '#fff',
            fontWeight: '600',
            fontSize: 12,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'none',
            zIndex: 50,
          }}>
            🎯 클릭하여 배치
          </div>
        )}
        
        {/* 근처 가구 상호작용 프롬프트 */}
        {nearbyFurniture && !editMode && (
          <div style={{
            position: 'fixed',
            bottom: 200,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(30, 30, 50, 0.95)',
            padding: '12px 24px',
            borderRadius: 12,
            border: '2px solid #4a90d9',
            color: '#fff',
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 28 }}>{FURNITURE_TYPES[nearbyFurniture.type]?.icon}</span>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: 14 }}>{FURNITURE_TYPES[nearbyFurniture.type]?.name}</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>이동하려면 E키를 눌러 편집 모드로 전환</div>
              </div>
            </div>
            <button
              onClick={() => {
                setEditMode(true);
                setSelectedFurniture(nearbyFurniture.id);
              }}
              style={{
                background: 'linear-gradient(135deg, #4a90d9, #357abd)',
                border: 'none',
                borderRadius: 8,
                padding: '10px 20px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 'bold',
                transition: 'all 0.2s',
              }}
            >
              🔧 이동하기
            </button>
          </div>
        )}
        
        {/* 가구 인벤토리 */}
        {showInventory && (
          <FurnitureInventory 
            onSelect={handleAddFurniture}
            onClose={() => setShowInventory(false)}
          />
        )}
        
        {/* 선택된 가구 정보 패널 */}
        {selectedFurniture && editMode && (
          <SelectedFurnitureInfo
            furniture={furniture.find(f => f.id === selectedFurniture)}
            onRotate={() => handleRotateFurniture(selectedFurniture, 1)}
            onDelete={() => handleDeleteFurniture(selectedFurniture)}
          />
        )}
      </Html>
    </>
  );
}

/**
 * 가구 인벤토리 UI
 */
function FurnitureInventory({ onSelect, onClose }) {
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
 * 선택된 가구 정보 UI
 */
function SelectedFurnitureInfo({ furniture, onRotate, onDelete }) {
  if (!furniture) return null;
  
  const typeInfo = FURNITURE_TYPES[furniture.type];
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 200,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(30, 30, 50, 0.95)',
      padding: '16px 24px',
      borderRadius: 16,
      border: '2px solid #FFA500',
      color: '#fff',
      pointerEvents: 'auto',
      boxShadow: '0 4px 20px rgba(255, 165, 0, 0.3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 32 }}>{typeInfo?.icon}</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: 15 }}>{typeInfo?.name} 선택됨</div>
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
              드래그하여 이동 | 위치: ({furniture.position.map(p => p.toFixed(1)).join(', ')})
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
          <button
            onClick={onRotate}
            style={{
              background: 'linear-gradient(135deg, #4a90d9, #357abd)',
              border: 'none',
              borderRadius: 8,
              padding: '10px 16px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            🔄 회전 (R)
          </button>
          <button
            onClick={onDelete}
            style={{
              background: 'linear-gradient(135deg, #d94a4a, #c43c3c)',
              border: 'none',
              borderRadius: 8,
              padding: '10px 16px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            🗑️ 삭제
          </button>
        </div>
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
      gl.domElement.style.cursor = 'grabbing';
    }
  }, [editMode, isSelected, onSelect, gl]);

  // 마우스 업 핸들러
  const handlePointerUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      gl.domElement.style.cursor = 'auto';
    }
  }, [isDragging, gl]);

  // 드래그 중 프레임 업데이트
  useFrame(() => {
    if (isDragging && rigidBodyRef.current) {
      raycaster.setFromCamera(pointer, camera);
      raycaster.ray.intersectPlane(planeRef.current, intersectPoint.current);
      
      // 위치 제한 (방 범위 내)
      const clampedX = Math.max(-18, Math.min(18, intersectPoint.current.x));
      const clampedZ = Math.max(-18, Math.min(18, intersectPoint.current.z));
      
      rigidBodyRef.current.setTranslation({ x: clampedX, y: position[1], z: clampedZ }, true);
      onMove([clampedX, position[1], clampedZ]);
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
