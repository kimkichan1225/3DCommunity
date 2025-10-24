
# 🌐 3D Community - 위치기반 소셜 메타버스

React, Three.js, Spring Boot를 활용한 위치기반 3D 소셜 커뮤니티 플랫폼입니다. 실제 위치와 연동된 가상 공간에서 다른 사용자들과 만나고 소통하며 다양한 활동을 즐길 수 있습니다.

## ✨ 주요 기능

### 🎯 3D 가상 광장 (메인 화면)
- **실시간 3D 렌더링**: Three.js와 React Three Fiber를 활용한 고품질 3D 그래픽
- **동적 조명**: 그림자와 조명 효과가 적용된 몰입감 있는 환경
- **다중 사용자 지원**: 실시간으로 다른 사용자들과 만남

### 👤 회원 시스템 (Spring Boot)
- **회원가입/로그인**: JWT 기반 인증 시스템
- **프로필 관리**: 사용자 정보 및 프로필 커스터마이징
- **소셜 기능**: 친구 추가, 친구 목록 관리

### 🚶‍♂️ 캐릭터 시스템
- **개인 캐릭터**: 로그인 후 3D 광장에 생성되는 나만의 캐릭터 (BaseCharacter.gltf)
- **애니메이션**: 걷기, 뛰기, 대기 등 다양한 애니메이션
- **키보드/터치 조작**: WASD 및 방향키로 캐릭터 이동
- **커스터마이징**: 캐릭터 외형, 의상, 액세서리 변경

### 💬 실시간 소셜 기능
- **채팅 시스템**: 광장 내 실시간 채팅
- **사용자 상호작용**: 다른 캐릭터와 상호작용
- **친구 관리**: 친구 추가, 삭제, 친구 목록
- **프로필 보기**: 다른 사용자 프로필 확인

### 🎮 미니게임 시스템
- **게임 생성**: 사용자가 직접 미니게임 방 생성
- **게임 참가**: 다양한 미니게임 참여
- **관전 모드**: 게임 관전 기능
- **게임 관리**: 생성한 게임 삭제 및 관리

### 🗺️ 위치 기반 시스템
- **지도 API 연동**: 실제 지리 정보와 연동
- **GPS 기반**: 사용자의 실제 위치 활용
- **랜드마크 맵**: 주요 랜드마크에 기본 맵 제작
- **커스텀 방 생성**: 자신의 위치에 새로운 방(맵) 생성
- **근거리 접속**: 방 생성 위치 주변 사람들만 접속 가능
- **지도에서 확인**: 생성된 방을 지도 API에서 확인

### 💰 상점 및 결제 시스템
- **아이템 상점**: 캐릭터 커스터마이징 아이템 구매
- **결제 연동**: 실제 결제 시스템 연동
- **인벤토리**: 구매한 아이템 관리

## 🎮 조작법

| 키 | 기능 |
|---|---|
| `W` / `↑` | 앞으로 이동 |
| `S` / `↓` | 뒤로 이동 |
| `A` / `←` | 왼쪽으로 이동 |
| `D` / `→` | 오른쪽으로 이동 |
| `Shift` | 달리기 (이동 키와 함께) |
| `E` | 상호작용 (자동차, NPC, 오브젝트 등) |
| `Enter` | 채팅 입력 |
| `Tab` | 메뉴 열기 (프로필, 친구, 상점, 설정) |

## 🏗️ 시스템 구조

### 메인 화면 (3D 광장)
광장을 배경으로 로그인하지 않은 사용자에게 표시되는 초기 화면
- **회원가입 버튼**: 새 계정 생성
- **로그인 버튼**: 기존 계정으로 접속
- **배경**: 3D 광장 환경 (다른 사용자들의 활동 보임)

### 로그인 후 광장
- **개인 캐릭터 생성**: BaseCharacter.gltf 기반 캐릭터가 광장에 스폰
- **실시간 멀티플레이**: 다른 사용자들의 캐릭터 확인
- **상호작용**: 채팅, 친구 추가, 미니게임 참여 등

### 커스텀 방 (위치 기반)
- **방 생성**: 자신의 위치에서 새로운 3D 공간 생성
- **접근 제한**: GPS 기반 근거리 사용자만 접속 가능
- **지도 표시**: 생성된 방이 지도 API에 마커로 표시

## 🛠️ 기술 스택

### Frontend
- **React 19.1.1**: 최신 React 기능 활용
- **Three.js 0.179.1**: 3D 그래픽 렌더링
- **React Three Fiber 9.3.0**: React와 Three.js 통합
- **React Three Drei 10.7.4**: Three.js 헬퍼 라이브러리
- **Socket.io-client**: 실시간 통신 (채팅, 멀티플레이)
- **Axios**: HTTP 통신 (REST API)
- **React Router**: SPA 라우팅
- **Zustand / Redux**: 상태 관리

