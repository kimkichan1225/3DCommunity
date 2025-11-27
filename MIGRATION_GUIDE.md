# 컴포넌트 구조 마이그레이션 가이드

## 🎯 변경 사항 요약

**날짜**: 2025-11-28
**목적**: Git 충돌 방지를 위한 features/ 기반 구조로 전환

## 📂 새로운 폴더 구조

```
src/
├── features/                       # 기능별 모듈 (NEW!)
│   ├── auth/                      # 인증 시스템
│   │   ├── components/
│   │   │   └── LandingPage.jsx
│   │   ├── services/
│   │   │   └── authService.js
│   │   └── index.js
│   │
│   ├── board/                     # 게시판
│   │   ├── components/
│   │   │   ├── BoardModal.jsx
│   │   │   ├── BoardList.jsx
│   │   │   ├── BoardDetail.jsx
│   │   │   └── PostForm.jsx
│   │   ├── services/
│   │   │   └── boardService.js
│   │   └── index.js
│   │
│   ├── profile/                   # 프로필
│   │   ├── components/
│   │   │   └── ProfileModal.jsx
│   │   ├── services/
│   │   │   └── profileService.js
│   │   └── index.js
│   │
│   ├── map/                       # 지도
│   │   ├── components/
│   │   │   └── Mapbox3D.jsx
│   │   └── index.js
│   │
│   └── system/settings/           # 설정
│       ├── components/
│       │   └── SettingModal.jsx
│       └── index.js
│
└── components/                     # 3D 관련 컴포넌트 (유지)
    ├── character/
    ├── camera/
    └── map/
```

## 🔄 마이그레이션된 파일

### 이동된 파일 목록

| 기존 경로 | 새 경로 |
|----------|---------|
| `components/LandingPage.js` | `features/auth/components/LandingPage.jsx` |
| `services/authService.js` | `features/auth/services/authService.js` |
| `components/BoardModal.js` | `features/board/components/BoardModal.jsx` |
| `components/BoardList.js` | `features/board/components/BoardList.jsx` |
| `components/BoardDetail.js` | `features/board/components/BoardDetail.jsx` |
| `components/PostForm.js` | `features/board/components/PostForm.jsx` |
| `services/boardService.js` | `features/board/services/boardService.js` |
| `components/ProfileModal.js` | `features/profile/components/ProfileModal.jsx` |
| `services/profileService.js` | `features/profile/services/profileService.js` |
| `components/Mapbox3D.js` | `features/map/components/Mapbox3D.jsx` |
| `components/SettingModal.js` | `features/system/settings/components/SettingModal.jsx` |

### 유지되는 파일 (3D 관련)

- `components/character/Character.jsx`
- `components/camera/CameraController.jsx`
- `components/camera/CameraLogger.jsx`
- `components/map/Level1.jsx`
- `components/map/Level1Map.jsx`
- `components/map/Sky.jsx`

## 📝 코드 변경 사항

### App.js Import 변경

**이전:**
```javascript
import LandingPage from './components/LandingPage';
import BoardModal from './components/BoardModal';
import ProfileModal from './components/ProfileModal';
import SettingModal from './components/SettingModal';
import Mapbox3D from './components/Mapbox3D';
```

**이후:**
```javascript
import { LandingPage } from './features/auth';
import { BoardModal } from './features/board';
import { ProfileModal } from './features/profile';
import { SettingModal } from './features/system/settings';
import { Mapbox3D } from './features/map';
```

### 서비스 간 참조 변경

**예시: boardService에서 authService 참조**

**이전:**
```javascript
import authService from './authService';
```

**이후:**
```javascript
import authService from '../../auth/services/authService';
```

## 🚀 새로운 import 방식

각 feature 폴더에 `index.js`가 있어 깔끔한 import가 가능합니다:

```javascript
// 한 모듈에서 여러 항목 import
import { BoardModal, BoardList, boardService } from './features/board';

// 단일 항목 import
import { LandingPage } from './features/auth';
```

## ✅ 장점

### 1. Git 충돌 방지
```
팀원 A: features/board/ 작업
팀원 B: features/profile/ 작업
→ 다른 폴더 = 충돌 0%
```

### 2. 명확한 책임 분리
```
features/board/
├── components/  → UI 담당자
└── services/    → API 담당자
→ 다른 파일 = 충돌 없음
```

### 3. 확장 용이
```
새 기능 추가:
features/chat/
├── components/
├── services/
└── index.js
→ 기존 코드 수정 최소화
```

## 🔧 작업 시 주의사항

### 1. import 경로 확인
새로 파일을 만들 때 상대 경로를 정확히 설정하세요:
```javascript
// features/board/components/BoardModal.jsx
import boardService from '../services/boardService'; // ✅ 올바름
import boardService from './services/boardService';  // ❌ 잘못됨
```

### 2. CSS 파일 위치
CSS는 해당 컴포넌트와 같은 폴더에 위치합니다:
```
features/board/components/
├── BoardModal.jsx
└── BoardModal.css
```

### 3. 공통 서비스 참조
authService는 여러 곳에서 사용되므로 경로를 정확히:
```javascript
// features/profile/ 에서
import authService from '../../auth/services/authService';

// features/board/ 에서
import authService from '../../auth/services/authService';
```

## 📋 앞으로 추가될 기능 구조

```
features/
├── social/                    # 소셜 기능
│   ├── chat/
│   ├── friends/
│   └── userList/
├── minigame/                  # 미니게임
├── customization/             # 커스터마이징
├── shop/                      # 상점
└── admin/                     # 관리자
```

## 🐛 문제 해결

### 빌드 에러 발생 시

1. **Module not found 에러**
   ```bash
   # node_modules 재설치
   npm install
   ```

2. **import 경로 에러**
   - 상대 경로 확인 (`../` 개수 확인)
   - 파일 확장자 확인 (`.jsx` vs `.js`)

3. **CSS가 적용 안 될 때**
   - CSS 파일이 같은 폴더에 있는지 확인
   - import 문에서 `./` 사용했는지 확인

### 기존 파일 삭제 여부

⚠️ **아직 삭제하지 마세요!**
- 기존 `components/` 폴더의 파일들은 백업으로 유지
- 빌드 및 테스트 완료 후 안전하게 삭제 예정

## 📞 문의

문제 발생 시:
1. `MIGRATION_GUIDE.md` 참고
2. `필독.md`의 "Git 충돌 대비 방안" 섹션 확인
3. 팀 채팅방에 질문

---

**작성자**: Claude Code
**버전**: v1.0
**마지막 업데이트**: 2025-11-28
