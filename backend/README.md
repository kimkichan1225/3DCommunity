# 3D Community Backend

Spring Boot 기반의 3D 커뮤니티 백엔드 API 서버입니다.

## 기술 스택

- **Java 17**
- **Spring Boot 3.2.0**
- **Spring Security** - JWT 기반 인증
- **Spring Data JPA** - 데이터베이스 ORM
- **H2 Database** - 개발용 인메모리 DB
- **MySQL** - 프로덕션 DB
- **Gradle** - 빌드 도구
- **Lombok** - 보일러플레이트 코드 감소

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

## H2 콘솔

개발 환경에서 H2 데이터베이스 콘솔에 접속할 수 있습니다:

- URL: `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:mem:communitydb`
- Username: `sa`
- Password: (비어있음)

## 환경 설정

### application.yml

개발 환경과 프로덕션 환경의 설정이 분리되어 있습니다.

- **개발**: H2 인메모리 데이터베이스
- **프로덕션**: MySQL 데이터베이스 (프로파일: `prod`)

프로덕션 모드로 실행:
```bash
./gradlew bootRun --args='--spring.profiles.active=prod'
```

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
