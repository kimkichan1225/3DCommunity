# 🎮 GPS 기반 멀티플레이어 맵 가이드

## 📍 구현 완료 기능

### ✅ 실시간 플레이어 동기화 (MapGamePageV2)

**구현된 기능:**
- ✅ GPS 기반 실시간 위치 추적
- ✅ WebSocket을 통한 위치 브로드캐스트 (1초마다)
- ✅ 근처 플레이어 자동 렌더링 (100m 내)
- ✅ 3D 캐릭터 모델 표시
- ✅ 플레이어 닉네임 표시 (Nameplate)
- ✅ 위치 보간 애니메이션 (부드러운 이동)
- ✅ 원격 플레이어 정리 (플레이어 나감)

---

## 🚀 시작하기

### 1️⃣ 백엔드 서버 실행

```bash
cd backend
./gradlew bootRun
```

- Spring Boot 서버가 8080포트에서 실행됨
- WebSocket: `ws://localhost:8080/ws`

### 2️⃣ 프론트엔드 서버 실행

```bash
npm start
```

- React 개발 서버가 3000포트에서 실행됨
- 자동으로 `http://localhost:3000` 오픈

### 3️⃣ 지도 페이지 접속

```
http://localhost:3000/map-game
```

---

## 🎯 테스트 방법

### 테스트 1️⃣: 단일 플레이어 확인
1. `/map-game` 접속
2. 브라우저 콘솔에서 위치 업데이트 확인
3. 좌측 GPS 맵에서 자신의 위치 확인

### 테스트 2️⃣: 멀티플레이어 (2명 이상)
1. **플레이어 1**: 브라우저 1에서 `/map-game` 접속
2. **플레이어 2**: 다른 브라우저에서 동시에 `/map-game` 접속
3. 콘솔 확인:
   - "🎮 Player joined: [플레이어 2 닉네임]"
4. 각 플레이어의 우측 3D 화면에서:
   - 상대방의 캐릭터가 실시간으로 움직임
   - 상대방의 닉네임이 캐릭터 위에 표시됨

### 테스트 3️⃣: GPS 시뮬레이션 (테스트용)
```javascript
// useMapGame 옵션에서 설정
const {
  ...
} = useMapGame(canvasRef.current, {
  simulationMode: true,  // GPS 없이 테스트
  ...
});
```

---

## 🔧 기술 아키텍처

### 데이터 흐름

```
┌─────────────────────────────────────────────┐
│   플레이어 A (MapGamePageV2)               │
│   - GPS 위치 추적                          │
│   - 1초마다 위치 업데이트 전송             │
└──────────────┬──────────────────────────────┘
               │ WebSocket
               │ /app/player.position
               ▼
┌─────────────────────────────────────────────┐
│   백엔드 (MultiplayerController)           │
│   - 위치 수신                              │
│   - 모든 클라이언트에 브로드캐스트        │
│   - /topic/positions                       │
└──────────────┬──────────────────────────────┘
               │ WebSocket
               │ /topic/positions
               ▼
┌─────────────────────────────────────────────┐
│   플레이어 B (MapGamePageV2)               │
│   - 위치 수신                              │
│   - GameManager.updateRemotePlayer() 호출  │
│   - 우측 3D 화면에 캐릭터 렌더링          │
└─────────────────────────────────────────────┘
```

### 파일 구조

**프론트엔드:**
```
src/pages/
├── MapGamePageV2.jsx          ← MultiplayerService 통합
└── ...

src/features/map-game-v2/
├── hooks/
│   └── useMapGame.js          ← updateRemotePlayer/removeRemotePlayer 추가
├── core/
│   └── GameManager.js         ← 원격 플레이어 렌더링 로직
└── ...

src/services/
└── multiplayerService.js      ← WebSocket 위치 브로드캐스트
```

**백엔드:**
```
backend/src/main/java/com/community/
├── controller/
│   └── MultiplayerController.java  ← @MessageMapping("/player.position")
├── dto/
│   └── PlayerPositionDto.java      ← 위치 데이터 구조
└── ...
```

