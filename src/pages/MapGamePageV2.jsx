/**
 * MapGamePageV2.jsx
 * Complete example integration of the map game system
 * Shows how to use GameManager and React hooks for a location-based game
 */

import React, { useRef, useEffect, useState } from 'react';
import { useMapGame } from '../features/map-game-v2/hooks/useMapGame';
import './MapGamePageV2.css';

export default function MapGamePageV2() {
  const canvasRef = useRef(null);
  const [destination, setDestination] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [navigationActive, setNavigationActive] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [cameraMode, setCameraMode] = useState('third-person');

  // Initialize game with hook
  const {
    gameState,
    isInitialized,
    error,
    startGame,
    stopGame,
    requestRoute,
    startNavigation,
    stopNavigation,
    setCameraView,
    getPerformanceMetrics,
  } = useMapGame(canvasRef.current, {
    zoom: 18,
    cameraDistance: 12,
    cameraHeight: 6,
    lookAheadDistance: 30,
    gpsUpdateInterval: 1000,
    simulationMode: false, // Set to true for testing without GPS
    smoothingEnabled: true,
  });

  // Auto-start game after initialization
  useEffect(() => {
    if (isInitialized) {
      startGame();
    }

    return () => {
      stopGame();
    };
  }, [isInitialized, startGame, stopGame]);

  // Handle route requests
  const handleRequestRoute = async () => {
    if (!destination || !gameState?.playerLngLat) {
      alert('Please enter a destination and ensure GPS is working');
      return;
    }

    try {
      const route = await requestRoute(destination, {
        profile: 'mapbox/walking',
        alternatives: false,
      });

      if (route) {
        const summary = route.getSummary();
        setRouteInfo(summary);
        setNavigationActive(true);
        startNavigation();
      }
    } catch (err) {
      console.error('Route request failed:', err);
      alert(`Failed to get route: ${err.message}`);
    }
  };

  // Format distance
  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
  };

  // Get performance metrics
  const perfMetrics = getPerformanceMetrics();

  if (error) {
    return (
      <div className="map-game-error">
        <h2>Initialization Error</h2>
        <p>{error}</p>
        <p>Check browser console for more details.</p>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="map-game-loading">
        <div className="spinner"></div>
        <p>Loading 3D Game Environment...</p>
      </div>
    );
  }

  return (
    <div className="map-game-container">
      {/* Canvas for 3D rendering */}
      <canvas
        ref={canvasRef}
        className="game-canvas"
        style={{ width: '100%', height: '100%' }}
      />

      {/* HUD Overlay */}
      <div className="game-hud">
        {/* Top-left: Player Info */}
        <div className="hud-panel hud-player-info">
          <div className="hud-title">Player</div>
          <div className="hud-stat">
            <span className="label">Position:</span>
            <span className="value">
              {gameState?.playerLngLat?.lat.toFixed(4)},
              {gameState?.playerLngLat?.lng.toFixed(4)}
            </span>
          </div>
          <div className="hud-stat">
            <span className="label">GPS Accuracy:</span>
            <span className={`value ${
              gameState?.gpsAccuracy <= 10 ? 'good' : 
              gameState?.gpsAccuracy <= 50 ? 'fair' : 'poor'
            }`}>
              ±{gameState?.gpsAccuracy.toFixed(1)}m
            </span>
          </div>
          <div className="hud-stat">
            <span className="label">Heading:</span>
            <span className="value">
              {Math.round((gameState?.playerHeading * 180) / Math.PI)}°
            </span>
          </div>
        </div>

        {/* Top-right: Performance */}
        <div className="hud-panel hud-performance">
          <div className="hud-title">Performance</div>
          <div className="hud-stat">
            <span className="label">FPS:</span>
            <span className={`value ${perfMetrics?.fps >= 55 ? 'good' : 'fair'}`}>
              {perfMetrics?.fps}
            </span>
          </div>
          <div className="hud-stat">
            <span className="label">Frame:</span>
            <span className="value">
              {perfMetrics?.frameTime?.avg.toFixed(2)}ms
            </span>
          </div>
          <div className="hud-stat">
            <span className="label">Memory:</span>
            <span className="value">
              {perfMetrics?.memory?.usedMB.toFixed(1)}MB
            </span>
          </div>
        </div>

        {/* Center-bottom: Navigation Info */}
        {navigationActive && routeInfo && (
          <div className="hud-panel hud-navigation">
            <div className="hud-title">Navigation</div>
            <div className="hud-stat">
              <span className="label">Distance:</span>
              <span className="value">{routeInfo.distanceKm}km</span>
            </div>
            <div className="hud-stat">
              <span className="label">Duration:</span>
              <span className="value">{routeInfo.durationMinutes}min</span>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => {
                stopNavigation();
                setNavigationActive(false);
                setRouteInfo(null);
              }}
            >
              Stop Navigation
            </button>
          </div>
        )}

        {/* Bottom-left: Controls */}
        {showControls && (
          <div className="hud-panel hud-controls">
            <div className="hud-title">Controls</div>
            <div className="control-group">
              <p className="control-hint">Movement:</p>
              <div className="key-hint">
                <span className="key">W</span> Forward
              </div>
              <div className="key-hint">
                <span className="key">A</span> Left
              </div>
              <div className="key-hint">
                <span className="key">S</span> Back
              </div>
              <div className="key-hint">
                <span className="key">D</span> Right
              </div>
              <div className="key-hint">
                <span className="key">Shift</span> Sprint
              </div>
              <div className="key-hint">
                <span className="key">Space</span> Jump
              </div>
            </div>
            <button
              className="btn btn-small"
              onClick={() => setShowControls(false)}
            >
              Hide Controls
            </button>
          </div>
        )}

        {/* Bottom-right: Camera & Destination */}
        <div className="hud-panel hud-options">
          <div className="hud-title">Settings</div>

          <div className="control-group">
            <label>Camera View:</label>
            <select
              value={cameraMode}
              onChange={(e) => {
                setCameraMode(e.target.value);
                setCameraView(e.target.value);
              }}
              className="select"
            >
              <option value="first-person">First Person</option>
              <option value="third-person">Third Person</option>
              <option value="cinematic">Cinematic</option>
              <option value="mobile">Mobile</option>
            </select>
          </div>

          <div className="control-group">
            <label>Destination Lat:</label>
            <input
              type="number"
              step="0.0001"
              placeholder="40.7128"
              value={destination?.lat || ''}
              onChange={(e) =>
                setDestination({
                  ...destination,
                  lat: parseFloat(e.target.value),
                })
              }
              className="input"
            />
          </div>

          <div className="control-group">
            <label>Destination Lng:</label>
            <input
              type="number"
              step="0.0001"
              placeholder="-74.0060"
              value={destination?.lng || ''}
              onChange={(e) =>
                setDestination({
                  ...destination,
                  lng: parseFloat(e.target.value),
                })
              }
              className="input"
            />
          </div>

          <button className="btn btn-primary" onClick={handleRequestRoute}>
            Get Route
          </button>

          {!showControls && (
            <button
              className="btn btn-small"
              onClick={() => setShowControls(true)}
            >
              Show Controls
            </button>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="game-statusbar">
        <span className="status-item">
          {navigationActive ? '🧭 Navigating' : '📍 Idle'}
        </span>
        <span className="status-item">
          {gameState?.playerLngLat
            ? `📌 ${gameState.playerLngLat.lat.toFixed(4)}, ${gameState.playerLngLat.lng.toFixed(4)}`
            : '⏳ Waiting for GPS'}
        </span>
      </div>
    </div>
  );
}
