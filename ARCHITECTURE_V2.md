# 🗺️ Mapbox + Three.js + Physics 3D 지도 게임 아키텍처

## 1️⃣ 전체 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│  React UI Layer (MapGameV2Page.jsx)                         │
│  - 게임 초기화, 상태 관리, HUD 렌더링                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Core Systems                                               │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Map        │  │  Three.js    │  │  Physics     │      │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤      │
│  │ Mapbox Init  │  │ Scene Setup  │  │ World Setup  │      │
│  │ Coordinate   │  │ Renderer     │  │ Colliders    │      │
│  │ Transform    │  │ Camera Init  │  │ Constraints  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         ↓                  ↓                  ↓              │
│    Mercator to        WebGL Context      Physics Step       │
│   World Coordinates    Rendering          Simulation        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Game Systems                                               │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Navigation  │  │    Camera    │  │    Player    │      │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤      │
│  │ Route Parse  │  │ 3D View      │  │ Controller   │      │
│  │ Visualize    │  │ Follow Logic │  │ GPS Update   │      │
│  │ Progress     │  │ Lerp/Easing  │  │ Physics Sync │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Game Loop (RequestAnimationFrame)                          │
│  1. GPS Update → Player Position                            │
│  2. Physics Simulation (Fixed Timestep)                     │
│  3. Camera Update (Lerp to target)                          │
│  4. Render (Three.js + Mapbox Custom Layer)                │
│  5. UI Update                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 2️⃣ Mapbox ↔ Three.js 좌표 변환 상세

### 🎯 핵심 개념

```
Web Mercator 투영:
  LngLat → MercatorCoordinate (정규화됨: 0~1)
                    ↓
  MercatorCoordinate × 지구둘레 = 미터
                    ↓
  Three.js 월드 좌표 (원점 = 지도 중심)

문제점:
  - 실시간 좌표 변환 시 떨림
  - 스케일 불일치 (미터 ↔ 유닛)
  - 위도에 따른 변형 (고위도에서 확대)
```

### 📐 수식

```
1. LngLat → Mercator
   merc = mapboxgl.MercatorCoordinate.fromLngLat([lng, lat])
   mercatorX = merc.x
   mercatorY = merc.y

2. Mercator → Meters (가변적)
   unitsPerMeter = 1 / (earthCircumference * cos(lat * π/180))
   
3. Mercator Offset → World Coordinate
   worldX = (mercX - centerMercX) / unitsPerMeter
   worldZ = -(mercY - centerMercY) / unitsPerMeter
   (Z는 반대: Mercator Y증가 = 북쪽, Three.js Z감소 = 북쪽)

4. Haversine Distance (GPS간 거리)
   d = 2R × arcsin(√(sin²(Δlat/2) + cos(lat1)cos(lat2)sin²(Δlng/2)))
   R = 6371000 (지구반지름, 미터)
```

### 🔄 떨림 최소화 알고리즘

```
문제: GPS 신호가 ±5~10m 오차로 계속 떨림
해결: Kalman Filter 또는 EMA(지수이동평균)

EMA 구현:
  smoothedLat = α × newLat + (1-α) × prevLat
  smoothedLng = α × newLng + (1-α) × prevLng
  
  α = 0.2~0.5 (낮을수록 부드러움, 높을수록 반응성)
```

---

## 3️⃣ Navigation Route 3D 변환

### 입력 데이터
```json
{
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [127.0276, 37.4979],
      [127.0280, 37.4985],
      ...
    ]
  }
}
```

### 변환 과정
```
1. Coordinates → LngLat Array
2. LngLat → MercatorCoordinate
3. MercatorCoordinate → World Coordinates (Three.js)
4. CatmullRomCurve3 생성 (부드러운 경로)
5. TubeGeometry로 3D 튜브 또는 Line로 표시
```

---

## 4️⃣ Physics 캐릭터 컨트롤러

### 설계 원칙
```
GPS 위치 + 물리 보정:
  1. GPS 신호 수신 (1초마다)
  2. 목표 위치 계산
  3. 거리에 따라:
     - 0~2m: 부드럽게 Lerp
     - 2~20m: 자동 이동 (플레이어 입력 무시)
     - 20m+: 텔레포트 (GPS 점프)
  4. 물리 시뮬레이션 (충돌, 경사, 중력)
```

### Character Controller 인터페이스
```
- teleport(position)
- move(direction, speed)
- jump(force)
- update(deltaTime)
- getPosition()
- getVelocity()
```

---

## 5️⃣ 3D 네비게이션 카메라

