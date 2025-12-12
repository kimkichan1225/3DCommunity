/**
 * 지도 게임 페이지 - 네비게이션 스타일
 * GPS 기반 3D 네비게이션 게임
 */

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import * as THREE from 'three';
import { CoordinateSystem } from '../map/CoordinateSystem';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { CharacterPhysics } from '../physics/CharacterPhysics';
import { TPSCamera } from '../camera/TPSCamera';
import { GameLoopManager } from '../game-loop/GameLoopManager';
import { NavigationManager } from '../navigation/NavigationManager';
import { GPSManager } from '../gps/GPSManager';
import { MapGameHUD } from '../../components/map-game/MapGameHUD';
import './MapGamePage.css';

export function MapGamePage() {
  const containerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [route, setRoute] = useState(null);
  const [destination, setDestination] = useState(null);
  const [navigationInfo, setNavigationInfo] = useState(null);
  const gameRef = useRef(null);
  const gameStateUpdateRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const initGame = async () => {
      try {
        console.log('🎮 게임 초기화 중...');

        // 1️⃣ Mapbox 초기화
        mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;
        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [127.0276, 37.4979],
          zoom: 19,
          pitch: 70,
          bearing: 0,
          antialias: true,
          attributionControl: false,
        });

        // 2️⃣ Three.js 초기화
        const scene = new THREE.Scene();
        const canvas = map.getCanvas();
        const gl = map.painter.context.gl;

        const renderer = new THREE.WebGLRenderer({
          canvas,
          context: gl,
          antialias: false,
          alpha: true,
          preserveDrawingBuffer: true,
        });
        renderer.autoClear = false;
        renderer.shadowMap.enabled = false;

        const camera = new THREE.PerspectiveCamera(
          40,
          canvas.width / canvas.height,
          0.1,
          10000
        );

        // 3️⃣ 조명
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
        sunLight.position.set(100, 100, 100);
        scene.add(sunLight);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        // 4️⃣ 좌표 시스템
        const coordSystem = new CoordinateSystem({
          lng: 127.0276,
          lat: 37.4979,
        });

        // 5️⃣ 물리 월드
        const physicsWorld = PhysicsWorld.create();
        PhysicsWorld.createGround(physicsWorld);

        // 6️⃣ 캐릭터 생성
        const characterGeom = new THREE.CapsuleGeometry(0.4, 1.6, 4, 8);
        const characterMat = new THREE.MeshStandardMaterial({
          color: 0x4CAF50, // 녹색으로 변경
          emissive: 0x2E7D32,
        });
        const characterMesh = new THREE.Mesh(characterGeom, characterMat);
        characterMesh.position.y = 1;
        scene.add(characterMesh);

        const characterPhysics = new CharacterPhysics(
          physicsWorld,
          characterMesh,
          coordSystem
        );

        // 7️⃣ 카메라 시스템
        const tpsCamera = new TPSCamera(camera, characterMesh, renderer);

        // 8️⃣ 게임 루프
        const gameLoop = new GameLoopManager({
          scene,
          world: physicsWorld,
          camera,
          map,
          renderer,
          characterMesh,
          characterPhysics,
          tpsCamera,
          coordSystem,
        });

        // 9️⃣ GPS 매니저
        const gpsManager = new GPSManager();
        gpsManager.onLocationUpdate = (gps) => {
          characterPhysics.updateFromGPS(gps);
        };
        gpsManager.setSimulationMode(true);
        gpsManager.start();

        // 🔟 네비게이션 매니저
        const navigationManager = new NavigationManager(
          map,
          scene,
          coordSystem
        );

        // 게임 상태 및 네비게이션 정보 업데이트
        gameStateUpdateRef.current = setInterval(() => {
          const state = gameLoop.getGameState();
          setGameState(state);

          // 네비게이션 정보 업데이트
          if (route) {
            const navInfo = navigationManager.getNavigationInfo();
            setNavigationInfo(navInfo);
          }
        }, 200);

        gameRef.current = {
          map,
          scene,
          renderer,
          camera,
          coordSystem,
          physicsWorld,
          characterPhysics,
          tpsCamera,
          gameLoop,
          gpsManager,
          navigationManager,
        };

        // Mapbox Custom Layer
        const customLayer = {
          id: 'game-layer',
          type: 'custom',
          renderingMode: '3d',
          onAdd(map, gl) {
            console.log('✅ Custom Layer 초기화됨');
          },
          render(gl, matrix) {
            // 렌더링은 GameLoopManager가 처리
          },
        };
        map.addLayer(customLayer);

        gameLoop.start();
        setIsReady(true);
        console.log('✅ 게임 초기화 완료');
      } catch (error) {
        console.error('❌ 게임 초기화 실패:', error);
      }
    };

    initGame();

    return () => {
      if (gameStateUpdateRef.current) {
        clearInterval(gameStateUpdateRef.current);
      }
      if (gameRef.current) {
        gameRef.current.gpsManager.stop();
        gameRef.current.gameLoop.stop();
        gameRef.current.renderer.dispose();
      }
    };
  }, []);

  const handleNavigateTo = async (destLng, destLat) => {
    if (!gameRef.current) return;

    const { navigationManager, gpsManager } = gameRef.current;
    const currentGPS = gpsManager.getLastGPS();

    if (!currentGPS) {
      alert('현재 위치를 알 수 없습니다');
      return;
    }

    try {
      const routeData = await navigationManager.requestRoute(
        currentGPS,
        { lng: destLng, lat: destLat }
      );

      if (routeData) {
        navigationManager.visualizeRoute(routeData);
        setRoute(routeData);
        setDestination({ lng: destLng, lat: destLat });
      }
    } catch (error) {
      console.error('경로 요청 실패:', error);
      alert('경로를 찾을 수 없습니다');
    }
  };

  const clearRoute = () => {
    if (gameRef.current) {
      gameRef.current.navigationManager.clearRoute();
    }
    setRoute(null);
    setDestination(null);
    setNavigationInfo(null);
  };

  return (
    <div className="map-game-page">
      <div ref={containerRef} className="map-game-container" />

      {/* 로딩 오버레이 */}
      {!isReady && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <p>🗺️ 게임 로드 중...</p>
        </div>
      )}

      {/* 메인 HUD */}
      {isReady && gameState && (
        <MapGameHUD
          gameState={gameState}
          game={gameRef.current}
          route={route}
          destination={destination}
          navigationInfo={navigationInfo}
          onNavigateTo={handleNavigateTo}
          onClearRoute={clearRoute}
        />
      )}

      {/* 뒤로가기 버튼 */}
      {isReady && (
        <button
          className="btn-back-navigation"
          onClick={() => window.history.back()}
        >
          ← 뒤로
        </button>
      )}
    </div>
  );
}
