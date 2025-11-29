# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MetaPlaza** is a location-based 3D social metaverse platform combining React/Three.js frontend with Spring Boot backend. Users can interact in 3D virtual spaces, create GPS-based local rooms, play minigames, and customize avatars.

**Current Branch Strategy:**
- `main`: Production-ready code
- `dev`: Development integration
- `kim`: Current active development branch (as of 2025-11-29)
- Feature branches: For individual features (e.g., `kichan`)

## Development Commands

### Frontend
```bash
npm start                    # Dev server at http://localhost:3000
npm run build                # Production build
npm test                     # Run tests
npm install --legacy-peer-deps  # Install dependencies (required for peer deps)
```

### Backend
```bash
cd backend

# Using Gradle (recommended)
./gradlew bootRun            # Run Spring Boot server (port 8080)
./gradlew build              # Build JAR file
./gradlew clean build        # Clean build

# Using IDE (IntelliJ IDEA)
# Open backend/build.gradle as project
# Run CommunityApplication.java main method
```

### Deployment
```bash
netlify deploy --prod        # Deploy to Netlify
```

## Technology Stack

### Frontend
- **React 19.1.1** with React Router 7.9.6
- **Three.js 0.179.1** + React Three Fiber 9.3.0 + Drei 10.7.4
- **Physics**: React Three Rapier 2.2.0
- **HTTP/Auth**: Axios, jwt-decode
- **Maps**: Mapbox GL 2.15.0
- **Database Client**: Supabase JS 2.86.0

### Backend
- **Spring Boot 3.2.0** (Java 17)
- **Database**: PostgreSQL via Supabase
- **Security**: Spring Security + JWT (JJWT 0.12.3)
- **WebSocket**: Spring WebSocket (planned)
- **Build Tool**: Gradle

## Architecture

### Frontend Structure (Feature-Based)

The codebase uses a **feature-based architecture** to prevent Git conflicts:

```
src/
├── features/                       # Feature modules (isolated)
│   ├── auth/
│   │   ├── components/LandingPage.jsx
│   │   ├── services/authService.js
│   │   └── index.js
│   ├── board/
│   │   ├── components/
│   │   │   ├── BoardModal.jsx
│   │   │   ├── BoardList.jsx
│   │   │   ├── BoardDetail.jsx
│   │   │   └── PostForm.jsx
│   │   ├── services/boardService.js
│   │   └── index.js
│   ├── profile/
│   │   ├── components/ProfileModal.jsx
│   │   ├── services/profileService.js
│   │   └── index.js
│   ├── map/
│   │   ├── components/Mapbox3D.jsx
│   │   └── index.js
│   └── system/settings/
│       ├── components/SettingModal.jsx
│       └── index.js
│
├── components/                     # 3D-specific components
│   ├── character/Character.jsx    # Character model, physics, animations
│   ├── camera/
│   │   ├── CameraController.jsx   # Camera following logic
│   │   └── CameraLogger.jsx       # Debug logger (C key)
│   ├── map/
│   │   ├── Level1.jsx             # Level 1 scene wrapper
│   │   ├── Level1Map.jsx          # PublicSquare.glb loader
│   │   └── Sky.jsx                # Sky sphere
│   └── ProtectedRoute.jsx         # Route guard for admin
│
├── pages/                          # Page-level components
│   └── admin/
│       ├── AdminLayout.jsx
│       └── Dashboard.jsx
│
├── App.js                          # Main 3D scene
├── AppRouter.jsx                   # React Router config
├── useKeyboardControls.js         # Keyboard input hook
└── index.js                        # Entry point (renders AppRouter)
```

**Key Principle**: Each team member works in separate `features/` folders to avoid merge conflicts.

### Import Pattern

Each feature exports through `index.js`:

```javascript
// features/auth/index.js
export { LandingPage } from './components/LandingPage';
export { default as authService } from './services/authService';

// Usage in App.js
import { LandingPage } from './features/auth';
import { BoardModal } from './features/board';
```

### Backend Structure

```
backend/src/main/java/com/community/
├── controller/                # REST API endpoints
│   ├── AuthController.java   # /api/auth/*
│   ├── BoardController.java  # /api/boards/*
│   ├── PostController.java   # /api/posts/*
│   └── AdminController.java  # /api/admin/*
├── service/                   # Business logic
│   ├── AuthService.java
│   ├── BoardService.java
│   ├── PostService.java
│   ├── AdminService.java
│   └── AuditLogService.java
├── repository/                # JPA repositories
│   ├── UserRepository.java
│   ├── BoardRepository.java
│   ├── PostRepository.java
│   └── AuditLogRepository.java
├── model/                     # JPA entities
│   ├── User.java             # User accounts with roles
│   ├── Role.java             # ROLE_USER, ROLE_DEVELOPER
│   ├── Profile.java
│   ├── Board.java
│   ├── Post.java
│   ├── Comment.java
│   ├── Friendship.java
│   ├── Message.java
│   ├── UserBlock.java
│   └── AuditLog.java
├── dto/                       # Data transfer objects
├── security/                  # JWT auth
│   ├── JwtTokenProvider.java
│   └── JwtAuthenticationFilter.java
└── config/
    ├── SecurityConfig.java
    └── DataInitializer.java
```