### 카메라 위치 계산
```
기준:
  - 플레이어 위치: (px, py, pz)
  - 플레이어 방향: bearing (라디안)
  - 경로 진행 거리: 20m 앞

계산:
  lookAheadPos = playerPos + 20m × [cos(bearing), 0, sin(bearing)]
  
  cameraPos = lookAheadPos + offset
    offset = {
      x: -15 * sin(bearing)    // 우측 시야
      y: 8                       // 높이
      z: -15 * cos(bearing)     // 뒤쪽
    }
  
  lookAtPos = playerPos + [0, 1.6, 0]  // 플레이어 눈높이
```

### 보간 (Lerp)
```
camera.position.lerp(targetPos, 0.1)  // 부드러운 이동
camera.lookAt(targetLookAt)             // 관성 없이 즉시 (또는 Slerp)
```

---

## 6️⃣ Mapbox + Three.js Custom Layer

### 구조
```
Mapbox Map
  ├─ Base Layer (맵)
  ├─ Custom Layer (Three.js)
  │   └─ WebGL context 공유
  ├─ UI Layer (HUD)
  └─ Event Handlers
```

### 렌더링 파이프라인
```
requestAnimationFrame()
  ↓
GPS Update → Physics Step → Camera Update
  ↓
map.setCenter() (선택사항)
  ↓
Mapbox Render (Custom Layer 콜백)
  ↓
map.triggerRepaint() (강제 재렌더링)
```

---

## 7️⃣ 최적화 전략

### 1. 좌표 변환 캐싱
```javascript
// ❌ 나쁜 예
for (let coord of coords) {
  const merc = MercatorCoordinate.fromLngLat(coord);
  // 매번 변환
}

// ✅ 좋은 예
const mercCache = new Map();
function cachedMercatorTransform(lngLat) {
  const key = `${lngLat[0]},${lngLat[1]}`;
  if (!mercCache.has(key)) {
    mercCache.set(key, MercatorCoordinate.fromLngLat(lngLat));
  }
  return mercCache.get(key);
}
```

### 2. 고정 Timestep 물리
```javascript
const FIXED_TIMESTEP = 1/60;
let accumulator = 0;

gameLoop(deltaTime) {
  accumulator += deltaTime;
  while (accumulator >= FIXED_TIMESTEP) {
    physics.step(FIXED_TIMESTEP);
    accumulator -= FIXED_TIMESTEP;
  }
}
```

### 3. 형상 병합 (Batch)
```javascript
// 경로 좌표 2000개 → 1개 geometry
const routeGeometry = new THREE.BufferGeometry();
routeGeometry.setAttribute('position', positions);
const line = new THREE.Line(routeGeometry, material);
```

### 4. LOD (Level of Detail)
```javascript
// 고위도에서 coordinate 간격 증가
const decimationFactor = Math.max(1, Math.floor(lat / 70));
const decimatedCoords = coords.filter((_, i) => i % decimationFactor === 0);
```

---

## 📂 폴더 구조

```
src/features/map-game-v2/
├── core/
│   ├── map/
│   │   ├── CoordinateSystem.js      // Mercator ↔ World
│   │   ├── MapboxIntegration.js     // Mapbox 초기화
│   │   └── types.js                 // TypeScript 타입 (선택사항)
│   ├── three/
│   │   ├── SceneManager.js          // Scene, Renderer
│   │   ├── ThreeRenderer.js         // 렌더 루프
│   │   └── MaterialLibrary.js       // 재질 캐시
│   └── physics/
│       ├── PhysicsEngine.js         // Cannon.js 초기화
│       └── CharacterController.js   // 플레이어 제어
├── systems/
│   ├── navigation/
│   │   ├── NavigationManager.js     // 경로 관리
│   │   ├── RouteVisualizer.js       // 3D 경로 렌더링
│   │   └── RouteParser.js           // API 응답 파싱
│   ├── camera/
│   │   └── NavigationCamera.js      // 네비게이션 카메라
│   ├── player/
│   │   ├── PlayerManager.js         // 플레이어 상태
│   │   └── GPSManager.js            // GPS 데이터
│   └── terrain/
│       ├── TerrainLoader.js         // 지형 로드
│       └── TerrainCollider.js       // 지형 충돌
├── utils/
│   ├── mathUtils.js                 // 수학 함수
│   ├── performanceMonitor.js        // FPS, 메모리
│   └── kalmanFilter.js              // GPS 노이즈 제거
├── hooks/
│   ├── useGameLoop.js               // 게임 루프 훅
│   └── useMapbox.js                 // Mapbox 초기화 훅
├── components/
│   └── MapGameHUDV2.jsx             // UI
├── MapGameV2Page.jsx                // 메인 페이지
└── MapGameV2.css
```

---

## 🎮 초기화 순서

```
1. Mapbox 인스턴스 생성
2. Three.js Scene, Camera, Renderer 생성
3. Physics World 생성
4. Custom Layer 추가
5. GPS Manager 시작
6. Game Loop 시작
```

