# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MetaPlaza** is a location-based 3D social metaverse platform built with React, Three.js, and Spring Boot. Currently in early development, the frontend features a single-player 3D environment with character controls.

**Current Implementation:**
- 3D scene with Three.js and React Three Fiber
- Single character control with Idle/Walk/Run animations (BaseCharacter.gltf)
- 3D plaza environment (PublicSquare.glb)
- Physics-based movement with Rapier
- Keyboard controls (WASD + Shift)

**Planned Features (see README.md):**
- Spring Boot backend with JWT authentication
- Real-time multiplayer via WebSocket/Socket.io
- Location-based room system (Kakao/Google Maps API)
- Character customization and shop system
- Mini-games and social features
- Mobile touch controls

## Development Commands

```bash
# Development
npm start          # Run dev server at http://localhost:3000
npm run build      # Create production build in build/
npm test           # Run tests in watch mode

# Deployment
netlify deploy --prod    # Deploy to Netlify (requires Netlify CLI)
```

## Technology Stack

### Frontend (Current)
- React 19.1.1, Three.js 0.179.1
- React Three Fiber 9.3.0, React Three Drei 10.7.4
- React Three Rapier 2.2.0 (physics)

### Backend (Planned)
- Spring Boot 3.x with JWT authentication
- WebSocket/Socket.io for real-time multiplayer
- MySQL/PostgreSQL + Redis
- Kakao/Google Maps API for location services

## Architecture

### Component Hierarchy (src/App.js)

```
App
├── Canvas (R3F)
│   ├── Lights (ambient + directional with shadows)
│   ├── Physics (Rapier, gravity: [0, -40, 0])
│   │   ├── Model (player character)
│   │   │   └── RigidBody (dynamic, CapsuleCollider)
│   │   │       └── BaseCharacter.gltf (scale: 2)
│   │   ├── Level1
│   │   │   ├── Sky (blue sphere, radius: 400)
│   │   │   └── Level1Map (PublicSquare.glb)
│   │   │       └── RigidBody (fixed, trimesh)
│   │   ├── CameraController (follows character)
│   │   └── CameraLogger (debug: press C)
```

### Key Components

**Model** (src/App.js:67-250)
- Character with animations: Idle, Walk, Run
- Physics: CapsuleCollider (args: [2, 1.3], position: [0, 3.2, 0])
- Movement speeds: Walk ~8 units/sec, Run ~18 units/sec
- Smooth rotation using quaternion slerp
- Audio system for footsteps (currently implemented, sounds: Step2.wav/mp3)
- Controls via `useKeyboardControls` hook

**CameraController** (src/App.js:40-65)
- Fixed offset: `(-0.00, 28.35, 19.76)` from character
- Smooth tracking with lerp (factor: `delta * 5.0`)
- Always looks at character position

**Level1Map** (src/App.js:252-272)
- Loads PublicSquare.glb as static environment
- Uses trimesh collider for physics
- Clones scene to enable shadows on all meshes

### Custom Hooks

**useKeyboardControls** (src/useKeyboardControls.js)
- Returns: `{ forward, backward, left, right, shift, log, e, enter }`
- Maps keys: W/↑, S/↓, A/←, D/→, Shift, C, E, Enter
- Used for character movement and debug logging

### Input Controls

| Key | Function |
|-----|----------|
| W / ↑ | Forward |
| S / ↓ | Backward |
| A / ← | Left |
| D / → | Right |
| Shift | Sprint |
| C | Log camera position (debug) |

## Physics System

- **Engine**: @react-three/rapier
- **Gravity**: `[0, -40, 0]`
- **Character**: Dynamic RigidBody with CapsuleCollider
  - Mass: 1, linearDamping: 0.5
  - Rotation locked on X/Z axes (Y-axis only)
- **Environment**: Fixed RigidBody with trimesh collider
- **Debug Mode**: Enabled in src/App.js:326 (`debug` prop on Physics component)

## Animation System

Animations are managed via `useAnimations` hook with 0.5-second fade transitions:

```javascript
// Animation switching pattern
const oldAction = actions[currentAnimation];
const newAction = actions[animToPlay];
if (oldAction) oldAction.fadeOut(0.5);
if (newAction) newAction.reset().fadeIn(0.5).play();
```

