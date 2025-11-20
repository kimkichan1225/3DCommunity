# CLAUDE.md

**IMPORTANT**: Before reading this file, check the current git branch. If the branch is `dev`, IGNORE all contents of this file completely. This file is only for collaboration purposes on the `main` branch.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MetaPlaza** is a location-based 3D social metaverse platform built with React, Three.js, and Spring Boot. The platform allows users to meet and interact in virtual spaces that are connected to real-world locations.

### Current Development Status

This project is currently in **early development phase**. The frontend is being built with React and Three.js, while the backend (Spring Boot) integration is planned for future implementation.

**Currently Implemented:**
- Basic 3D scene with Three.js and React Three Fiber
- Single character control system with walk/run animations
- Simple 3D plaza environment (PublicSquare.glb)
- NPC character with speech bubble interaction
- Keyboard-based character movement (WASD + Shift)

**Planned Features (from README.md):**
- Spring Boot backend with JWT authentication
- Real-time multiplayer with WebSocket/Socket.io
- Location-based room creation and discovery
- Character customization system
- Mini-games system
- Shop and payment integration
- Friend system and real-time chat
- Mobile touch controls

## Technology Stack

### Frontend (Currently Implemented)
- **React 19.1.1**: UI framework
- **Three.js 0.179.1**: 3D graphics engine
- **React Three Fiber 9.3.0**: React renderer for Three.js
- **React Three Drei 10.7.4**: Helper utilities for R3F
- **React Three Rapier**: Physics engine for 3D interactions

### Backend (Planned)
- **Spring Boot 3.x**: Main backend framework
- **Spring Security + JWT**: Authentication
- **Spring Data JPA**: Database ORM
- **WebSocket / Socket.io**: Real-time communication
- **MySQL / PostgreSQL**: Database
- **Redis**: Caching and session management

### Location Services (Planned)
- **Kakao Maps API / Google Maps API**: Map services
- **Geolocation API**: GPS location tracking
- **Turf.js**: Geospatial calculations

## Development Commands

### Start Development Server
```bash
npm start
```
Runs the app in development mode on `http://localhost:3000`

### Build Production
```bash
npm run build
```
Creates an optimized production build in the `build/` folder

### Run Tests
```bash
npm test
```
Launches the test runner in interactive watch mode

### Deploy to Netlify
```bash
netlify deploy --prod
```
Deploys the production build to Netlify

## Current File Structure

```
MetaPlaza/
├── public/
│   ├── resources/
│   │   └── GameView/
│   │       ├── PublicSquare.glb        # Main plaza 3D model
│   │       ├── Worker.glb              # NPC character model
│   │       ├── OldClassy.glb          # Character model
│   │       └── Suit.glb               # Character model
│   └── sounds/                         # Audio files (planned)
├── src/
│   ├── App.js                          # Main application component
│   ├── App.css                         # Main styles
│   ├── useKeyboardControls.js          # Keyboard input hook
│   ├── PortalVortex.js                # Portal shader (not currently used)
│   ├── index.js                        # React entry point
│   └── index.css                       # Global styles
├── CLAUDE.md                           # This file
├── README.md                           # Project documentation
├── netlify.toml                        # Netlify deployment config
└── package.json                        # Dependencies and scripts
```

## Core Components (src/App.js)

### Sky Component
Simple sky sphere with light blue color:
```javascript
function Sky() {
  return (
    <mesh>
      <sphereGeometry args={[400, 32, 32]} />
      <meshBasicMaterial color="#87CEFA" side={THREE.BackSide} />
    </mesh>
  );
}
```

### CameraLogger Component
Debug utility that logs camera position and rotation when 'C' key is pressed.

### CameraController Component
Manages camera movement following the character:
- Fixed offset camera: `(-0.00, 28.35, 19.76)`
- Smooth lerp-based tracking: `delta * 5.0`
- Always looks at character position

### Model Component (Main Character)
Player-controlled character with animations:
- **Model**: `Worker_Male.gltf` from Ultimate Animated Character Pack
- **Animations**: Idle, Walk, Run
- **Movement**:
  - Walk speed: ~8 units/sec
  - Run speed: ~18 units/sec (with Shift key)
- **Physics**: CapsuleCollider (radius: 1, height: 2.5)
- **Controls**: WASD for movement, Shift for sprint
- **Audio**: Footstep sounds (Step2.wav, step2.mp3) - currently commented out

