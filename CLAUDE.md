# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **3D Community Platform** - a location-based social metaverse built with React, Three.js, and Spring Boot. Users authenticate, spawn as 3D characters in a virtual plaza, and interact with other players in real-time. The platform features GPS-based room creation, real-time chat, mini-games, and character customization.

**Key Concept**: The main screen is a 3D plaza that serves as both the login backdrop and the main gameplay area after authentication.

## Development Commands

### Frontend (React + Three.js)
```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm start

# Build for production
npm run build

# Run tests
npm test

# Clean install (if issues with node_modules)
rd /s /q node_modules    # Windows
rm -rf node_modules      # Linux/Mac
npm ci
```

### Backend (Spring Boot)
```bash
# Navigate to backend directory
cd backend

# Run with Maven (both pom.xml and build.gradle exist)
./mvnw spring-boot:run       # Linux/Mac
mvnw.cmd spring-boot:run      # Windows

# Run with Gradle (recommended - includes WebSocket support)
./gradlew bootRun             # Linux/Mac
gradlew.bat bootRun           # Windows

# Run with IntelliJ IDEA
# Open CommunityApplication.java and click Run

# Build JAR file
./gradlew build               # Gradle
./mvnw package                # Maven
```

Backend server runs on `http://localhost:8080`

**Note**: Both Maven and Gradle configurations exist. Gradle includes additional WebSocket dependencies for planned real-time features.

### H2 Database Console (Development)
- URL: `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:mem:communitydb`
- Username: `sa`
- Password: (empty)

## Core Architecture

### Project Transformation
This codebase evolved from a 3D portfolio game to a social metaverse platform. Recent major changes include:
- Removed Level3 and decorative portfolio elements (GitHubCat, Mailbox, Instagram, NPCs)
- Simplified to Level1 (Plaza) and Level2 (Car racing area)
- Added JWT authentication with Spring Boot backend
- Integrated ESC menu system with logout functionality
- Changed character model to BaseCharacter.gltf

### Authentication Flow

**Frontend State Management** (`src/store/useAuthStore.js`)
- Uses Zustand for global auth state
- Manages user, token, and isAuthenticated status
- Integrates with `authService.js` for API calls

**Backend JWT Authentication** (`backend/`)
- Spring Security + JWT tokens (24-hour expiration)
- BCrypt password hashing
- CORS configured for `http://localhost:3000`
- **CRITICAL**: JWT secret in `application.yml` must be Base64-encoded

**UI Flow**:
1. Unauthenticated: `AuthOverlay` displays over 3D plaza
2. Login/Register: Forms submit to Spring Boot API
3. Authenticated: Overlay disappears, character spawns in plaza
4. ESC key: Opens `GameMenu` with logout, profile, settings

### Game State Management

States controlled in `App.js`:
- `playing_level1`: Main 3D plaza (default)
- `entering_portal`: Transition when entering Level2 portal
- `playing_level2`: Urban racing area with drivable car
- `entering_portal_back_to_level1`: Returning to plaza

State transitions happen via distance-based portal collision detection.

### Key System Components

**Character System** (`src/App.js` - `Model` component)
- Model: `/resources/Ultimate Animated Character Pack - Nov 2019/glTF/BaseCharacter.gltf`
- Animations: Idle, Walk, Run (controlled by `useAnimations`)
- Movement: Direct position manipulation (not physics-based)
  - Walk speed: ~0.1 units
  - Run speed (Shift): ~0.3 units
- Rotation: Smooth lerp to movement direction
- Only spawns when `isAuthenticated === true`

**Vehicle System** (Level 2 - `RaceFuture` component)
- Front-wheel steering, rear-wheel drive
- Enter/exit with 'E' key
- Wheel animations: front wheels steer, all wheels rotate
- Speed: gradual acceleration with max ~0.3 units
- Character becomes invisible when in car

**Camera System** (`CameraController` component)
- Fixed offset: `(-0.00, 28.35, 19.76)` relative to character/vehicle
- Smooth tracking with lerp (delta * 5.0 normal, delta * 2.0 portal transitions)
- Automatically follows car when character enters vehicle
- Uses `useThree()` hook to access Three.js camera

**Portal System**
- Visual: `PortalVortex` component with custom GLSL shader
- Physical: `PortalBase` component (3D model)
- Collision: Distance-based detection (radius: 2 units)
- Positions defined as constants in `App.js`:
  - `portalPosition`: Plaza to Level2
  - `portalLevel2ToLevel1Position`: Level2 back to Plaza

