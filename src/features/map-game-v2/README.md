# Map Game V2 - Professional 3D Location-Based Game Architecture

## Overview

This is a production-grade 3D location-based game system combining Mapbox, Three.js, physics simulation, and GPS navigation. Designed for web-based AR/location games with high precision and professional-quality user experience.

**Key Features:**
- Real-time GPS tracking with jitter reduction
- Seamless Mapbox ↔ Three.js coordinate transformation
- Professional navigation-style camera system
- Lightweight physics engine with fixed timestep
- Route generation and turn-by-turn navigation
- Performance monitoring and optimization

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Game Manager (Core Orchestrator)    │
├─────────────────────────────────────────────────────────┤
│
├─ Coordinate System       [GPS → Mercator → Three.js]
├─ Three.js Scene Manager  [WebGL Rendering]
├─ Physics World           [Fixed Timestep Physics]
├─ Navigation System       [Route & Waypoint Management]
├─ GPS Location Service    [Device Geolocation API]
└─ Navigation Camera       [Third-Person Smart Camera]
```

## Core Systems

### 1. Mapbox Coordinate System (`core/map/MapboxCoordinateSystem.js`)

**Responsibility:** Translate between GPS (lng/lat), Mapbox MercatorCoordinate, and Three.js world coordinates.

**Key Functions:**
```javascript
// GPS → Three.js World (for character positioning)
const worldPos = coordSystem.gpsToWorld({ lng: -74.006, lat: 40.7128 });

// Route polyline → World coordinates (for path visualization)
const routeWorldPos = coordSystem.gpsPolylineToWorld(polyline);

// Distance & bearing calculations
const distance = coordSystem.getDistanceToTarget(targetLngLat);
const bearing = coordSystem.getBearingToTarget(targetLngLat);
```

**Transformation Formulas:**

**GPS to Mercator (Web Mercator Projection):**
```
x = (lng + 180) / 360                              // Normalize 0-1
y = (1 - ln(tan(π/4 + lat*π/360)) / π) / 2      // Mercator projection
```

**Mercator to Three.js World:**
```
// At zoom level Z, with map center M, and scale S:
tileX = mercator.x * 2^Z
tileY = mercator.y * 2^Z
worldX = (tileX - centerX) * 256 * S              // Pixels → world units
worldY = -(tileY - centerY) * 256 * S            // Flipped Y axis
```

**Features:**
- Exponential moving average smoothing for GPS jitter reduction (default α=0.15)
- Sub-meter accuracy at street level (zoom 15-19)
- Haversine formula for distance calculations
- Listener pattern for coordinate updates

### 2. Three.js Scene Manager (`core/three/ThreeSceneManager.js`)

**Responsibility:** Manage Three.js scene, camera, renderer, and WebGL context.

**Key Features:**
- High-performance WebGL renderer configuration
- Dynamic shadow mapping (PCF)
- Scene lighting setup (directional + ambient + hemisphere)
- Object management (add, remove, dispose)
- Curved path visualization using CatmullRomCurve3
- Third-person camera control

**Usage:**
```javascript
const sceneManager = new ThreeSceneManager(canvasElement);

// Create player
const characterMesh = sceneManager.createCharacterMesh(2);

// Visualize route
const routeLine = sceneManager.createCurvedPathLine(
  worldPoints, 
  50,              // segments for curve smoothness
  0x00ff00,        // green color
  'routeLine'
);

// Render loop
sceneManager.onUpdate((deltaTime) => {
  // Update game logic here
});