### SpeechBubble Component
3D speech bubble that appears above NPCs:
- Uses Three.js shapes for rounded rectangle background
- Displays text using `@react-three/drei` Text component
- Auto-scales based on text length

### NPCCharacter Component
Non-player character with interaction:
- **Model**: `OldClassy_Male.gltf`
- **Animation**: Idle animation only
- **Interaction**: Shows speech bubble when player is within 6 units
- **Message**: "첫번쨰 프로젝트에 오신걸 환영합니다! 🎉"
- **Position**: Configurable via props

### Level1Map Component
Main 3D environment:
- **Model**: `/resources/GameView/PublicSquare.glb`
- **Physics**: Fixed RigidBody with trimesh collider
- **Scale**: 1.0
- **Features**: Shadow casting and receiving enabled

### Level1 Component
Main scene composition:
```javascript
function Level1({ characterRef }) {
  return (
    <>
      <Sky />
      <Level1Map position={[0, 0, 0]} scale={1.0} />
      <NPCCharacter position={[0, 0, 0]} playerRef={characterRef} />
    </>
  );
}
```

### App Component
Root component structure:
```javascript
function App() {
  const characterRef = useRef();

  return (
    <div className="App">
      <Canvas camera={{ position: [-0.00, 28.35, 19.76] }} shadows>
        <ambientLight intensity={0.5} />
        <directionalLight position={[50, 50, 25]} intensity={6} castShadow />
        <Suspense fallback={null}>
          <Physics gravity={[0, -40, 0]} debug>
            <Model characterRef={characterRef} />
            <CameraController characterRef={characterRef} />
            <CameraLogger />
            <Level1 characterRef={characterRef} />
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  );
}
```

## Custom Hooks

### useKeyboardControls (`src/useKeyboardControls.js`)
Custom hook for keyboard input handling:
- Tracks key states: forward, backward, left, right, shift, log, e, enter
- Uses event listeners for keydown/keyup
- Returns object with boolean values for each key state

**Usage:**
```javascript
const { forward, backward, left, right, shift } = useKeyboardControls();
```

## Input Controls

| Key | Function |
|-----|----------|
| `W` / `↑` | Move forward |
| `S` / `↓` | Move backward |
| `A` / `←` | Move left |
| `D` / `→` | Move right |
| `Shift` | Sprint (hold with movement keys) |
| `C` | Log camera position/rotation (debug) |
| `E` | Interact (planned) |
| `Enter` | Chat input (planned) |

## 3D Asset Management

### Model Loading Pattern
All 3D models use `useGLTF` hook with cloning for instancing:
```javascript
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

### Current 3D Assets
- **PublicSquare.glb**: Main plaza environment
- **Worker.glb** / **OldClassy.glb**: Character models (GLTF with animations)
- **Suit.glb**: Additional character model (planned usage)

## Physics System

Uses `@react-three/rapier` for physics:
- **Gravity**: `[0, -40, 0]`
- **Character Collider**: CapsuleCollider (radius: 1, height: 2.5)
- **Environment Collider**: Fixed RigidBody with trimesh
- **Debug Mode**: Currently enabled (shows collision shapes)

## Animation System

Character animations managed via `useAnimations` hook:
- **Idle**: Default standing animation
- **Walk**: Walking animation (activated when moving without Shift)
- **Run**: Running animation (activated when moving with Shift)
- **Transition**: 0.5 second fade between animations

```javascript
const { animations, scene } = useGLTF('/character.gltf');
const { actions } = useAnimations(animations, characterRef);