**ESC Menu System** (`src/components/menu/GameMenu.jsx`)
- Opens/closes with ESC key
- Purple gradient theme matching auth UI
- Buttons: Logout (functional), Profile (placeholder), Settings (placeholder)
- Only visible when authenticated

### Input Handling

**Keyboard Controls** (`src/useKeyboardControls.js`)
- WASD / Arrow Keys: Character movement
- Shift: Sprint modifier
- E: Car interaction (Level2 only)
- Enter: UI interactions
- Escape: Toggle menu
- C: Camera debug logging

State tracking uses `useState` with keydown/keyup events.

## Backend Architecture

### Spring Boot Structure

**Authentication** (`backend/src/main/java/com/community/`)
- `controller/AuthController.java`: `/api/auth/register`, `/api/auth/login`, `/api/auth/test`
- `service/AuthService.java`: Business logic for registration and login
- `security/JwtTokenProvider.java`: JWT token generation and validation
- `security/JwtAuthenticationFilter.java`: Request interceptor for token validation
- `config/SecurityConfig.java`: CORS and security rules

**User Management**
- `model/User.java`: JPA entity implementing `UserDetails`
- `repository/UserRepository.java`: Spring Data JPA repository
- `dto/`: Request/response DTOs (RegisterRequest, LoginRequest, AuthResponse, UserDto)

**Security Configuration** (`application.yml`)
```yaml
jwt:
  secret: [Base64-encoded-string]  # MUST be Base64, no hyphens or special chars
  expiration: 86400000  # 24 hours in milliseconds

spring:
  datasource:
    url: jdbc:h2:mem:communitydb  # Dev: H2 in-memory
    # url: jdbc:mysql://localhost:3306/community_db  # Prod: MySQL
```

**CORS Setup**: Allows `http://localhost:3000` with credentials

## Custom Shaders

**GradientFloorMaterial** (`src/App.js`)
- Green gradient floor using custom shader
- Supports Three.js shadow mapping
- Colors: `#90EE90` (light green) → `#E0FFE0` (lighter green)

**VortexMaterial** (`src/PortalVortex.js`)
- Time-based swirling portal effect
- Uses polar coordinates for rotation
- Animated via `uTime` uniform in `useFrame`

## 3D Asset Organization

Assets in `public/` directory:
- **Characters**: `resources/Ultimate Animated Character Pack - Nov 2019/glTF/BaseCharacter.gltf`
- **Vehicles**: `resources/kenney_car-kit/Models/GLB-format/race-future.glb`
- **Environment**: Custom portal models (`portalbase.glb`), Nature-Kit models, Medieval Builder Pack
- **Map Tiles**: `resources/kaykit_medieval_builder_pack_1.0/Models/tiles/square/gltf/square_forest.gltf.glb`
- **Textures**: Level textures (e.g., `level2map.png`)

All models loaded with `useGLTF()` and preloaded with `useGLTF.preload()`.

**Model Loading Pattern**:
```javascript
const { scene, animations } = useGLTF('/path/to/model.gltf');
const { actions } = useAnimations(animations, ref);

// Enable shadows
useEffect(() => {
  scene.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
}, [scene]);
```

## Level Structure

**Level1** (`src/App.js` - `Level1` component)
- Main 3D plaza
- Green gradient floor
- Sky component
- Portal to Level2 (position: `[-20, 7.5, -20]`)
- PublicSquare map feature (recent addition - see `SquareForestTile.js`)
- Characters spawn here after login

**Level2** (`src/App.js` - `Level2` component)
- Urban racing environment
- Drivable car (`RaceFuture`)
- Textured floor (`level2map.png`)
- Return portal to Level1 (position: `[0, 7.5, 23.5]`)

## Component Patterns

**Authentication Conditional Rendering**:
```javascript
// In App.js
{!isAuthenticated && <AuthOverlay />}
{isAuthenticated && (
  <Model characterRef={characterRef} gameState={gameState} setGameState={setGameState} />
)}
{isAuthenticated && <GameMenu isOpen={isMenuOpen} onClose={...} />}
```

**Portal Collision Detection**:
```javascript
// In Model component's useFrame
const characterPos = characterRef.current.position.clone();
const portalPos = portalPosition.clone();
characterPos.y = 0;  // Ignore height
portalPos.y = 0;
const distance = characterPos.distanceTo(portalPos);
if (distance < portalRadius) {
  setGameState('entering_portal');
}
```

