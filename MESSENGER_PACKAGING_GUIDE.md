# 메신저 앱 패키징 및 배포 가이드 (Electron Packaging Guide)

이 문서는 개발이 완료된 메신저 앱을 일반 사용자가 설치할 수 있는 `.exe` 파일로 만들고 배포하는 방법을 상세히 설명합니다.

---

## 1. 사전 준비 사항

패키징을 시작하기 전에 다음 항목들이 준비되었는지 확인하세요.

### A. 아이콘 파일 (중요)
`Messenger_v2` 폴더 내에 `assets` 폴더를 만들고 아이콘을 준비해야 빌드 에러가 발생하지 않습니다.
- **Windows**: `assets/icon.ico` (256x256 권장)
- **Mac**: `assets/icon.icns`
- **Linux**: `assets/icon.png`

### B. 배포용 환경 변수 설정
Render에 배포된 백엔드 주소를 사용하도록 `.env` 파일을 업데이트해야 합니다.
```env
# Messenger_v2/.env
REACT_APP_API_URL=https://your-backend.onrender.com
REACT_APP_SOCKET_URL=https://your-backend.onrender.com
```

---

## 2. 패키징 단계 (Windows 기준)

터미널에서 `Messenger_v2` 폴더로 이동한 후 다음 명령어를 순서대로 입력합니다.

### 1단계: 의존성 설치
```bash
npm install
```

### 2단계: 프로덕션 빌드 및 패키징
현재 `package.json`에 정의된 통합 명령어를 사용합니다.
```bash
npm run electron:build
```
이 명령어는 내부적으로 다음 과정을 수행합니다:
1. `webpack`: React 코드를 최적화된 JS 파일로 빌드 (`build/` 폴더)
2. `electron-builder`: 빌드된 코드와 Electron 러너를 묶어 설치 파일 생성

---

## 3. 결과물 확인

빌드가 완료되면 **`Messenger_v2/dist`** 폴더가 생성됩니다. 그 안에 다음 파일들이 있습니다:

- **`3DCommu Messenger Setup 1.0.0.exe`**: 일반 사용자가 실행하여 앱을 설치할 수 있는 설치 프로그램입니다. (가장 중요)
- **`win-unpacked/`**: 설치 없이 바로 실행해볼 수 있는 무설치 실행 파일들이 들어있는 폴더입니다.

---

## 4. 배포 및 업데이트 전략

### 방법 1: 직접 링크 제공 (단순함)
1. 생성된 `.exe` 파일을 구글 드라이브나 AWS S3 등 파일 저장소에 업로드합니다.
2. 3D 앱 웹사이트 메인 화면에 "메신저 다운로드" 버튼을 만들고 해당 파일 주소를 링크합니다.

### 방법 2: GitHub Releases 사용 (권장)
1. GitHub 저장소의 **Releases** 탭으로 이동합니다.
2. 새로운 릴리즈(Draft a new release)를 생성합니다.
3. 태그(예: `v1.0.0`)를 입력하고 하단의 파일 업로드 영역에 `.exe` 파일을 드래그 앤 드롭합니다.
4. 사용자들이 GitHub에서 직접 다운로드받을 수 있게 됩니다.

---

## 5. 자주 발생하는 문제 해결 (Tips)

### Q. 빌드 중 아이콘 관련 에러가 발생해요.
- `package.json`의 `build` 섹션에 지정된 경로에 실제 파일이 있는지 확인하세요. 아이콘 파일이 없으면 빌드가 실패할 수 있습니다.

### Q. 앱을 실행했는데 백엔드와 연결이 안 돼요.
- 빌드 전에 `.env` 파일의 백엔드 주소가 정확한지, 그리고 Render 서버의 CORS 설정에 메신저 앱의 실행 환경이 허용되어 있는지 확인하세요.

### Q. `.exe` 파일 용량이 왜 이렇게 큰가요?
- Electron 앱은 내부에 웹 브라우저(Chromium) 핵심 엔진을 포함하고 있어 기본적으로 50MB~80MB 정도의 기본 용량을 가집니다. 이는 정상입니다.

---
> [!TIP]
> **코드 서명(Code Signing)**을 하지 않으면 윈도우 설치 시 "알 수 없는 게시자" 경고가 뜰 수 있습니다. 초기 개발 단계에서는 "추가 정보 -> 실행"을 눌러 무시하고 진행할 수 있습니다.
