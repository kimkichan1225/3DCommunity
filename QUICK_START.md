# Quick Start Guide - Map Game V2

## 5-Minute Setup

### 1. Basic Game Component

```javascript
import React, { useRef, useEffect } from 'react';
import { useMapGame } from './features/map-game-v2/hooks/useMapGame';

export default function GamePage() {
  const canvasRef = useRef(null);
  
  const {
    gameState,
    isInitialized,
    startGame,
    requestRoute,
    startNavigation,
  } = useMapGame(canvasRef.current, {
    zoom: 18,
    gpsUpdateInterval: 1000,
    simulationMode: false, // true for testing
  });

  useEffect(() => {
    if (isInitialized) {
      startGame();
    }
  }, [isInitialized, startGame]);

  return (
    <>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', top: 20, left: 20, color: 'white' }}>
        <p>Position: {gameState?.playerLngLat?.lng}, {gameState?.playerLngLat?.lat}</p>
        <p>GPS Accuracy: ±{gameState?.gpsAccuracy.toFixed(1)}m</p>
      </div>
    </>
  );
}
```

### 2. With Navigation

```javascript
const [destination, setDestination] = React.useState(null);

const handleNavigate = async () => {
  await requestRoute(destination, { profile: 'mapbox/walking' });
  startNavigation();
};

return (
  <>
    <canvas ref={canvasRef} />
    <input
      placeholder="Destination latitude"
      onChange={(e) => setDestination({ ...destination, lat: parseFloat(e.target.value) })}
    />
    <input
      placeholder="Destination longitude"
      onChange={(e) => setDestination({ ...destination, lng: parseFloat(e.target.value) })}
    />
    <button onClick={handleNavigate}>Navigate</button>
  </>
);
```

### 3. Enable GPS Simulation (Development)

```javascript
const { gameManager } = useMapGame(canvasRef.current, {
  simulationMode: true, // Enable simulation mode
});

// Set a walking path for testing
useEffect(() => {
  if (gameManager?.gpsService) {
    gameManager.gpsService.setSimulationPath([
      [-74.006, 40.7128],  // NYC
      [-74.005, 40.7129],
      [-74.004, 40.7130],
    ]);
  }
}, [gameManager]);
```

## Keyboard Controls

| Key | Action |
|-----|--------|
| W | Move forward |
| A | Strafe left |
| S | Move backward |
| D | Strafe right |
| Shift | Sprint |
| Space | Jump |

## Camera Presets

```javascript
const { setCameraView } = useMapGame(canvasRef.current);

// Available presets:
setCameraView('first-person');   // Eyes level
setCameraView('third-person');   // Default: 12m behind, 6m high
setCameraView('cinematic');      // Far view: 25m behind, 15m high
setCameraView('mobile');         // Optimized for mobile
```

## Performance Monitoring

```javascript
const { getPerformanceMetrics } = useMapGame(canvasRef.current);

// Get metrics
const metrics = getPerformanceMetrics();
console.log(`FPS: ${metrics.fps}`);
console.log(`Frame time: ${metrics.frameTime.avg.toFixed(2)}ms`);
console.log(`Memory: ${metrics.memory.usedMB.toFixed(1)}MB`);
```

## Route Management

```javascript
const { requestRoute, startNavigation, stopNavigation } = useMapGame(canvasRef.current);

// Request route
const currentPos = { lng: -74.006, lat: 40.7128 };
const destination = { lng: -74.0, lat: 40.72 };

const route = await requestRoute(destination, {
  profile: 'mapbox/walking', // or 'mapbox/driving', 'mapbox/cycling'
  alternatives: false,
});

// Start following
startNavigation();

// Stop when done
stopNavigation();
```

## Game Manager Direct Access

```javascript
const { gameManager } = useMapGame(canvasRef.current);

// Access any system directly
const currentGPS = gameManager.gpsService.getLocation();
const navState = gameManager.navigationSystem.getNavigationState();
const playerState = gameManager.player.getState();

// Listen to events
gameManager.on('onPlayerPositionUpdate', (data) => {
  console.log('Player moved:', data.position);
});

gameManager.on('onNavigationUpdate', (data) => {
  console.log('Navigation event:', data.event);
});
```

## Common Scenarios

### Scenario 1: Simple Player Movement

```javascript
function SimpleGame() {
  const canvasRef = useRef(null);
  const { gameState, isInitialized, startGame } = useMapGame(canvasRef.current);

  useEffect(() => {
    if (isInitialized) startGame();
  }, [isInitialized, startGame]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
}
```

### Scenario 2: Route-Based Game