**Smooth Camera Tracking**:
```javascript
// In CameraController's useFrame
const targetPosition = characterRef.current.position.clone().add(cameraOffset);
camera.position.lerp(targetPosition, delta * 5.0);
camera.lookAt(characterRef.current.position);
```

## Important Coordinates

Camera offset: `(-0.00, 28.35, 19.76)`

Portal positions:
- Level1 → Level2: `(-20, 7.5, -20)`
- Level2 → Level1: `(0, 7.5, 23.5)`
- Portal radius: `2` units

Character spawn positions:
- Level1: `(0, 0, 0)` (default)
- Level2: `(0, 0, 10)` after portal transition

## Backend API Endpoints

### Authentication
```
POST   /api/auth/register  - Register new user
POST   /api/auth/login     - Login and receive JWT token
GET    /api/auth/test      - Test endpoint (no auth required)
```

**Register Request**:
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

**Login Request**:
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Login Response**:
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

## Common Development Tasks

### Adding New 3D Assets
1. Place `.gltf` or `.glb` file in `public/resources/[category]/`
2. Load with `useGLTF('/path/to/model.gltf')`
3. Enable shadows via `traverse()` in `useEffect()`
4. Add `useGLTF.preload()` call after component definition

### Modifying Character Movement
Location: `src/App.js` - `Model` component's `useFrame`
- Walk speed: Adjust multiplier in `direction.multiplyScalar(speed)`
- Run speed: Controlled by `shift` modifier
- Rotation: Adjust `lerp` factor in `characterRef.current.rotation.y += angleDiff * delta * 3.0`

### Adding Portal Transitions
1. Define portal position constant (e.g., `const newPortalPosition = new THREE.Vector3(...)`)
2. Add collision detection in `Model` component's `useFrame`
3. Create new game state (e.g., `'entering_new_level'`)
4. Add portal visuals: `<PortalVortex>` and `<PortalBase>`

### Backend: Adding New API Endpoints
1. Create DTO in `backend/src/main/java/com/community/dto/`
2. Add method in service layer (`service/`)
3. Create controller endpoint (`controller/`)
4. Update security config if endpoint needs authentication

### Frontend: Connecting to New API
1. Add method in appropriate service file (`src/services/`)
2. Call from component with error handling
3. Update Zustand store if needed for global state

### Adding New Map Elements
1. Place 3D model in `public/resources/[asset-pack]/`
2. Create component following pattern in `SquareForestTile.js`:
   ```javascript
   const { scene } = useGLTF('/path/to/model.glb');
   return <primitive object={scene} {...props} />;
   ```
3. Add to Level1 or Level2 component with position props
4. Preload with `useGLTF.preload('/path/to/model.glb')`

## Git Commit Conventions

This project uses commit prefixes:
- `feat(kim):` - New features
- `fix(kim):` - Bug fixes
- `refactor:` - Code restructuring
- `docs:` - Documentation changes

All commits end with:
```
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Known Issues & Future Plans

**Current Limitations**:
- No physics engine (movement is direct position manipulation)
- Single-player only (multiplayer infrastructure not yet implemented)
- Profile and Settings in ESC menu are placeholders

**Planned Features** (from README):
- WebSocket real-time communication (backend dependency already added in Gradle)
- Chat system
- Friend management
- GPS-based room creation
- Mini-game system
- Character customization shop
- Payment integration (PortOne/Toss Payments/Kakao Pay)
- Social login (Google, Kakao)

## Performance Considerations

- Shadow maps can be performance-intensive (currently optimized settings)
- Use `useMemo()` for cloned 3D models
- Preload all assets with `useGLTF.preload()`
- Consider adding LOD (Level of Detail) for complex models in the future

## Troubleshooting

**Backend won't start**:
- Check Java version (requires JDK 17+)
- Verify `application.yml` JWT secret is Base64-encoded
- Check if port 8080 is already in use

**Frontend authentication fails**:
- Ensure backend is running on `http://localhost:8080`
- Check browser console for CORS errors
- Verify `.env` has correct `REACT_APP_API_URL`

**Character doesn't spawn after login**:
- Check `isAuthenticated` state in React DevTools
- Verify JWT token is stored in localStorage
- Check browser console for errors in `Model` component