---

## 📊 성능 최적화

### 렌더링 거리 제한
```javascript
// GameManager.js
this.remotePlayerDistance = 100; // 100m 이내만 렌더링
```

### 위치 업데이트 빈도
```javascript
// MapGamePageV2.jsx
const positionInterval = setInterval(() => {
  multiplayerServiceRef.current.sendPositionUpdate(...);
}, 1000); // 1초마다 업데이트
```

### 위치 보간 (Interpolation)
```javascript
// GameManager.js updateRemotePlayer()
const speed = 0.15; // 부드러운 이동 (0~1 사이의 값)
remotePlayer.mesh.position.x += (newPos[0] - oldPos.x) * speed;
```

---

## 🐛 디버깅

### 콘솔 확인
```javascript
// 브라우저 개발자 도구 (F12)
// Console 탭에서 다음 메시지 확인:

✅ "🎮 Player joined: [플레이어명]"
✅ "👋 Player left: [플레이어명]"
✅ 매초마다 위치 업데이트 수신
```

### 네트워크 탭 확인
```
WebSocket 연결: ws://localhost:8080/ws
메시지 송신: /app/player.position (1초마다)
메시지 수신: /topic/positions (다른 플레이어의 위치)
```

### 3D 화면 확인
- 좌측 GPS 맵: 플레이어의 실제 위치
- 우측 3D 환경: 근처 플레이어의 캐릭터 표시

---

## ⚙️ 설정 변경

### 위치 업데이트 속도 조정
```javascript
// MapGamePageV2.jsx
setInterval(() => { ... }, 1000); // 1000ms = 1초
// 500ms로 변경하면 2초에 2번 업데이트
```

### 렌더링 거리 조정
```javascript
// GameManager.js
this.remotePlayerDistance = 100; // 100m → 원하는 거리로 변경
```

### 위치 보간 속도 조정
```javascript
// GameManager.js updateRemotePlayer()
const speed = 0.15; // 0.15 → 0.3 (더 빠른 이동)
```

---

## 🔍 Level1 맵과의 비교

| 기능 | Level1 | Map (V2) |
|------|--------|---------|
| 멀티플레이어 동기화 | ✅ | ✅ |
| 실시간 위치 추적 | ✅ Three.js | ✅ Three.js + GPS |
| 닉네임 표시 | ✅ | ✅ |
| 위치 보간 | ✅ | ✅ |
| GPS 기반 | ❌ | ✅ |
| 거리 제한 | ❌ (같은 방) | ✅ (100m) |

---

## 🚨 알려진 제한사항

### 1️⃣ GPS 권한 필수
- 모바일 기기에서 GPS 권한이 필요합니다
- 권한이 없으면 시뮬레이션 모드로 전환 가능

### 2️⃣ 네트워크 지연
- WebSocket 지연으로 인해 약간의 위치 차이 발생 가능
- 위치 보간으로 완화됨

### 3️⃣ 렌더링 거리
- 100m 이상 떨어진 플레이어는 렌더링되지 않음
- 성능 최적화를 위한 설계

---

## 📈 향후 개선 사항

### Priority 1 (필수)
- [ ] 백엔드에 player location 테이블 생성
- [ ] 거리 기반 필터링 (서버 사이드)
- [ ] 연결 끊김 시 자동 정리

### Priority 2 (권장)
- [ ] 상대 플레이어 목록 UI
- [ ] 플레이어 상태 표시 (idle/walk/run)
- [ ] 플레이어 아바타 동기화

### Priority 3 (선택)
- [ ] 플레이어 상호작용 (미니게임, 친구추가)
- [ ] 플레이어 검색 기능
- [ ] 갱신 내역 저장

---

## 📞 문의

문제가 발생하면:
1. 브라우저 콘솔(F12) 확인
2. Network 탭에서 WebSocket 연결 확인
3. 백엔드 로그 확인 (터미널)
4. 다시 시작 (브라우저/서버)

---

**마지막 업데이트**: 2025-12-31