### Backend
- **Spring Boot 3.x**: 메인 백엔드 프레임워크
- **Spring Security**: 인증 및 권한 관리
- **JWT**: 토큰 기반 인증
- **Spring Data JPA**: 데이터베이스 ORM
- **WebSocket / Socket.io**: 실시간 통신
- **MySQL / PostgreSQL**: 관계형 데이터베이스
- **Redis**: 세션 관리 및 캐싱

### 위치 기반 서비스
- **Kakao Maps API / Google Maps API**: 지도 서비스
- **Geolocation API**: GPS 위치 정보
- **Turf.js**: 지리 공간 계산

### 3D 에셋
- **캐릭터**: BaseCharacter.gltf
- **환경**: 커스텀 3D 모델 (광장, 커스텀 방)
- **자동차**: Kenney Car Kit (미니게임용)

### 결제
- **PortOne (구 아임포트)**: 통합 결제 시스템
- **Toss Payments / Kakao Pay**: PG 연동

### 배포 및 인프라
- **Frontend**: Netlify / Vercel
- **Backend**: AWS EC2 / AWS Elastic Beanstalk
- **Database**: AWS RDS
- **파일 저장소**: AWS S3 (캐릭터 이미지, 3D 모델)
- **CI/CD**: GitHub Actions

## 🚀 설치 및 실행

### 필요 조건
- **Frontend**: Node.js 18.0 이상, npm 또는 yarn
- **Backend**: JDK 17 이상, Maven 또는 Gradle
- **Database**: MySQL 8.0 이상 또는 PostgreSQL 14 이상
- **Redis**: Redis 6.0 이상 (선택사항)

### Frontend 설치 및 실행
```bash
# 저장소 클론
git clone https://github.com/kimkichan1225/3DCommunity
cd 3DCommunity

# 의존성 설치
npm install

# 개발 서버 실행
npm start
```
브라우저에서 `http://localhost:3000`으로 접속

### Backend 설정 및 실행
```bash
# Backend 디렉토리로 이동
cd backend

# application.properties 또는 application.yml 설정
# - 데이터베이스 연결 정보
# - JWT 비밀키
# - 지도 API 키
# - 결제 API 키

# Gradle 빌드 및 실행
./gradlew bootRun

# 또는 Maven 사용시
./mvnw spring-boot:run
```
백엔드 서버는 `http://localhost:8080`에서 실행

### 환경 변수 설정
프론트엔드 `.env` 파일:
```env
REACT_APP_API_URL=http://localhost:8080
REACT_APP_SOCKET_URL=http://localhost:8080
REACT_APP_MAP_API_KEY=your_map_api_key
REACT_APP_MAPBOX_TOKEN=your_mapbox_token_here
```

백엔드 `application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/community_db
    username: your_username
    password: your_password
  jpa:
    hibernate:
      ddl-auto: update

jwt:
  secret: your_jwt_secret_key
  expiration: 86400000

map:
  api:
    key: your_map_api_key
```

## 🌐 배포

### Frontend 배포 (Netlify/Vercel)
```bash
# 프로덕션 빌드
npm run build

# Netlify CLI로 배포
netlify deploy --prod

# 또는 Vercel CLI로 배포
vercel --prod
```

### Backend 배포 (AWS)
```bash
# JAR 파일 생성
./gradlew build

# AWS Elastic Beanstalk 또는 EC2에 배포
# Docker 컨테이너화 후 배포 권장
```

## 🌐 Netlify 배포

### 방법 1: Netlify CLI 사용
```bash
# Netlify CLI 설치
npm install -g netlify-cli

# 빌드
npm run build

# Netlify에 배포
netlify deploy --prod
```