### Routing System

```javascript
// AppRouter.jsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<App />} />
    <Route path="/admin" element={
      <ProtectedRoute requiredRole="ROLE_DEVELOPER">
        <AdminLayout />
      </ProtectedRoute>
    }>
      <Route index element={<Dashboard />} />
      {/* Admin subroutes */}
    </Route>
  </Routes>
</BrowserRouter>
```

**ProtectedRoute** checks JWT token and role before allowing access.

## 3D Scene Architecture

### Component Hierarchy (App.js)

```
App
├── LandingPage (if not logged in)
├── Mapbox3D (if map mode)
├── Canvas (R3F - if logged in and not map mode)
│   ├── Lights (ambient + directional)
│   ├── Physics (Rapier, gravity: [0, -40, 0])
│   │   ├── Character (player)
│   │   │   └── RigidBody (CapsuleCollider)
│   │   ├── Level1
│   │   │   ├── Sky
│   │   │   └── Level1Map (PublicSquare.glb)
│   │   ├── CameraController
│   │   └── CameraLogger
├── UI Overlays
│   ├── BoardModal (게시판 아이콘 클릭)
│   ├── ProfileModal (프로필 아이콘 클릭)
│   └── SettingModal (설정 아이콘 클릭)
└── ESC Menu Modal
```

### Character System (components/character/Character.jsx)

- **Model**: BaseCharacter.gltf (scale: 2)
- **Physics**: CapsuleCollider, args: [2, 1.3], position: [0, 3.2, 0]
- **Animations**: Idle, Walk (speed ~8), Run (speed ~18 with Shift)
- **Rotation**: Smooth quaternion slerp
- **Audio**: Footstep sounds (Step2.wav/mp3)
- **Movement**: Controlled by `useKeyboardControls` hook
- **Modal Blocking**: Movement disabled when `isAnyModalOpen === true`

### Camera System (components/camera/CameraController.jsx)

- **Offset**: `(-0.00, 28.35, 19.76)` from character
- **Tracking**: Lerp smoothing (factor: `delta * 5.0`)
- **LookAt**: Always faces character position

### Physics System

- **Engine**: @react-three/rapier
- **Gravity**: `[0, -40, 0]`
- **Character**: Dynamic RigidBody
  - Mass: 1, linearDamping: 0.5
  - Locked rotation on X/Z (Y-axis only for turning)
- **Environment**: Fixed RigidBody with trimesh collider
- **Debug Mode**: Available via `debug` prop on Physics component

### Map Integration (features/map/components/Mapbox3D.jsx)

- Uses Mapbox GL with custom layer for Three.js integration
- Projects GPS coordinates to 3D world space
- Character spawns at user's geolocation (fallback to map center)
- Toggle between 3D scene and map view via "Open Map" button

## Input Controls

| Key | Function |
|-----|----------|
| W / ↑ | Move forward |
| S / ↓ | Move backward |
| A / ← | Move left |
| D / → | Move right |
| Shift | Sprint (hold with movement) |
| C | Log camera position to console |
| ESC | Open/close menu modal |
| Tab | Toggle player list (planned) |
| E | Interact (planned) |
| Enter | Open chat (planned) |

**Modal Behavior**: When any modal is open, character movement is automatically disabled.

## Authentication Flow

### Frontend (features/auth/)

1. **Landing Page**: Initial screen with "Click to Start"
2. **Login/Register Modal**: Email + password
3. **JWT Storage**: Stored in `localStorage` as `token`
4. **Auto-login**: Checks token on mount via `authService.getCurrentUser()`
5. **Protected Routes**: Use `<ProtectedRoute>` for role-based access

### Backend (com.community.controller.AuthController)

- `POST /api/auth/register`: Create user with BCrypt password
- `POST /api/auth/login`: Return JWT token (24h expiration)
- JWT validation via `JwtAuthenticationFilter` on protected endpoints

### Role System

- **ROLE_USER**: Default for all users
- **ROLE_DEVELOPER**: Admin access to `/admin` routes
- Roles stored in `User.roles` (Set<Role>)

## Database (Supabase PostgreSQL)

### Connection
- **Host**: Supabase Transaction Pooler
- **Config**: `backend/src/main/resources/application.yml`
- **JPA DDL**: `update` (auto-create tables)