sceneManager.startRender();
```

### 3. Physics Controller (`core/physics/PhysicsController.js`)

**Responsibility:** Lightweight physics simulation for character movement and gravity.

**Components:**

**SimplePhysicsBody:**
- Acceleration, velocity, position tracking
- Gravity simulation
- Friction (air resistance)
- Ground collision detection
- Maximum velocity clamping

**CharacterController:**
- Input-based movement (WASD)
- Heading/rotation management with damping
- Jump mechanics
- Sprint support
- Animation state tracking

**PhysicsWorld:**
- Fixed timestep integration (60 Hz by default)
- Accumulator pattern for stable simulation
- Simple sphere-to-sphere collision detection

**Fixed Timestep Implementation:**
```javascript
accumulator += deltaTime;  // Variable frame time
while (accumulator >= fixedTimestep) {
  updateAllBodies(fixedTimestep);  // Consistent physics
  checkCollisions();
  accumulator -= fixedTimestep;
}
```

**Why Fixed Timestep?**
- Deterministic physics behavior
- Consistent across different frame rates
- Prevents tunneling and instability
- Standard in game engines (Godot, Unity use this)

### 4. Navigation System (`systems/navigation/NavigationSystem.js`)

**Responsibility:** Route generation, visualization, and waypoint tracking.

**Features:**
- Mapbox Directions API integration
- Walking/driving/cycling profiles
- Alternative route support
- Waypoint detection (arrival threshold: 5m)
- Route progress tracking
- Polyline decoding (6-digit precision)

**Usage:**
```javascript
// Request route
const route = await navSystem.requestRoute(
  { lng: -74.006, lat: 40.7128 },    // start
  { lng: -74.0, lat: 40.72 },        // destination
  { profile: 'mapbox/walking', alternatives: true }
);

// Start following
navSystem.startNavigation();

// Update (call each frame)
navSystem.update(playerLngLat);

// Listen for waypoints
navSystem.on('onWaypointReached', (data) => {
  console.log(`Reached waypoint ${data.waypointIndex}`);
});
```

**API Integration:**
```javascript
// Endpoint: https://api.mapbox.com/directions/v5/{profile}/{coordinates}
// Profiles: mapbox/walking, mapbox/driving, mapbox/cycling
// Response includes: geometry (polyline), distance, duration, legs (turn-by-turn)
```

### 5. GPS Location Service (`systems/player/GPSLocationService.js`)

**Responsibility:** Device geolocation tracking with GPS simulation for testing.

**Features:**
- Device Geolocation API integration
- Accuracy filtering (ignores poor readings)
- Heading & speed calculation from position deltas
- Simulation mode for testing without GPS
- Heading from GPS bearing
- Statistics tracking

**Accuracy Filtering:**
```javascript
// Ignore readings with accuracy worse than threshold (default: 100m)
if (coords.accuracy > minAccuracy) {
  // Skip update
}
```

**Usage:**
```javascript
// Real GPS
const gpsService = new GPSLocationService({ 
  simulationMode: false 
});

// Or simulation (testing)
const gpsService = new GPSLocationService({ 
  simulationMode: true 
});
gpsService.setSimulationPath([
  [-74.006, 40.7128],
  [-74.005, 40.7129],
  [-74.004, 40.7130],
]);

gpsService.startTracking();

gpsService.on('onLocationUpdate', (data) => {
  const { lng, lat, accuracy, heading, speed } = data.location;
});
```

### 6. Navigation Camera (`systems/camera/NavigationCamera.js`)

**Responsibility:** Smart third-person camera that mimics navigation app behavior.

**Camera Behavior:**
- Follows player from behind and above
- Looks ahead on route when moving
- Smooth interpolation (exponential moving average)
- Multiple presets: first-person, third-person, cinematic, mobile

**Smart Positioning:**
```
                Camera
                  ╱ ╲ looks ahead on route
                 ╱   ╲
                ╱     ╲
          (behind)    (above)
             ╱         ╱
            ╱         ╱
        Player ─────→ Look-Ahead Point
```

**Usage:**
```javascript
const camera = new NavigationCamera(threeCamera, {
  distance: 12,           // Units behind player
  height: 6,              // Units above ground
  lookAheadDistance: 30,  // Units ahead on route
  smoothingSpeed: 0.08,   // Camera response (0=smooth, 1=snappy)
});

// Update every frame
camera.update({
  position: playerPos,
  heading: playerHeading,
  isMoving: true,
  routeData: { nextWaypoint: waypointWorldPos }
});