```javascript
function NavigationGame() {
  const canvasRef = useRef(null);
  const { gameManager, isInitialized, startGame } = useMapGame(canvasRef.current);
  const [routeActive, setRouteActive] = React.useState(false);

  useEffect(() => {
    if (!gameManager) return;

    startGame();

    // Listen for waypoint arrivals
    gameManager.navigationSystem.on('onWaypointReached', (data) => {
      console.log(`Reached waypoint ${data.waypointIndex}/${data.totalWaypoints}`);
      if (data.waypointIndex === data.totalWaypoints - 1) {
        console.log('Route complete!');
        setRouteActive(false);
      }
    });
  }, [gameManager, startGame]);

  const start = async () => {
    const route = await gameManager.requestRoute({ lng: -74.0, lat: 40.72 });
    gameManager.startNavigation();
    setRouteActive(true);
  };

  return (
    <>
      <canvas ref={canvasRef} />
      <button onClick={start} disabled={routeActive}>
        {routeActive ? 'Navigating...' : 'Start'}
      </button>
    </>
  );
}
```

### Scenario 3: GPS Testing Without Real GPS

```javascript
function TestGame() {
  const canvasRef = useRef(null);
  const { gameManager, isInitialized, startGame } = useMapGame(canvasRef.current, {
    simulationMode: true, // Enable GPS simulation
  });

  useEffect(() => {
    if (!gameManager) return;
    
    // Create walking path around NYC
    gameManager.gpsService.setSimulationPath([
      [-74.006, 40.7128],
      [-74.005, 40.7129],
      [-74.004, 40.7130],
      [-74.003, 40.7129],
      [-74.004, 40.7128],
    ], 2.0); // 2x speed

    startGame();
  }, [gameManager, startGame]);

  return <canvas ref={canvasRef} />;
}
```

## Debugging

### Check GPS Signal

```javascript
const { gameManager } = useMapGame(canvasRef.current);

setInterval(() => {
  const gps = gameManager.gpsService.getLocation();
  console.log(`GPS: ${gps.lat}, ${gps.lng} (±${gps.accuracy}m)`);
  console.log(`Speed: ${gps.speed.toFixed(2)}m/s, Heading: ${gps.heading.toFixed(0)}°`);
}, 1000);
```

### Verify Coordinates

```javascript
const { gameManager } = useMapGame(canvasRef.current);

const gps = { lng: -74.006, lat: 40.7128 };
const world = gameManager.coordinateSystem.gpsToWorld(gps);
const backToGps = gameManager.coordinateSystem.worldToGPS(world);

console.log('Original GPS:', gps);
console.log('World coords:', world);
console.log('Back to GPS:', backToGps);
console.log('Error:', {
  lng: Math.abs(gps.lng - backToGps.lng),
  lat: Math.abs(gps.lat - backToGps.lat),
});
```

### Monitor Performance

```javascript
const { gameManager } = useMapGame(canvasRef.current);

setInterval(() => {
  const metrics = gameManager.perfMonitor.getMetrics();
  console.table({
    FPS: metrics.fps,
    'Frame (avg)': metrics.frameTime.avg.toFixed(2) + 'ms',
    'Frame (max)': metrics.frameTime.max.toFixed(2) + 'ms',
    'Physics (avg)': metrics.physicsTime.avg.toFixed(2) + 'ms',
    'Memory': metrics.memory.usedMB.toFixed(1) + 'MB',
  });
}, 2000);
```

## Troubleshooting

### GPS Not Working
1. Check browser permissions (Settings → Privacy → Location)
2. Ensure HTTPS (required for Geolocation API)
3. Enable simulation mode for testing
4. Check browser console for errors

### Low FPS
1. Reduce camera distance: `setCameraView('mobile')`
2. Lower route visualization quality (fewer segments)
3. Disable shadows if performance is critical
4. Check memory usage with performance metrics

### Routes Not Loading
1. Verify Mapbox API token in `.env`
2. Check internet connection
3. Verify destination coordinates are valid
4. Check browser console for API errors

### Camera Jerky
1. Increase smoothing speed: `camera.setParameters({ smoothingSpeed: 0.05 })`
2. Check GPS update interval (reduce for smoother data)
3. Verify physics framerate is stable

## Environment Variables

```bash
# .env
REACT_APP_MAPBOX_TOKEN=your_mapbox_api_token_here
REACT_APP_GPS_SIMULATION=false  # true for development
```

## Next Steps

1. **Copy the example page**: Use `MapGamePageV2.jsx` as a starting template
2. **Configure your map**: Set initial position and zoom level
3. **Add game logic**: Implement quests, challenges, or scoring
4. **Customize UI**: Modify CSS to match your app's branding
5. **Test thoroughly**: Use GPS simulation first, then real device
6. **Deploy**: Follow standard React deployment procedures

## Documentation

- **Full Architecture**: `src/features/map-game-v2/README.md`
- **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`
- **API Reference**: See JSDoc comments in source files

## Support

Check the comprehensive documentation in:
- `README.md` - Full architecture and algorithms
- Source file comments - Detailed function documentation
- Example page - Complete working implementation

Good luck building! 🚀