**Animation States:**
- Idle: No movement input
- Walk: Movement without Shift
- Run: Movement with Shift

## 3D Assets

### Loading Pattern
All models use `useGLTF` with cloning and shadow setup:

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

  return <RigidBody type="fixed" colliders="trimesh">
    <primitive object={clonedScene} {...props} />
  </RigidBody>;
}

useGLTF.preload('/path/to/model.glb');
```

### Current Assets (public/resources/)
- `Ultimate Animated Character Pack - Nov 2019/glTF/BaseCharacter.gltf` - Player character
- `GameView/PublicSquare.glb` - Main plaza environment
- `Sounds/Step2.wav` and `Step2.mp3` - Footstep sounds

## Lighting and Shadows

- **Ambient**: intensity 0.5
- **Directional**: position [50, 50, 25], intensity 6
  - Shadow map: 8192×8192 (high quality, performance-intensive)
  - Shadow camera range: 500 units
  - Shadow bias: -0.0001, normalBias: 0.02, radius: 4
- **Sun Visual**: Yellow sphere at [50, 50, 25]

## Modifying Core Behavior

### Character Movement Speed
In `Model` component useFrame (src/App.js:174):
```javascript
const speed = shift ? 18 : 8; // Walk: 8, Run: 18
```

### Camera Position
In `CameraController` (src/App.js:42):
```javascript
const cameraOffset = new THREE.Vector3(-0.00, 28.35, 19.76);
// Adjust Y for height, Z for distance
```

### Physics Debug Visualization
Toggle in `App` component (src/App.js:326):
```javascript
<Physics gravity={[0, -40, 0]} debug>  // Set debug to false to hide
```

### Footstep Sound Intervals
In `Model` component (src/App.js:165):
```javascript
stepIntervalRef.current = animToPlay === 'Run' ? 0.45 : 0.6;
```

## Deployment Configuration

**Netlify** (netlify.toml):
- Build: `npm run build`
- Publish: `build/`
- Node version: 18
- NPM flags: `--legacy-peer-deps`
- SPA routing enabled

**Environment Variables** (when backend is ready):
```env
REACT_APP_API_URL=http://localhost:8080
REACT_APP_SOCKET_URL=http://localhost:8080
REACT_APP_MAP_API_KEY=your_key_here
```

## Project Structure

```
MetaPlaza/
├── public/
│   └── resources/
│       ├── Ultimate Animated Character Pack - Nov 2019/
│       │   └── glTF/BaseCharacter.gltf
│       ├── GameView/
│       │   └── PublicSquare.glb
│       └── Sounds/
│           ├── Step2.wav
│           └── Step2.mp3
├── src/
│   ├── App.js                    # Main app component (all 3D logic)
│   ├── useKeyboardControls.js    # Input hook
│   ├── PortalVortex.js          # Unused shader component
│   └── SquareForestTile.js      # Unused component
├── CLAUDE.md
├── README.md                     # Full feature documentation (Korean)
├── netlify.toml
└── package.json
```

## Performance Notes

- Shadow maps at 8192×8192 are expensive; consider reducing for lower-end devices
- All GLTF models are preloaded to prevent loading delays
- Models are cloned with `useMemo` to prevent re-cloning on re-renders
- Physics debug mode should be disabled in production

## Known Issues

1. Footstep audio system is implemented but may have path loading issues
2. Physics debug mode is enabled (shows collision shapes)
3. No multiplayer support yet
4. No backend integration

## Future Development Phases

See README.md for complete roadmap. Key phases:
1. Backend Integration (Spring Boot + JWT)
2. Real-time Multiplayer (WebSocket)
3. Location Services (GPS + Maps API)
4. Social Features (Chat, Friends)
5. Character System (Customization, Shop)
6. Mini-games
7. Mobile Support (Touch controls)

## Repository

- GitHub: https://github.com/kimkichan1225/3DCommunity
- Main branch: `main`

---

**Note**: This is an active development project. The CLAUDE.md reflects the current implementation state, not planned features (see README.md for full vision).