// Presets
camera.setThirdPersonView();      // Default
camera.setFirstPersonView();      // Street level
camera.setCinematicView();        // Far overhead
camera.setMobileView();           // Optimized for small screens
```

## Data Flow Diagram

```
Device GPS (Geolocation API)
         ↓
   GPS Location Service  [accuracy filtering, heading calc]
         ↓
Coordinate System  [applies smoothing, GPS → Mercator]
         ↓
Game Manager  [syncs with player physics body]
         ↓
Character Physics  [gravity, movement, collision]
         ↓
Three.js Renderer  [updates character mesh position]
         ↓
Navigation Camera  [follows character with lookahead]
         ↓
Screen
```

## Key Algorithms

### 1. GPS Jitter Reduction (Exponential Moving Average)

```javascript
newValue = α * newSample + (1 - α) * previousValue

// α = 0.15 default (15% new data, 85% historical)
// Reduces GPS noise while maintaining responsiveness
```

**Benefits:**
- Smooth character movement
- Reduced visual "jumping"
- Maintains accuracy
- Responsive to actual movement

### 2. Haversine Distance Formula

```javascript
Δσ = 2 × atan2(√a, √(1-a))
where: a = sin²(Δφ/2) + cos φ₁ × cos φ₂ × sin²(Δλ/2)
distance = R × Δσ  (R = 6371 km)
```

**Accuracy:** ±0.5% for distances up to thousands of km

### 3. Polyline Interpolation

Route following uses segment-based interpolation:

```javascript
1. Calculate total distance of polyline
2. For progress P (0-1), find target distance = totalDist × P
3. Find segment containing target distance
4. Interpolate position within segment
5. Calculate bearing to next segment point
```

### 4. Mercator Projection & Zoom Scaling

```
Zoom 15: ~1.5 meters per pixel at equator
Zoom 17: ~0.4 meters per pixel
Zoom 19: ~0.1 meters per pixel

Formula: metersPerPixel = 40075000 / (256 × 2^zoom)
```

## Performance Considerations

### 1. Fixed Timestep Physics
- **Benefit:** Consistent simulation independent of frame rate
- **Cost:** Extra iterations if frame rate drops
- **Trade-off:** Worth it for stability

### 2. GPS Update Throttling
- **Default:** 1000ms (1 update per second)
- **Reason:** GPS hardware limitation, battery conservation
- **Smoothing:** Applies EMA between updates

### 3. Route Rendering Optimization
- **Technique:** Curved path uses CatmullRomCurve3 with 50-100 segments
- **Alternative:** Simple line for lower performance needs
- **Cull off-screen paths** using viewport frustum culling

### 4. Camera Smoothing
- **Exponential Moving Average:** O(1) per frame, no buffer
- **Adjustable:** `smoothingSpeed` property (0.05 = smooth, 0.15 = responsive)

### 5. Coordinate Transformation
- **Mercator conversion:** O(1) mathematical operation
- **Caching:** Map center stored, not recalculated each frame

## Integration with React

### Using the `useMapGame` Hook

```javascript
import { useMapGame } from './hooks/useMapGame';

function GameComponent() {
  const canvasRef = useRef(null);
  
  const {
    gameState,
    isInitialized,
    startGame,
    stopGame,
    requestRoute,
    startNavigation,
    setCameraView,
    getPerformanceMetrics
  } = useMapGame(canvasRef.current, {
    zoom: 18,
    cameraDistance: 12,
    gpsUpdateInterval: 1000,
    simulationMode: false
  });

  return (
    <>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      
      {gameState && (
        <div className="hud">
          <div>GPS: {gameState.gpsAccuracy.toFixed(1)}m</div>
          <div>FPS: {getPerformanceMetrics().fps}</div>
        </div>
      )}
      
      <button onClick={startGame}>Start</button>
      <button onClick={async () => {
        await requestRoute({ lng: -74.0, lat: 40.72 });
        startNavigation();
      }}>Navigate</button>
    </>
  );
}
```

## Configuration Options

```javascript
const gameManager = new GameManager(canvasElement, {
  // Coordinate system
  coordinates: {
    zoom: 18,                          // 0-24, recommended 15-19
    initialPosition: { lng, lat },     // Start location
    smoothingEnabled: true,
    smoothingAlpha: 0.15,              // 0-1, higher = responsive
  },
  
  // Physics
  physics: {
    fixedTimestep: 1/60,               // 60 Hz physics
    gravity: 9.81,                     // m/s²
  },
  
  // GPS
  gps: {
    updateIntervalMs: 1000,            // 1 second throttle
    minAccuracy: 100,                  // Ignore worse than 100m
    simulationMode: false,             // Enable for testing
  },
  
  // Camera
  camera: {
    distance: 12,                      // Units behind player
    height: 6,                         // Units above ground
    lookAheadDistance: 30,             // Units ahead
    smoothingSpeed: 0.08,              // 0.05=smooth, 0.15=snappy
  }
});
```

## Testing & Debugging

### GPS Simulation
```javascript
// Enable simulation mode
const gpsService = new GPSLocationService({ simulationMode: true });

