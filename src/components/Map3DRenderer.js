import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useKeyboardControls } from '../useKeyboardControls';
import 'mapbox-gl/dist/mapbox-gl.css';

/**
 * Map3DRenderer - Pokemon GO 스타일 AR 지도
 * Mapbox 지도 위에 Three.js 3D 캐릭터 오버레이
 * 현재 위치 기반 지도 표시 + WASD로 캐릭터 이동
 */

// Mapbox token 설정
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1IjoiYmluc3MwMTI0IiwiYSI6ImNtaWI4NXR6ajEyczkycXIyemM1cGsxMzAifQ.bsLMFlQk7kwOeR5CoBB_IQ';

export default function Map3DRenderer() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Three.js 관련
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const characterRef = useRef(null);
  const characterPositionRef = useRef(new THREE.Vector3(0, 0.8, 0));
  const currentQuaternionRef = useRef(new THREE.Quaternion());
  const actionsRef = useRef({});
  const animationFrameRef = useRef(null);
  
  // 지도 관련
  const userLocationRef = useRef(null);
  const mapCenterRef = useRef(null);
  
  // 상태
  const [currentAnimation, setCurrentAnimation] = useState('Idle');
  const { forward, backward, left, right, shift } = useKeyboardControls();

  // 발걸음 소리 초기화
  useEffect(() => {
    const audioPaths = [
      '/resources/Sounds/Step2.wav',
      '/resources/Sounds/step2.wav',
      '/Sounds/Step2.wav',
    ];
    
    const audio = new Audio(audioPaths[0]);
    audio.volume = 0.8;
    audio.preload = 'auto';
    actionsRef.current.stepAudio = audio;

    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);

  // 발걸음 소리 재생
  const playStepSound = useCallback(() => {
    const audio = actionsRef.current.stepAudio;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  }, []);

  // 애니메이션 전환
  const changeAnimation = useCallback((newAnimation) => {
    if (currentAnimation === newAnimation) return;

    const actions = actionsRef.current.actions;
    if (!actions) return;

    const oldAction = actions[currentAnimation];
    const newAction = actions[newAnimation];

    if (oldAction) oldAction.fadeOut(0.5);
    if (newAction) newAction.reset().fadeIn(0.5).play();

    setCurrentAnimation(newAnimation);
    
    if (newAnimation === 'Walk' || newAnimation === 'Run') {
      actionsRef.current.lastStepTime = Date.now();
      actionsRef.current.stepInterval = newAnimation === 'Run' ? 350 : 550;
    }
  }, [currentAnimation]);

  // 애니메이션 업데이트
  const updateAnimation = useCallback(() => {
    const mixer = actionsRef.current.mixer;
    const clock = actionsRef.current.clock;
    if (mixer && clock) {
      mixer.update(clock.getDelta());

      if (currentAnimation === 'Walk' || currentAnimation === 'Run') {
        const currentTime = Date.now();
        if (currentTime - actionsRef.current.lastStepTime > actionsRef.current.stepInterval) {
          playStepSound();
          actionsRef.current.lastStepTime = currentTime;
        }
      }
    }
  }, [currentAnimation, playStepSound]);

  // 캐릭터 로드
  const loadCharacter = useCallback(async (scene) => {
    try {
      const loader = new GLTFLoader();
      const gltf = await new Promise((resolve, reject) => {
        loader.load(
          '/resources/Ultimate Animated Character Pack - Nov 2019/glTF/BaseCharacter.gltf',
          resolve,
          undefined,
          reject
        );
      });

      const character = gltf.scene;
      const scale = 0.1;
      character.scale.set(scale, scale, scale);
      
      character.position.copy(characterPositionRef.current);
      scene.add(character);
      characterRef.current = character;

      character.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      if (gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(character);
        const animationMap = {};
        gltf.animations.forEach((clip) => {
          animationMap[clip.name] = mixer.clipAction(clip);
        });
        
        actionsRef.current.mixer = mixer;
        actionsRef.current.clock = new THREE.Clock();
        actionsRef.current.actions = animationMap;
        actionsRef.current.currentAction = null;

        const idleAction = animationMap['Idle'];
        if (idleAction) {
          idleAction.play();
          actionsRef.current.currentAction = 'Idle';
        }
      }
    } catch (error) {
      console.error('❌ 캐릭터 로드 오류:', error);
    }
  }, []);

  // 캐릭터 움직임 업데이트
  const updateCharacterMovement = useCallback(() => {
    if (!characterRef.current) return;

    const speed = shift ? 0.12 : 0.06;
    let direction = new THREE.Vector3();

    if (forward) direction.z -= 1;
    if (backward) direction.z += 1;
    if (left) direction.x -= 1;
    if (right) direction.x += 1;

    if (direction.length() > 0) {
      direction.normalize();

      const targetAngle = Math.atan2(direction.x, direction.z);
      const targetQuaternion = new THREE.Quaternion();
      targetQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngle);

      currentQuaternionRef.current.slerp(targetQuaternion, 0.15);

      const moveVector = direction.clone();
      moveVector.applyQuaternion(currentQuaternionRef.current);
      moveVector.multiplyScalar(speed);

      characterPositionRef.current.add(moveVector);
    }

    let nextAnimation = 'Idle';
    if (forward || backward || left || right) {
      nextAnimation = shift ? 'Run' : 'Walk';
    }
    changeAnimation(nextAnimation);

    characterRef.current.position.copy(characterPositionRef.current);
    characterRef.current.quaternion.copy(currentQuaternionRef.current);
  }, [forward, backward, left, right, shift, changeAnimation]);

  // Mapbox 초기화
  useEffect(() => {
    if (mapRef.current) return;

    if (!mapboxgl.accessToken) {
      console.error('❌ Mapbox token not set');
      return;
    }

    // initMapbox 함수 정의
    const initMapbox = (center) => {
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: center,
        zoom: 18,
        pitch: 45,
        bearing: 0,
        antialias: true
      });

      map.on('load', () => {
        if (!map.getLayer('3d-buildings')) {
          map.addLayer({
            id: '3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            type: 'fill-extrusion',
            minzoom: 15,
            paint: {
              'fill-extrusion-color': '#aaa',
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': ['get', 'min_height'],
              'fill-extrusion-opacity': 0.6
            }
          });
        }

        mapCenterRef.current = map.getCenter();
        mapRef.current = map;
        initThreeJs();
      });
    };

    // 현재 위치 가져오기
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lng = pos.coords.longitude;
          const lat = pos.coords.latitude;
          userLocationRef.current = [lng, lat];
          
          console.log('📍 현재 위치:', [lng, lat]);
          initMapbox([lng, lat]);
        },
        (err) => {
          console.warn('❌ Geolocation 실패:', err);
          initMapbox([127.0276, 37.4979]);
        }
      );
    } else {
      initMapbox([127.0276, 37.4979]);
    }

    const initThreeJs = () => {
      if (!mapContainer.current) return;

      // Scene
      const scene = new THREE.Scene();
      scene.background = null;
      sceneRef.current = scene;

      // Canvas 생성
      const canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '10';
      mapContainer.current.appendChild(canvas);
      canvasRef.current = canvas;

      // Renderer
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      rendererRef.current = renderer;

      // Camera
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.01,
        1000
      );
      camera.position.set(0, 1, 1.5);
      camera.lookAt(0, 0.8, 0);
      cameraRef.current = camera;

      // 조명
      const ambientLight = new THREE.AmbientLight(0xffffff, 1);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 10, 5);
      directionalLight.castShadow = true;
      scene.add(directionalLight);

      // 캐릭터 로드
      loadCharacter(scene);

      // 렌더링 루프
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);

        updateCharacterMovement();
        updateAnimation();

        // 카메라 따라가기
        if (characterRef.current && camera) {
          const charPos = characterRef.current.position;
          const cameraDistance = 1.5;
          const cameraHeight = 1.2;
          
          const backward = new THREE.Vector3(0, 0, 1);
          backward.applyQuaternion(currentQuaternionRef.current);
          backward.multiplyScalar(cameraDistance);
          
          const targetCameraPos = charPos.clone();
          targetCameraPos.add(backward);
          targetCameraPos.y += cameraHeight;
          
          camera.position.lerp(targetCameraPos, 0.1);
          camera.lookAt(charPos.x, charPos.y + 0.8, charPos.z);

          // 지도 중심 업데이트
          if (mapRef.current && mapCenterRef.current && userLocationRef.current) {
            const centerLng = mapCenterRef.current.lng;
            const centerLat = mapCenterRef.current.lat;
            
            const meterPerDegreeLat = 111000;
            const meterPerDegreeLng = 111000 * Math.cos(centerLat * Math.PI / 180);
            
            const deltaLng = charPos.x / meterPerDegreeLng;
            const deltaLat = charPos.z / meterPerDegreeLat;
            
            const newLng = centerLng + deltaLng;
            const newLat = centerLat - deltaLat;
            
            mapRef.current.setCenter([newLng, newLat]);
            
            const euler = new THREE.Euler().setFromQuaternion(currentQuaternionRef.current);
            const bearing = (euler.y * 180 / Math.PI + 180) % 360;
            mapRef.current.setBearing(bearing);
          }
        }

        renderer.render(scene, camera);
      };

      animate();

      // 윈도우 리사이즈
      const handleResize = () => {
        if (cameraRef.current && rendererRef.current) {
          const w = window.innerWidth;
          const h = window.innerHeight;
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    };
  }, [loadCharacter, updateCharacterMovement, updateAnimation]);

  return (
    <div
      ref={mapContainer}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        zIndex: 100
      }}
    />
  );
}