### Main Tables
- `users`: User accounts with email, encrypted password, roles
- `profiles`: User profiles (avatar, status message)
- `boards`: Discussion boards
- `posts`: Board posts
- `comments`: Post comments
- `friendships`: Friend relationships
- `messages`: DM messages
- `user_blocks`: Block list
- `audit_logs`: Admin action logs

## 3D Asset Loading

### Standard Pattern

```javascript
import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';

function MyModel(props) {
  const { scene } = useGLTF('/path/to/model.glb');

  const clonedScene = useMemo(() => {
    const cloned = scene.clone();
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return cloned;
  }, [scene]);

  return <primitive object={clonedScene} {...props} />;
}

useGLTF.preload('/path/to/model.glb');
```

### Current Assets (public/resources/)
- `Ultimate Animated Character Pack - Nov 2019/glTF/BaseCharacter.gltf`
- `GameView/PublicSquare.glb`
- `Sounds/Step2.wav` and `Step2.mp3`

## Environment Variables

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:8080
REACT_APP_MAPBOX_TOKEN=pk.eyJ1IjoiYmluc3MwMTI0...
```

### Backend (application.yml)
- Database URL, username, password (Supabase)
- JWT secret key
- CORS allowed origins
- Log levels

## Git Workflow

### Branch Strategy
1. Pull latest from the active development branch (`kim` currently) before starting work
2. Work in your assigned `features/` folder
3. Commit frequently with descriptive messages
4. Push to the development branch regularly to avoid conflicts

### Conflict Prevention
- Each feature folder is isolated
- Avoid editing `App.js` simultaneously (coordinate in team chat)
- Use separate CSS files per component

### Pull Latest Changes
```bash
git pull origin kim  # or current active development branch
```

## Common Development Tasks

### Adding a New Feature Module

1. Create folder structure:
```
src/features/myfeature/
├── components/
│   └── MyComponent.jsx
├── services/
│   └── myService.js
└── index.js
```

2. Export from `index.js`:
```javascript
export { MyComponent } from './components/MyComponent';
export { default as myService } from './services/myService';
```

3. Import in `App.js`:
```javascript
import { MyComponent } from './features/myfeature';
```

### Adding a Backend Endpoint

1. Create DTO in `dto/`
2. Add method to Service
3. Create Controller method with `@PostMapping` / `@GetMapping`
4. Secure with `@PreAuthorize("hasRole('USER')")` if needed

### Modifying Character Behavior

**Speed**: `components/character/Character.jsx`
```javascript
const speed = shift ? 18 : 8; // Walk: 8, Run: 18
```

**Camera Distance**: `components/camera/CameraController.jsx`
```javascript
const cameraOffset = new THREE.Vector3(-0.00, 28.35, 19.76);
```

**Physics Debug**: `App.js`
```javascript
<Physics gravity={[0, -40, 0]} debug={false}> {/* true to show colliders */}
```

## API Endpoints (Current)

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT

### Boards
- `GET /api/boards` - List all boards
- `GET /api/boards/{id}` - Get board details

### Posts
- `GET /api/boards/{boardId}/posts` - List posts in board
- `POST /api/boards/{boardId}/posts` - Create post (requires auth)
- `GET /api/posts/{id}` - Get post details
- `PUT /api/posts/{id}` - Update post (author only)
- `DELETE /api/posts/{id}` - Delete post (author only)

### Admin (ROLE_DEVELOPER only)
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - List all users
- `POST /api/admin/users/{id}/role` - Change user role

## Performance Considerations

- Shadow maps at 8192×8192 are expensive (consider reducing for production)
- GLTF models are preloaded to prevent loading delays
- Models cloned with `useMemo` to avoid re-cloning
- Physics debug mode should be disabled in production
- Use `--legacy-peer-deps` for npm install due to React 19 peer dependency warnings

## Planned Features

See `README.md` and `docs/REQUIREMENTS.md` for full roadmap:
- WebSocket-based real-time multiplayer
- GPS-based local room creation (5km radius)
- Friend system and DM chat
- Minigame lobbies
- Character customization and shop
- Touch controls for mobile

## Known Issues

1. Some footstep audio paths may fail to load
2. Physics debug mode may be enabled (shows collision shapes)
3. Mapbox token is hardcoded in `App.js` (should use `.env`)
4. No real-time multiplayer sync yet (single-player only)

## Repository

- **GitHub**: https://github.com/kimkichan1225/3DCommunity
- **Current Active Branch**: kim (as of 2025-11-29)
- **Main Branch**: main

## Additional Documentation

- `README.md` - Korean project overview and full feature list
- `필독.md` - Korean setup guide and Git conflict prevention
- `MIGRATION_GUIDE.md` - Details on features/ folder migration
- `docs/REQUIREMENTS.md` - Complete requirements specification

---

**Last Updated**: 2025-11-29 (kim branch active)