// Play animation
actions['Walk']?.fadeIn(0.5).play();
// Stop previous animation
actions['Idle']?.fadeOut(0.5).stop();
```

## Lighting and Shadows

### Light Setup
- **Ambient Light**: Intensity 0.5 (general illumination)
- **Directional Light**:
  - Position: `[50, 50, 25]`
  - Intensity: 6
  - Shadow enabled: true
  - Shadow map size: 8192 x 8192
  - Shadow camera range: 500 units in all directions
  - Shadow bias: -0.0001
  - Shadow normal bias: 0.02
  - Shadow radius: 4 (soft shadows)
- **Sun Visual**: Yellow sphere at `[50, 50, 25]`

### Shadow Settings
All meshes should have:
```javascript
child.castShadow = true;
child.receiveShadow = true;
```

## Styling (src/App.css)

Minimal CSS for canvas container:
```css
.App {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
}
```

## Future Development Roadmap

Based on README.md, upcoming features to implement:

### Phase 1: Backend Integration
1. Set up Spring Boot project structure
2. Implement JWT authentication endpoints
3. Create User entity and repository
4. Set up MySQL/PostgreSQL database

### Phase 2: Real-time Multiplayer
1. Integrate Socket.io or WebSocket
2. Implement character position synchronization
3. Show other players' characters in real-time
4. Add username display above characters

### Phase 3: Location Services
1. Integrate Kakao Maps or Google Maps API
2. Implement GPS location tracking
3. Create location-based room system
4. Add proximity-based room visibility

### Phase 4: Social Features
1. Real-time chat system
2. Friend system (add/remove/list)
3. User profile pages
4. Social interaction animations

### Phase 5: Character System
1. Character customization UI
2. Clothing/accessory system
3. Shop implementation
4. Payment integration (PortOne)

### Phase 6: Mini-games
1. Game room creation system
2. Multiple mini-game types
3. Spectator mode
4. Game state synchronization

### Phase 7: Mobile Support
1. Touch-based virtual joystick
2. Responsive UI
3. Mobile-optimized 3D rendering
4. Touch interaction system

## Common Development Tasks

### Adding a New 3D Model
1. Place `.glb` file in `public/resources/GameView/`
2. Create component function following the model loading pattern
3. Add `useGLTF.preload()` call after component
4. Add component to Level1 or create new level

### Modifying Character Movement
Movement logic is in `Model` component's `useFrame`:
- **Walk Speed**: Line ~220, currently `8`
- **Run Speed**: Line ~220, currently `18`
- **Rotation Speed**: `delta * 3.0`

### Adding New Animations
1. Ensure animation exists in GLTF file
2. Add animation name to actions object
3. Trigger with `actions['AnimationName']?.fadeIn(0.5).play()`
4. Stop previous with `fadeOut(0.5).stop()`

### Changing Camera Position
Camera offset defined in `CameraController`:
```javascript
const cameraOffset = new THREE.Vector3(-0.00, 28.35, 19.76);
```
Adjust Y value for height, Z value for distance.

### Adding NPC Interactions
1. Create new component based on `NPCCharacter`
2. Add distance checking logic in `useFrame`
3. Use `SpeechBubble` component for dialogue
4. Add interaction logic with `enter` key from `useKeyboardControls`

### Debugging
- Press `C` to log camera position and rotation
- Enable Rapier debug mode to see collision shapes
- Check browser console for errors
- Use React DevTools for component inspection

## Performance Considerations

- Use `useMemo()` for cloned 3D models
- Preload GLTF models with `useGLTF.preload()`
- Shadow maps are performance-intensive (currently 8192x8192)
- Consider reducing shadow map size for better performance
- Use LOD (Level of Detail) for complex models in future
- Implement frustum culling for off-screen objects

## Security Notes (For Future Backend)

When implementing backend features:
- Always validate user input
- Use parameterized queries to prevent SQL injection
- Implement rate limiting for API endpoints
- Sanitize user-generated content (chat messages)
- Use HTTPS in production
- Store passwords with BCrypt
- Implement proper JWT token expiration and refresh
- Validate location data to prevent spoofing

## Known Issues

1. Audio system is currently commented out (footstep sounds)
2. Physics debug mode is enabled (shows collision shapes)
3. No mobile touch controls yet
4. No backend integration
5. Single player only (no multiplayer)

## Dependencies

Key packages in `package.json`:
```json
{
  "react": "^19.1.1",
  "react-dom": "^19.1.1",
  "three": "^0.179.1",
  "@react-three/fiber": "^9.3.0",
  "@react-three/drei": "^10.7.4",
  "@react-three/rapier": "^latest"
}
```

## Deployment

### Netlify Configuration
See `netlify.toml` for deployment settings:
- Build command: `npm run build`
- Publish directory: `build`
- SPA redirect rules configured

### Environment Variables (Future)
When backend is ready, add `.env`:
```env
REACT_APP_API_URL=http://localhost:8080
REACT_APP_SOCKET_URL=http://localhost:8080
REACT_APP_MAP_API_KEY=your_key_here
```

## Git Repository

- GitHub: https://github.com/kimkichan1225/3DCommunity
- Main branch: `main`

## Contact

- GitHub: [@kimkichan1225](https://github.com/kimkichan1225)
- Email: vxbc52@gmail.com

---

**Note**: This project is under active development. The CLAUDE.md file will be updated as new features are implemented.
