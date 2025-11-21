# 개발 환경 설정 가이드

이 문서는 3D Community 프로젝트를 로컬에서 실행하고 개발하기 위한 가이드입니다.

## 목차
- [필수 요구사항](#필수-요구사항)
- [프로젝트 구조](#프로젝트-구조)
- [환경 설정](#환경-설정)
- [실행 방법](#실행-방법)
- [주요 기술 스택](#주요-기술-스택)
- [API 엔드포인트](#api-엔드포인트)
- [테스트 계정](#테스트-계정)
- [Git 브랜치 전략](#git-브랜치-전략)

---

## 필수 요구사항

### 프론트엔드
- Node.js 18.x 이상
- npm 9.x 이상

### 백엔드
- Java 21
- Gradle 8.x

### 데이터베이스
- PostgreSQL (Supabase 사용)

---

## 프로젝트 구조

```
3Dcommu/
├── public/                    # 정적 파일
│   └── resources/            # 3D 모델, 사운드 등
│       ├── Ultimate Animated Character Pack/  # 캐릭터 모델
│       ├── GameView/         # 맵 모델 (PublicSquare.glb)
│       └── Sounds/           # 효과음
├── src/                      # 프론트엔드 소스
│   ├── components/           # React 컴포넌트
│   │   ├── board/           # 게시판 관련
│   │   ├── AuthModal.js     # 로그인/회원가입 모달
│   │   ├── LandingPage.js   # 랜딩 페이지
│   │   └── Mapbox3D.js      # 지도 연동
│   ├── services/            # API 서비스
│   │   ├── authService.js   # 인증 API
│   │   └── boardService.js  # 게시판 API
│   ├── App.js               # 메인 앱 (3D 렌더링)
│   └── useKeyboardControls.js  # 키보드 입력 훅
├── backend/                  # Spring Boot 백엔드
│   └── src/main/java/com/community/
│       ├── config/          # 설정 (Security, CORS, DataInitializer)
│       ├── controller/      # REST 컨트롤러
│       ├── dto/             # 데이터 전송 객체
│       ├── model/           # JPA 엔티티
│       ├── repository/      # JPA 리포지토리
│       ├── security/        # JWT 인증
│       └── service/         # 비즈니스 로직
├── docs/                    # 문서
└── CLAUDE.md               # AI 어시스턴트용 컨텍스트
```

---

## 환경 설정

### 1. 프론트엔드 환경변수

프로젝트 루트에 `.env` 파일 생성:

```env
REACT_APP_API_URL=http://localhost:8080
REACT_APP_MAPBOX_TOKEN=your_mapbox_token_here
```

### 2. 백엔드 환경변수

`backend/src/main/resources/application.yml`에서 설정 확인:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://[SUPABASE_HOST]:6543/postgres?sslmode=require&prepareThreshold=0
    username: [SUPABASE_USER]
    password: [SUPABASE_PASSWORD]

jwt:
  secret: [JWT_SECRET_KEY]  # 최소 32자 이상
  expiration: 86400000      # 24시간 (ms)
```

> **주의**: `prepareThreshold=0`은 Supabase Transaction Pooler 사용 시 필수입니다.

### 3. Supabase 설정

1. [Supabase](https://supabase.com) 프로젝트 생성
2. Settings > Database > Connection string에서 **Transaction Pooler** URL 복사
3. 포트는 `6543` 사용 (Direct connection의 5432가 아님)

---

## 실행 방법

### 프론트엔드

```bash
# 의존성 설치
npm install --legacy-peer-deps

# 개발 서버 실행
npm start
```
- 접속: http://localhost:3000

### 백엔드

```bash
# backend 디렉토리에서
cd backend

# Gradle 빌드 및 실행
./gradlew bootRun
```
- 접속: http://localhost:8080

### 동시 실행
1. 터미널 1: 백엔드 실행 (`./gradlew bootRun`)
2. 터미널 2: 프론트엔드 실행 (`npm start`)

---

## 주요 기술 스택

### 프론트엔드
| 기술 | 버전 | 용도 |
|------|------|------|
| React | 19.1.1 | UI 프레임워크 |
| Three.js | 0.179.1 | 3D 렌더링 |
| React Three Fiber | 9.3.0 | React용 Three.js 바인딩 |
| React Three Drei | 10.7.4 | 3D 유틸리티 |
| React Three Rapier | 2.2.0 | 물리 엔진 |
| Mapbox GL | 2.15.0 | 지도 API |
| Axios | - | HTTP 클라이언트 |

### 백엔드
| 기술 | 버전 | 용도 |
|------|------|------|
| Spring Boot | 3.2.0 | 웹 프레임워크 |
| Spring Security | - | 인증/인가 |
| Spring Data JPA | - | ORM |
| PostgreSQL | - | 데이터베이스 |
| JWT (jjwt) | 0.12.x | 토큰 인증 |
| Lombok | 1.18.30 | 보일러플레이트 감소 |

---

## API 엔드포인트

### 인증 API (`/api/auth`)
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/register` | 회원가입 |
| POST | `/login` | 로그인 |
| GET | `/test` | API 테스트 |

**요청 예시 (로그인):**
```json
POST /api/auth/login
{
  "email": "test@test.com",
  "password": "test1234"
}
```

**응답:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "test@test.com",
    "username": "테스트유저"
  }
}
```

### 게시판 API (`/api/boards`)
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/` | 게시판 목록 |
| GET | `/{id}` | 게시판 상세 |
| POST | `/` | 게시판 생성 |

### 게시글 API (`/api/posts`)
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/board/{boardId}` | 게시글 목록 |
| GET | `/{id}` | 게시글 상세 |
| POST | `/` | 게시글 작성 |
| PUT | `/{id}` | 게시글 수정 |
| DELETE | `/{id}` | 게시글 삭제 |

---

## 테스트 계정

백엔드 시작 시 자동 생성:

| 이메일 | 비밀번호 |
|--------|----------|
| test@test.com | test1234 |

---

## Git 브랜치 전략

| 브랜치 | 용도 |
|--------|------|
| `main` | 프로덕션 배포용 |
| `dev` | 개발 통합 브랜치 |
| `backend` | 백엔드 개발 |
| `backend-new` | 백엔드 신규 기능 |
| `API` | API 개발 |

### 작업 흐름
1. `dev` 또는 `backend`에서 feature 브랜치 생성
2. 작업 후 PR 생성
3. 코드 리뷰 후 병합

---

## 3D 캐릭터 조작법

| 키 | 동작 |
|----|------|
| W / ↑ | 전진 |
| S / ↓ | 후진 |
| A / ← | 좌회전 |
| D / → | 우회전 |
| Shift | 달리기 |
| C | 카메라 위치 로그 (디버그) |

---

## 물리 엔진 설정

- **엔진**: Rapier
- **중력**: `[0, -40, 0]`
- **캐릭터 콜라이더**: CapsuleCollider
- **맵 콜라이더**: Trimesh

디버그 모드는 `App.js`의 `<Physics debug>` 속성으로 토글 가능.

---

## 자주 발생하는 문제

### 1. `prepared statement "S_1" already exists`
- **원인**: Supabase Transaction Pooler 사용 시 발생
- **해결**: JDBC URL에 `prepareThreshold=0` 추가

### 2. `Illegal base64 character: '_'`
- **원인**: JWT secret이 Base64 형식이 아님
- **해결**: `JwtTokenProvider.java`에서 UTF-8 바이트 변환 사용

### 3. CORS 오류
- **원인**: 프론트엔드/백엔드 포트 불일치
- **해결**: `SecurityConfig.java`에서 CORS 설정 확인

### 4. npm 의존성 충돌
- **해결**: `npm install --legacy-peer-deps` 사용

---

## 추가 문서

- [REQUIREMENTS.md](./REQUIREMENTS.md) - 요구사항 정의
- [DESIGN.md](./DESIGN.md) - 설계 문서
- [CLAUDE.md](../CLAUDE.md) - AI 어시스턴트용 컨텍스트