### 방법 2: Git 연동 (권장)
1. GitHub/GitLab에 코드를 푸시
2. [Netlify](https://www.netlify.com/)에 로그인
3. "New site from Git" 클릭
4. 저장소 선택
5. 빌드 설정 자동 감지 (netlify.toml 사용)
6. "Deploy site" 클릭

### 방법 3: 드래그 앤 드롭
```bash
npm run build
```
빌드 후 생성된 `build` 폴더를 [Netlify Drop](https://app.netlify.com/drop)에 드래그 앤 드롭

### 배포 설정
- **빌드 명령어**: `npm run build`
- **배포 디렉토리**: `build`
- **Node 버전**: 18

## 📁 프로젝트 구조

```
3DCommunity/
├── frontend/               # React 프론트엔드
│   ├── public/
│   │   ├── resources/          # 3D 모델 및 텍스처
│   │   │   ├── characters/     # 캐릭터 모델
│   │   │   │   └── BaseCharacter.gltf
│   │   │   ├── environments/   # 환경 모델
│   │   │   └── items/          # 아이템 모델
│   │   └── sounds/             # 오디오 파일
│   ├── src/
│   │   ├── components/         # React 컴포넌트
│   │   │   ├── 3d/            # 3D 관련 컴포넌트
│   │   │   │   ├── Character.jsx
│   │   │   │   ├── Plaza.jsx
│   │   │   │   └── Room.jsx
│   │   │   ├── auth/          # 인증 관련
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   ├── ui/            # UI 컴포넌트
│   │   │   │   ├── ChatBox.jsx
│   │   │   │   ├── ProfileMenu.jsx
│   │   │   │   └── Shop.jsx
│   │   │   └── map/           # 지도 관련
│   │   │       └── MapView.jsx
│   │   ├── services/          # API 서비스
│   │   │   ├── authService.js
│   │   │   ├── chatService.js
│   │   │   └── mapService.js
│   │   ├── store/             # 상태 관리
│   │   ├── hooks/             # 커스텀 훅
│   │   └── App.js
│   └── package.json
│
├── backend/                # Spring Boot 백엔드
│   ├── src/main/java/com/community/
│   │   ├── controller/        # REST API 컨트롤러
│   │   │   ├── AuthController.java
│   │   │   ├── UserController.java
│   │   │   ├── ChatController.java
│   │   │   └── RoomController.java
│   │   ├── service/           # 비즈니스 로직
│   │   ├── repository/        # 데이터베이스 접근
│   │   ├── model/             # 엔티티 모델
│   │   ├── dto/               # 데이터 전송 객체
│   │   ├── security/          # 보안 설정
│   │   └── websocket/         # WebSocket 설정
│   ├── src/main/resources/
│   │   └── application.yml
│   └── build.gradle
│
└── README.md
```

## 🎨 주요 기능 상세

### 회원 시스템
- JWT 기반 토큰 인증
- 회원가입 시 이메일 인증
- 소셜 로그인 (Google, Kakao)
- 비밀번호 암호화 (BCrypt)

### 실시간 통신
- WebSocket을 통한 실시간 채팅
- Socket.io로 사용자 위치 동기화
- 서버-클라이언트 양방향 통신

### 위치 기반 기능
- 사용자 현재 위치 추적
- 반경 내 방 검색
- 지도에 방 마커 표시
- 거리 계산 및 필터링

## 🔧 개발 정보

### API 엔드포인트 (예시)
```
POST   /api/auth/register      # 회원가입
POST   /api/auth/login         # 로그인
GET    /api/users/profile      # 프로필 조회
PUT    /api/users/profile      # 프로필 수정
GET    /api/rooms              # 방 목록 조회
POST   /api/rooms              # 방 생성
GET    /api/friends            # 친구 목록
POST   /api/friends/add        # 친구 추가
GET    /api/shop/items         # 상점 아이템 조회
POST   /api/shop/purchase      # 아이템 구매
```

### WebSocket 이벤트
```
chat:message          # 채팅 메시지
user:join             # 사용자 입장
user:leave            # 사용자 퇴장
character:move        # 캐릭터 이동
game:create           # 게임 생성
game:join             # 게임 참가
```

### 성능 최적화
- 3D 모델 LOD (Level of Detail) 적용
- 캐릭터 인스턴싱으로 다중 사용자 렌더링 최적화
- Redis 캐싱으로 DB 부하 감소
- CDN을 통한 정적 파일 제공

### 브라우저 및 플랫폼 지원
- **데스크톱**: Chrome, Firefox, Safari, Edge (WebGL 2.0 지원 필수)
- **모바일**: iOS Safari, Android Chrome (터치 컨트롤 지원)
- **크로스플랫폼**: 반응형 디자인으로 웹/모바일 동시 지원

## 📱 모바일 지원

### 터치 컨트롤
- 가상 조이스틱으로 캐릭터 이동
- 탭으로 상호작용
- 핀치 줌으로 카메라 조절

## 🔒 보안

- XSS 공격 방지
- CSRF 토큰 검증
- SQL Injection 방지 (Prepared Statement)
- HTTPS 통신 강제
- 비밀번호 해싱 (BCrypt)
- JWT 토큰 만료 및 갱신

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 연락처

- GitHub: [@kimkichan1225](https://github.com/kimkichan1225)
- Repository: [3DCommunity](https://github.com/kimkichan1225/3DCommunity)

---

**3D Community에서 새로운 소셜 경험을 시작하세요! 🌐✨**