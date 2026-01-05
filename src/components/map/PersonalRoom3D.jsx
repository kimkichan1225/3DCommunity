import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Sky, Environment, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';

/**
 * PersonalRoom3D - 개인 룸 3D 환경
 * 포근한 방 느낌의 3D 공간
 */
function PersonalRoom3D({ roomData, onExit }) {
  return (
    <>
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
      
      {/* 바닥 */}
      <RoomFloor />
      
      {/* 벽 */}
      <RoomWalls />
      
      {/* 가구들 */}
      <RoomFurniture />
      
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
    </>
  );
}

/**
 * 방 바닥
 */
function RoomFloor() {
  const floorTexture = useMemo(() => {
    // 나무 바닥 패턴 생성
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // 나무색 배경
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, 512, 512);
    
    // 나무 판자 패턴
    ctx.strokeStyle = '#5D3A1A';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * 64);
      ctx.lineTo(512, i * 64);
      ctx.stroke();
    }
    
    // 세로 줄
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
  
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial 
        map={floorTexture}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}

/**
 * 방 벽
 */
function RoomWalls() {
  const wallTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // 밝은 베이지색 벽
    ctx.fillStyle = '#F5F5DC';
    ctx.fillRect(0, 0, 256, 256);
    
    // 약간의 질감
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
      <mesh position={[0, 6, -20]} receiveShadow castShadow>
        <boxGeometry args={[40, 12, 0.3]} />
        <meshStandardMaterial map={wallTexture} />
      </mesh>
      
      {/* 왼쪽 벽 */}
      <mesh position={[-20, 6, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[40, 12, 0.3]} />
        <meshStandardMaterial map={wallTexture} />
      </mesh>
      
      {/* 오른쪽 벽 */}
      <mesh position={[20, 6, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[40, 12, 0.3]} />
        <meshStandardMaterial map={wallTexture} />
      </mesh>
      
      {/* 앞쪽 벽 (창문 있음) */}
      <mesh position={[-12, 6, 20]} receiveShadow castShadow>
        <boxGeometry args={[16, 12, 0.3]} />
        <meshStandardMaterial map={wallTexture} />
      </mesh>
      <mesh position={[12, 6, 20]} receiveShadow castShadow>
        <boxGeometry args={[16, 12, 0.3]} />
        <meshStandardMaterial map={wallTexture} />
      </mesh>
      <mesh position={[0, 9, 20]} receiveShadow castShadow>
        <boxGeometry args={[8, 6, 0.3]} />
        <meshStandardMaterial map={wallTexture} />
      </mesh>
      
      {/* 창문 프레임 */}
      <mesh position={[0, 4, 20]}>
        <boxGeometry args={[8.2, 8.2, 0.4]} />
        <meshStandardMaterial color="#4a3728" />
      </mesh>
      
      {/* 창문 유리 */}
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

/**
 * 방 가구
 */
function RoomFurniture() {
  return (
    <group>
      {/* 소파 */}
      <Sofa position={[10, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
      
      {/* 테이블 */}
      <CoffeeTable position={[5, 0, 0]} />
      
      {/* 책장 */}
      <Bookshelf position={[-16, 0, -16]} rotation={[0, Math.PI / 4, 0]} />
      
      {/* 램프 */}
      <FloorLamp position={[14, 0, -14]} />
      
      {/* 화분 */}
      <PlantPot position={[-14, 0, 14]} />
      
      {/* 러그 */}
      <Rug position={[0, 0.01, 0]} />
      
      {/* TV */}
      <TV position={[-19.5, 3, 0]} rotation={[0, Math.PI / 2, 0]} />
      
      {/* 추가 가구 - 넓어진 공간에 */}
      <Sofa position={[-10, 0, 8]} rotation={[0, Math.PI / 4, 0]} />
      <PlantPot position={[14, 0, 14]} />
      <FloorLamp position={[-14, 0, -14]} />
    </group>
  );
}

/**
 * 소파
 */
function Sofa({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
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
function CoffeeTable({ position }) {
  return (
    <group position={position}>
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
function Bookshelf({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
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
function FloorLamp({ position }) {
  return (
    <group position={position}>
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
function PlantPot({ position }) {
  return (
    <group position={position}>
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
function Rug({ position }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[6, 32]} />
      <meshStandardMaterial color="#CD853F" />
    </mesh>
  );
}

/**
 * TV
 */
function TV({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
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
