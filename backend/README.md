# 3D Community Backend

Spring Boot 기반의 3D 커뮤니티 백엔드 API 서버입니다.

## 기술 스택

- **Java 17**
- **Spring Boot 3.2.0**
- **Spring Security** - JWT 기반 인증
- **Spring Data JPA** - 데이터베이스 ORM
- **PostgreSQL** - 데이터베이스
- **Gradle** - 빌드 도구
- **Lombok** - 보일러플레이트 코드 감소

## 사전 준비

### PostgreSQL 설치 및 설정

1. **PostgreSQL 설치**
   - Windows: https://www.postgresql.org/download/windows/
   - Mac: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql`

2. **데이터베이스 생성**
```sql
-- PostgreSQL에 접속
psql -U postgres

-- 데이터베이스 생성
CREATE DATABASE community_db;

-- 확인
\l
```

3. **환경 변수 설정 (선택사항)**

개발 환경에서는 기본값 사용 가능:
- DB_URL: `jdbc:postgresql://localhost:5432/community_db`
- DB_USERNAME: `postgres`
- DB_PASSWORD: `password`
- DB_DDL_AUTO: `update` (개발용) / `validate` (프로덕션)

프로덕션 환경에서는 환경 변수로 설정:
```bash
export DB_URL=jdbc:postgresql://your-host:5432/community_db
export DB_USERNAME=your_username
export DB_PASSWORD=your_password
export DB_DDL_AUTO=validate
export JWT_SECRET=your-secret-key
export LOG_LEVEL=INFO
```

## 실행 방법

### 1. Gradle을 사용한 실행

```bash
cd backend
./gradlew bootRun
```

### 2. IDE에서 실행

`CommunityApplication.java` 파일을 실행합니다.

서버는 `http://localhost:8080`에서 실행됩니다.

## API 엔드포인트

### 인증 API

#### 회원가입
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

#### 로그인
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

응답:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "role": "ROLE_USER",
    "createdAt": "2025-01-01T00:00:00"
  },
  "message": "로그인 성공"
}
```

#### 테스트
```
GET /api/auth/test
```

## 환경 설정

### application.yml

PostgreSQL 데이터베이스를 사용하며, 환경 변수로 설정을 변경할 수 있습니다.

**주요 환경 변수:**
- `DB_URL`: 데이터베이스 URL (기본: `jdbc:postgresql://localhost:5432/community_db`)
- `DB_USERNAME`: 데이터베이스 사용자명 (기본: `postgres`)
- `DB_PASSWORD`: 데이터베이스 비밀번호 (기본: `password`)
- `DB_DDL_AUTO`: Hibernate DDL 모드 (기본: `update`)
- `JWT_SECRET`: JWT 토큰 비밀키
- `LOG_LEVEL`: 로그 레벨 (기본: `DEBUG`)

개발 환경에서는 기본값으로 바로 실행 가능합니다.

## 보안

- **JWT 토큰**: 24시간 유효
- **BCrypt**: 비밀번호 암호화
- **CORS**: `http://localhost:3000` 허용 (React 개발 서버)

## 프로젝트 구조

```
backend/
├── src/main/java/com/community/
│   ├── CommunityApplication.java    # 메인 애플리케이션
│   ├── config/
│   │   └── SecurityConfig.java      # Spring Security 설정
│   ├── controller/
│   │   └── AuthController.java      # 인증 API 컨트롤러
│   ├── dto/
│   │   ├── AuthResponse.java
│   │   ├── LoginRequest.java
│   │   ├── RegisterRequest.java
│   │   └── UserDto.java
│   ├── model/
│   │   └── User.java                # User 엔티티
│   ├── repository/
│   │   └── UserRepository.java      # User 리포지토리
│   ├── security/
│   │   ├── JwtAuthenticationFilter.java
│   │   └── JwtTokenProvider.java
│   └── service/
│       ├── AuthService.java
│       └── CustomUserDetailsService.java
└── src/main/resources/
    └── application.yml              # 애플리케이션 설정
```

## 다음 단계

- [ ] WebSocket 실시간 통신 구현
- [ ] 채팅 시스템 구현
- [ ] 친구 관리 API
- [ ] 위치 기반 방 생성 API
- [ ] 미니게임 시스템 API