// Set a walking path
gpsService.setSimulationPath([
  [-74.006, 40.7128],
  [-74.005, 40.7129],
  [-74.004, 40.7130],
], 1.0);  // speed multiplier

gpsService.startTracking();
```

### Performance Monitoring
```javascript
const metrics = gameManager.perfMonitor.getMetrics();
console.log(`FPS: ${metrics.fps}`);
console.log(`Frame time: ${metrics.frameTime.avg}ms`);
console.log(`Physics time: ${metrics.physicsTime.avg}ms`);
console.log(`Memory: ${metrics.memory.usedMB}MB`);
```

### Coordinate Verification
```javascript
// Verify transformations
const lngLat = { lng: -74.006, lat: 40.7128 };
const worldPos = coordSystem.gpsToWorld(lngLat);
const backToLngLat = coordSystem.worldToGPS(worldPos);

console.assert(Math.abs(lngLat.lng - backToLngLat.lng) < 0.0001);
console.assert(Math.abs(lngLat.lat - backToLngLat.lat) < 0.0001);
```

## Browser Compatibility

**Required:**
- WebGL 1.0+ (Three.js)
- Geolocation API
- ES2015+ JavaScript

**Tested:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Mobile:**
- iOS Safari 13+
- Chrome Android 90+
- Firefox Android 88+

## Future Enhancements

1. **Mapbox GL Custom Layer:** Full WebGL integration for terrain
2. **Advanced Physics:** Rapier WASM for complex collisions
3. **Terrain Mesh:** Height map integration from Mapbox Elevation API
4. **Networking:** Multiplayer via WebSocket
5. **AR Features:** Device orientation for first-person AR
6. **Mobile Touch:** Joystick controls for mobile
7. **Audio:** Spatial audio following player heading
8. **Procedural Generation:** Infinite world expansion

## License & Attribution

Uses:
- **Mapbox GL JS** - Mapping library
- **Three.js** - 3D rendering
- **React** - UI framework

## Architecture Diagrams

### Coordinate Transformation Pipeline
```
GPS Input (-74.006, 40.7128)
    ↓
Haversine Distance & Bearing
    ↓
Exponential Moving Average (α=0.15)
    ↓
Mercator Projection (Web Mercator)
    ↓
Tile Coordinate Calculation (at zoom Z)
    ↓
Three.js World Units (scale based on zoom)
    ↓
Character Mesh Position (X, Y, Z)
```

### Physics Update Cycle
```
Input Frame (variable Δt)
    ↓
Add to Accumulator
    ↓
[While accumulator ≥ fixed timestep]
    ├─ Update physics bodies (1/60 seconds)
    ├─ Collision detection
    └─ Update rendering state
    ↓
Render current state
    ↓
Next frame
```

### Game State Flow
```
Game Manager (Master Clock)
    ├─ GPS Service → Coordinate System → Physics Body
    ├─ Physics World → Character Mesh
    ├─ Navigation System → Route Visualization
    ├─ Character Controller → Physics Impulses
    └─ Camera Controller → View Matrix

All systems update in fixed timestep loop
```
