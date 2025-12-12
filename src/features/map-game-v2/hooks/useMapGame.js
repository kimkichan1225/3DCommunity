/**
 * useMapGame Hook
 * React integration for GameManager
 * Simplifies game initialization and lifecycle management
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import GameManager from '../core/GameManager';

/**
 * Hook to manage map game lifecycle
 * 
 * @param {HTMLElement} canvasElement - Canvas element reference
 * @param {object} options - Game initialization options
 * @returns {object} Game API { gameManager, gameState, startGame, stopGame, ... }
 */
export function useMapGame(canvasElement, options = {}) {
  const gameManagerRef = useRef(null);
  const [gameState, setGameState] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  // Initialize game manager
  useEffect(() => {
    if (!canvasElement) return;

    const initGame = async () => {
      try {
        const gameManager = new GameManager(canvasElement, {
          coordinates: {
            zoom: options.zoom || 18,
            initialPosition: options.initialPosition,
            smoothingEnabled: options.smoothingEnabled !== false,
          },
          scene: {
            width: canvasElement.clientWidth,
            height: canvasElement.clientHeight,
          },
          physics: {
            fixedTimestep: 1 / 60,
          },
          gps: {
            updateIntervalMs: options.gpsUpdateInterval || 1000,
            simulationMode: options.simulationMode || false,
            initialLocation: options.initialPosition,
          },
          camera: {
            distance: options.cameraDistance || 12,
            height: options.cameraHeight || 6,
            lookAheadDistance: options.lookAheadDistance || 30,
          },
        });

        await gameManager.initialize();

        // Setup state listeners
        gameManager.on('onPlayerPositionUpdate', (data) => {
          setGameState(prevState => ({
            ...prevState,
            playerPosition: data.position,
            playerHeading: data.heading,
            playerLngLat: data.lngLat,
            gpsAccuracy: data.gpsAccuracy,
          }));
        });

        gameManager.on('onNavigationUpdate', (data) => {
          setGameState(prevState => ({
            ...prevState,
            navigationEvent: data.event,
            navigationData: data,
          }));
        });

        gameManager.on('onGameStateChange', (data) => {
          setGameState(prevState => ({
            ...prevState,
            gameRunning: data.state === 'running',
            gamePaused: data.state === 'paused',
          }));
        });

        gameManagerRef.current = gameManager;
        setIsInitialized(true);
        setGameState({
          gameRunning: false,
          gamePaused: false,
          playerPosition: { x: 0, y: 0, z: 0 },
          playerHeading: 0,
          playerLngLat: { lng: 0, lat: 0 },
          gpsAccuracy: 0,
          navigationEvent: null,
        });
      } catch (err) {
        console.error('Failed to initialize game:', err);
        setError(err.message);
      }
    };

    initGame();

    return () => {
      if (gameManagerRef.current) {
        gameManagerRef.current.dispose();
      }
    };
  }, [canvasElement, options]);

  // Game control functions
  const startGame = useCallback(() => {
    if (gameManagerRef.current) {
      gameManagerRef.current.start();
    }
  }, []);

  const stopGame = useCallback(() => {
    if (gameManagerRef.current) {
      gameManagerRef.current.stop();
    }
  }, []);

  const pauseGame = useCallback(() => {
    if (gameManagerRef.current) {
      gameManagerRef.current.pause();
    }
  }, []);

  const resumeGame = useCallback(() => {
    if (gameManagerRef.current) {
      gameManagerRef.current.resume();
    }
  }, []);

  // Navigation functions
  const requestRoute = useCallback(
    async (destination, routeOptions = {}) => {
      if (gameManagerRef.current) {
        return gameManagerRef.current.requestRoute(destination, routeOptions);
      }
    },
    []
  );

  const startNavigation = useCallback(() => {
    if (gameManagerRef.current) {
      gameManagerRef.current.startNavigation();
    }
  }, []);

  const stopNavigation = useCallback(() => {
    if (gameManagerRef.current) {
      gameManagerRef.current.stopNavigation();
    }
  }, []);

  // Input functions
  const setInput = useCallback((inputState) => {
    if (gameManagerRef.current && gameManagerRef.current.player) {
      gameManagerRef.current.player.setInput(inputState);
    }
  }, []);

  // Camera functions
  const setCameraView = useCallback((viewType) => {
    if (gameManagerRef.current && gameManagerRef.current.camera) {
      switch (viewType) {
        case 'first-person':
          gameManagerRef.current.camera.setFirstPersonView();
          break;
        case 'third-person':
          gameManagerRef.current.camera.setThirdPersonView();
          break;
        case 'cinematic':
          gameManagerRef.current.camera.setCinematicView();
          break;
        case 'mobile':
          gameManagerRef.current.camera.setMobileView();
          break;
      }
    }
  }, []);

  // Performance monitoring
  const getPerformanceMetrics = useCallback(() => {
    if (gameManagerRef.current) {
      return gameManagerRef.current.perfMonitor.getMetrics();
    }
    return null;
  }, []);

  return {
    gameManager: gameManagerRef.current,
    gameState,
    isInitialized,
    error,

    // Game controls
    startGame,
    stopGame,
    pauseGame,
    resumeGame,

    // Navigation
    requestRoute,
    startNavigation,
    stopNavigation,

    // Input
    setInput,

    // Camera
    setCameraView,

    // Monitoring
    getPerformanceMetrics,
  };
}

export default useMapGame;
