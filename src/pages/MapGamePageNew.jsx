import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations, Text, Billboard } from '@react-three/drei';
import mapboxgl from 'mapbox-gl';
import { MapboxManager } from '../core/map/MapboxManager';
import { useKeyboardControls } from '../useKeyboardControls';
import multiplayerService from '../services/multiplayerService';
import shopService from '../features/shop/services/shopService';
import OtherPlayer from '../components/character/OtherPlayer';
import PersonalRoomModal from '../components/PersonalRoomModal';
import PersonalRoom3D, { FURNITURE_TYPES, FurnitureInventory } from '../components/map/PersonalRoom3D';
import PersonalRoomChat from '../components/map/PersonalRoomChat';
import ChatBubble from '../components/character/ChatBubble';
import '../pages/MapGamePageNew.css';

// 기본 캐릭터 모델 경로
const DEFAULT_CHARACTER_MODEL = '/resources/Ultimate Animated Character Pack - Nov 2019/glTF/BaseCharacter.gltf';

// GPS 좌표 <-> 3D 좌표 변환 스케일
const GPS_SCALE = 100000;

// 포탈 진입 거리 (유닛)
const PORTAL_ENTER_DISTANCE = 5;

// 개인 룸 관련 상수
const EXIT_PORTAL_POSITION = [0, 0, -18]; // PersonalRoom3D.jsx의 ExitPortal 위치와 동일
const EXIT_DISTANCE = 3; // 출구 포탈 진입 거리

/**
 * 새로운 지도 게임 페이지
 * 좌측: Three.js 3D 캐릭터 (Level1과 동일한 이동 로직)
 * 우측: Mapbox 지도 (GPS 위치)
 */
function MapGamePageNew({ onShowCreateRoom, onShowLobby }) {
  const navigate = useNavigate();
  const mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN;
  const mapContainerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // 다른 플레이어 상태 (App.js와 동일)
  const [otherPlayers, setOtherPlayers] = useState({});
  
  // 사용자 정보 (localStorage에서 가져오기) - useMemo로 안정화
  const userInfo = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
  const userId = useMemo(() => userInfo.id || `guest_${Date.now()}`, [userInfo.id]);
  const username = useMemo(() => userInfo.username || '게스트', [userInfo.username]);
  const isLoggedIn = !!userInfo.id;

  // 캐릭터 모델 경로 상태 (메인맵과 동일하게 착용 중인 아바타 사용)
  const [characterModelPath, setCharacterModelPath] = useState(DEFAULT_CHARACTER_MODEL);

  // 착용 중인 아바타 로드
  useEffect(() => {
    const loadEquippedAvatar = async () => {
      if (!isLoggedIn) return;
      
      try {
        const equippedAvatar = await shopService.getEquippedAvatar();
        if (equippedAvatar && equippedAvatar.shopItem && equippedAvatar.shopItem.modelUrl) {
          console.log('✅ [MapGamePage] 착용 중인 아바타 로드:', equippedAvatar.shopItem.modelUrl);
          setCharacterModelPath(equippedAvatar.shopItem.modelUrl);
        } else {
          console.log('[MapGamePage] 착용 중인 아바타 없음 - BaseCharacter 사용');
        }
      } catch (error) {
        console.error('[MapGamePage] 착용 아바타 로드 실패:', error);
      }
    };

    loadEquippedAvatar();
  }, [isLoggedIn]);

  // 고정된 스폰 위치 (모든 플레이어 동일)
  const SPAWN_POSITION = [0, 0, 0];

  // 캐릭터 상태 공유
  const characterStateRef = useRef({
    position: SPAWN_POSITION,
    rotation: 0,
    isMoving: false,
    animation: 'idle'
  });

  // PersonalRoom3D ref (가구 관리 UI용)
  const personalRoom3DRef = useRef(null);
  const [furnitureUIState, setFurnitureUIState] = useState({
    furniture: [],
    editMode: false,
    selectedFurniture: null,
    showToolbar: false,
    showInventory: false,
    showFurnitureList: false,
    showDeleteConfirm: false,
    isHost: false,
  });

  // Mapbox 참조
  const mapboxManagerRef = useRef(null);

  // 주변 방 목록 상태
  const [nearbyRooms, setNearbyRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showRoomPopup, setShowRoomPopup] = useState(false);

  // 건물 데이터 상태
  const [buildingsData, setBuildingsData] = useState([]);
  const [roadsData, setRoadsData] = useState([]);

  // 미니맵 캔버스 참조
  const minimapCanvasRef = useRef(null);

  // 개인 룸 모달 상태
  const [showPersonalRoomModal, setShowPersonalRoomModal] = useState(false);
  const [personalRoomMode, setPersonalRoomMode] = useState('create'); // 'create', 'waiting', 'browse'
  const [currentPersonalRoom, setCurrentPersonalRoom] = useState(null);
  
  // 개인 룸 3D 뷰 모드 (true면 개인 룸 내부 3D로 전환)
  const [isInPersonalRoom, setIsInPersonalRoom] = useState(false);
  
  // 채팅 말풍선 상태 (개인 룸 내에서)
  const [myChatMessage, setMyChatMessage] = useState(''); // 내 캐릭터의 채팅 메시지
  const [playerChatMessages, setPlayerChatMessages] = useState({}); // 다른 플레이어 채팅 { odlayerId: { message, timestamp } }
  const myMessageTimerRef = useRef(null);
  const playerMessageTimersRef = useRef({});
  
  // 친구 목록 상태 (실제로는 서비스에서 가져옴)
  const [friendsList, setFriendsList] = useState([]);

  // 친구 목록 로드
  useEffect(() => {
    // TODO: 실제 친구 서비스에서 친구 목록을 가져오도록 구현
    // 지금은 다른 플레이어를 친구로 가정
    const friendsFromPlayers = Object.values(otherPlayers).map(player => ({
      id: player.id,
      username: player.username,
      selectedProfile: player.selectedProfile,
      isOnline: true
    }));
    setFriendsList(friendsFromPlayers);
  }, [otherPlayers]);

  // isInPersonalRoom 상태 변경 모니터링
  useEffect(() => {
    console.log('📍 isInPersonalRoom 상태 변경:', isInPersonalRoom);
    console.log('🏠 currentPersonalRoom:', currentPersonalRoom?.roomId);
  }, [isInPersonalRoom]);

  // 멀티플레이어 서비스 콜백 설정 (App.js와 동일한 로직)
  useEffect(() => {
    console.log('🎮 MapGamePageNew: 멀티플레이어 콜백 설정...');
    console.log('📊 연결 상태:', { 
      connected: multiplayerService.connected, 
      clientConnected: multiplayerService.client?.connected,
      userId, 
      username, 
      isLoggedIn 
    });
    
    // 플레이어 입장 콜백
    const handlePlayerJoin = (data) => {
      // 중복 로그인 체크
      if (data.action === 'duplicate') {
        if (isLoggedIn && String(data.userId) === String(userId)) {
          alert('현재 접속 중인 아이디입니다.');
        }
        return;
      }

      // 자신의 join 이벤트는 무시
      if (String(data.userId) === String(userId)) {
        console.log('Ignoring own join event:', data.userId);
        return;
      }

      console.log('👤 [MapGamePage] 플레이어 입장:', data.username, data.userId);

      // 다른 플레이어 추가 (모든 플레이어 동일 스폰 위치)
      setOtherPlayers((prev) => ({
        ...prev,
        [data.userId]: {
          userId: data.userId,
          username: data.username,
          position: [0, 0, 0], // 모든 플레이어가 동일한 스폰 위치
          rotationY: 0,
          animation: 'idle',
          modelPath: data.modelPath || DEFAULT_CHARACTER_MODEL
        }
      }));
    };

    // 플레이어 퇴장 콜백
    const handlePlayerLeave = (data) => {
      console.log('👋 [MapGamePage] 플레이어 퇴장:', data.username, data.userId);
      setOtherPlayers((prev) => {
        const newPlayers = { ...prev };
        delete newPlayers[data.userId];
        return newPlayers;
      });
    };

    // 위치 업데이트 콜백
    const handlePositionUpdate = (data) => {
      // 자신의 위치 업데이트는 무시
      if (String(data.userId) === String(userId)) {
        return;
      }
      
      console.log('📍 [MapGamePage] 위치 업데이트 수신:', {
        userId: data.userId,
        username: data.username,
        position: [data.x, data.y, data.z],
        currentRoomId: data.currentRoomId
      });
      
      setOtherPlayers((prev) => ({
        ...prev,
        [data.userId]: {
          userId: data.userId,
          username: data.username,
          position: [data.x, data.y, data.z],
          rotationY: data.rotationY,
          animation: data.animation || 'idle',
          modelPath: data.modelPath || DEFAULT_CHARACTER_MODEL,
          isChangingAvatar: data.isChangingAvatar || false,
          currentRoomId: data.currentRoomId || null // 현재 있는 방 ID
        }
      }));
    };

    // 콜백 등록 및 cleanup 함수 저장
    const unsubJoin = multiplayerService.onPlayerJoin(handlePlayerJoin);
    const unsubLeave = multiplayerService.onPlayerLeave(handlePlayerLeave);
    const unsubPosition = multiplayerService.onPositionUpdate(handlePositionUpdate);

    // 방 업데이트 콜백
    const handleRoomUpdate = (data) => {
      console.log('🏠 방 업데이트 수신:', data);
      
      if (data.action === 'create' || data.action === 'existing') {
        // 자신이 만든 방인 경우 - 서버에서 반환된 roomId로 업데이트
        if (String(data.hostId) === String(userId)) {
          console.log('✅ 자신의 방 - 서버 응답으로 업데이트:', data);
          
          // currentPersonalRoom의 roomId를 서버 응답의 roomId로 업데이트
          setCurrentPersonalRoom(prev => {
            if (prev) {
              const oldRoomId = prev.roomId;
              const updated = {
                ...prev,
                roomId: data.roomId, // 서버에서 반환된 실제 roomId 사용
                roomName: data.roomName,
              };
              console.log('🔄 currentPersonalRoom 업데이트:', oldRoomId, '->', data.roomId);
              
              // nearbyRooms에서도 roomId 업데이트
              if (oldRoomId !== data.roomId) {
                setNearbyRooms(prevRooms => 
                  prevRooms.map(r => 
                    r.roomId === oldRoomId 
                      ? { ...r, roomId: data.roomId, roomName: data.roomName }
                      : r
                  )
                );
              }
              
              return updated;
            }
            return prev;
          });
          
          return; // 자신의 방은 이미 nearbyRooms에 추가했으므로 더 이상 처리 안함
        }
        
        // 다른 플레이어가 만든 방 추가
        const newRoom = {
          roomId: data.roomId,
          roomName: data.roomName,
          hostId: data.hostId,
          hostName: data.hostName,
          maxMembers: data.maxMembers || 10,
          isPrivate: data.isPrivate || false,
          gpsLng: data.gpsLng,
          gpsLat: data.gpsLat,
          gameName: data.gameName || '개인 룸',
          members: data.members || 1
        };
        
        setNearbyRooms(prev => {
          // hostId로 중복 체크 (한 유저당 하나의 방만 허용)
          const existingByHost = prev.find(r => String(r.hostId) === String(newRoom.hostId));
          if (existingByHost) {
            console.log('⚠️ 동일 호스트의 방이 이미 존재 - 업데이트:', existingByHost.roomId, '->', newRoom.roomId);
            return prev.map(r => 
              String(r.hostId) === String(newRoom.hostId) ? newRoom : r
            );
          }
          // roomId로 중복 체크
          if (prev.some(r => r.roomId === newRoom.roomId)) {
            console.log('이미 존재하는 방 - 무시');
            return prev;
          }
          console.log('✅ 새로운 방 추가:', newRoom);
          return [...prev, newRoom];
        });
        
      } else if (data.action === 'delete') {
        // 방 삭제
        setNearbyRooms(prev => {
          const filtered = prev.filter(r => r.roomId !== data.roomId);
          if (filtered.length < prev.length) {
            console.log('✅ 방 삭제:', data.roomId);
          }
          return filtered;
        });
      }
    };
    
    const unsubRoom = multiplayerService.onRoomUpdate(handleRoomUpdate);

    // 연결 처리
    if (!multiplayerService.connected || !multiplayerService.client?.connected) {
      // 아직 연결되지 않았으면 새로 연결
      if (isLoggedIn && userId && username) {
        console.log('🔗 [MapGamePage] 플레이어로 새 연결:', { userId, username });
        multiplayerService.connect(userId, username);
      } else {
        console.log('👀 [MapGamePage] 관찰자로 새 연결');
        const observerId = 'observer_' + Date.now();
        multiplayerService.connect(observerId, '게스트', true);
      }
    } else {
      // 이미 연결되어 있으면 입장 메시지만 다시 보냄 (다른 플레이어들에게 알림)
      console.log('✅ [MapGamePage] 멀티플레이어 이미 연결됨 - 입장 재전송');
      if (isLoggedIn && userId && username && !multiplayerService.isObserver) {
        // 잠시 후 join 메시지 재전송 (콜백 등록 완료 후)
        setTimeout(() => {
          multiplayerService.sendPlayerJoin();
          console.log('📢 [MapGamePage] 입장 메시지 재전송 완료');
        }, 500);
      }
    }

    return () => {
      console.log('🔌 MapGamePageNew: 멀티플레이어 콜백 해제');
      // 콜백 해제
      unsubJoin?.();
      unsubLeave?.();
      unsubPosition?.();
      unsubRoom?.();
      // 연결 해제는 하지 않음 (메인에서 관리)
    };
  }, [isLoggedIn, userId, username]);

  // GPS 위치 요청
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([longitude, latitude]);
          console.log('📍 GPS 위치:', { latitude, longitude });
        },
        (error) => {
          console.warn('⚠️ GPS 접근 실패:', error.message);
          setLocationError(error.message);
          // 기본값으로 설정
          setUserLocation([127.0276, 37.4979]);
        }
      );
    } else {
      setLocationError('Geolocation을 지원하지 않습니다');
      setUserLocation([127.0276, 37.4979]);
    }
  }, []);

  // 초기 방 목록 로드 (서버에서 활성 방 목록 가져오기)
  useEffect(() => {
    const loadInitialRooms = async () => {
      if (!userLocation) return;
      
      try {
        console.log('🏠 초기 방 목록 로드 시작...');
        // 서버에서 모든 활성 방 목록 가져오기
        const rooms = await multiplayerService.fetchRoomList();
        
        if (rooms && rooms.length > 0) {
          console.log('✅ 초기 방 목록 로드 완료:', rooms.length, '개');
          // 자신이 만든 방은 제외 (이미 로컬에 있을 수 있음)
          const filteredRooms = rooms.filter(room => String(room.hostId) !== String(userId));
          setNearbyRooms(prev => {
            // 기존 방의 hostId와 roomId 셋 생성
            const existingHostIds = new Set(prev.map(r => String(r.hostId)));
            const existingRoomIds = new Set(prev.map(r => r.roomId));
            
            // 중복되지 않는 새 방만 필터링 (hostId 기준 - 한 유저당 하나의 방)
            const newRooms = filteredRooms.filter(r => 
              !existingHostIds.has(String(r.hostId)) && !existingRoomIds.has(r.roomId)
            );
            
            if (newRooms.length > 0) {
              console.log('➕ 새로운 방 추가:', newRooms.length, '개');
              return [...prev, ...newRooms];
            }
            return prev;
          });
        } else {
          console.log('ℹ️ 활성 방 없음');
        }
      } catch (error) {
        console.error('❌ 초기 방 목록 로드 실패:', error);
      }
    };
    
    loadInitialRooms();
  }, [userLocation, userId]);

  // Mapbox 초기화
  useEffect(() => {
    const initializeMap = async () => {
      try {
        if (!mapContainerRef.current) {
          throw new Error('Map container not found');
        }

        console.log('🗺️ 지도 초기화 시작...');

        const mapCenter = userLocation || [127.0276, 37.4979];

        // Mapbox 초기화
        const mapboxManager = new MapboxManager({
          accessToken: mapboxToken,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: mapCenter,
          zoom: 20.2,
          pitch: 60,
          bearing: 0
        });

        // Promise 기반으로 초기화 완료 대기
        await mapboxManager.initialize(mapContainerRef.current);
        mapboxManagerRef.current = mapboxManager;

        const map = mapboxManager.getMap();

        // 3D 레이어 추가 함수
        const add3DLayers = () => {
          console.log('🏗️ 3D 레이어 추가 시작...');
          
          // 3D 건물 추가
          const layers = map.getStyle().layers;
          const labelLayerId = layers.find(
            (layer) => layer.type === 'symbol' && layer.layout['text-field']
          )?.id;

          // 이미 레이어가 있으면 추가하지 않음
          if (!map.getLayer('3d-buildings')) {
            map.addLayer(
              {
                id: '3d-buildings',
                source: 'composite',
                'source-layer': 'building',
                filter: ['==', 'extrude', 'true'],
                type: 'fill-extrusion',
                minzoom: 15,
                paint: {
                  'fill-extrusion-color': '#aaa',
                  'fill-extrusion-height': [
                    'interpolate', ['linear'], ['zoom'],
                    15, 0,
                    15.05, ['get', 'height']
                  ],
                  'fill-extrusion-base': [
                    'interpolate', ['linear'], ['zoom'],
                    15, 0,
                    15.05, ['get', 'min_height']
                  ],
                  'fill-extrusion-opacity': 0.6
                }
              },
              labelLayerId
            );
            console.log('✅ 3D 건물 레이어 추가 완료');
          }

          // 캐릭터 마커 생성 (Three.js CustomLayer 대신 SVG/CSS 마커 사용)
          if (!window.characterMarker) {
            const markerElement = document.createElement('div');
            markerElement.className = 'character-marker-3d';
            markerElement.innerHTML = `
              <div style="
                width: 60px;
                height: 80px;
                display: flex;
                flex-direction: column;
                align-items: center;
                transform: translateY(-40px);
              ">
                <div style="
                  width: 50px;
                  height: 50px;
                  background: linear-gradient(180deg, #4a90d9 0%, #357abd 100%);
                  border-radius: 50%;
                  border: 3px solid #fff;
                  box-shadow: 0 4px 15px rgba(0,0,0,0.4), 0 0 20px rgba(74,144,217,0.5);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 24px;
                ">
                  🧑
                </div>
                <div style="
                  width: 0;
                  height: 0;
                  border-left: 10px solid transparent;
                  border-right: 10px solid transparent;
                  border-top: 15px solid #357abd;
                  margin-top: -2px;
                "></div>
                <div style="
                  width: 30px;
                  height: 8px;
                  background: radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%);
                  border-radius: 50%;
                  margin-top: 5px;
                "></div>
              </div>
            `;

            window.characterMarker = new mapboxgl.Marker({
              element: markerElement,
              anchor: 'bottom'
            })
              .setLngLat(mapCenter)
              .addTo(map);
            
            console.log('✅ 캐릭터 마커 생성 완료');
          }
        };

        // 지도가 이미 로드되었으면 바로 실행, 아니면 load 이벤트 대기
        if (map.loaded()) {
          add3DLayers();
        } else {
          map.on('load', add3DLayers);
        }

        console.log('✅ Mapbox 초기화 완료');
        setIsReady(true);
      } catch (err) {
        console.error('❌ 지도 초기화 실패:', err);
        setError(err.message || '지도를 초기화할 수 없습니다');
      }
    };

    if (mapboxToken && userLocation) {
      initializeMap();
    }

    return () => {
      if (mapboxManagerRef.current) {
        mapboxManagerRef.current.dispose();
      }
    };
  }, [mapboxToken, userLocation]);

  // 3D 캐릭터가 지도에 표시되므로 마커는 더 이상 필요 없음
  // 지도 중심 이동용으로만 사용
  useEffect(() => {
    if (!mapboxManagerRef.current || !isReady) return;

    // cleanup
    return () => {
      if (window.mapCharacter) {
        window.mapCharacter = null;
        window.mapMixer = null;
        window.mapActions = null;
      }
    };
  }, [isReady, userLocation]);

  const handleBack = () => {
    navigate(-1);
  };

  // 개인 룸 생성 버튼
  const handleCreateRoom = () => {
    console.log('🏠 개인 룸 생성 버튼 클릭');
    setPersonalRoomMode('create');
    setShowPersonalRoomModal(true);
  };

  // 공개 룸 찾기 버튼
  const handleBrowseRooms = () => {
    console.log('🔍 공개 룸 찾기 버튼 클릭');
    setPersonalRoomMode('browse');
    setShowPersonalRoomModal(true);
  };

  // 개인 룸 생성 처리
  const handlePersonalRoomCreate = useCallback((roomData) => {
    console.log('🏠 [MapGamePage] 개인 룸 생성 콜백 실행:', roomData);
    
    if (!roomData || !roomData.roomId) {
      console.error('❌ 잘못된 방 데이터:', roomData);
      return;
    }
    
    setCurrentPersonalRoom(roomData);
    
    // GPS 위치가 있으면 방 위치에 추가
    const roomWithLocation = {
      ...roomData,
      gpsLng: userLocation ? userLocation[0] : 127.0276,
      gpsLat: userLocation ? userLocation[1] : 37.4979,
      gameName: '개인 룸', // 포탈 색상용
    };
    
    // 주변 방 목록에 추가 (중복 체크)
    setNearbyRooms(prev => {
      // hostId로 중복 체크 (한 사용자는 하나의 방만 가질 수 있음)
      const existingByHost = prev.find(r => String(r.hostId) === String(roomWithLocation.hostId));
      if (existingByHost) {
        console.log('⚠️ 동일 호스트의 방이 이미 존재 - 기존 방 업데이트:', existingByHost.roomId, '->', roomWithLocation.roomId);
        return prev.map(r => 
          String(r.hostId) === String(roomWithLocation.hostId) 
            ? roomWithLocation 
            : r
        );
      }
      // roomId로 중복 체크
      if (prev.some(r => r.roomId === roomWithLocation.roomId)) {
        console.log('⚠️ 동일 roomId의 방이 이미 존재 - 무시:', roomWithLocation.roomId);
        return prev;
      }
      console.log('📍 주변 방 목록에 새 방 추가:', roomWithLocation.roomName);
      return [...prev, roomWithLocation];
    });
    
    // WebSocket으로 다른 플레이어들에게 방 생성 알림
    if (multiplayerService.connected && userId && username) {
      const broadcastData = {
        roomId: roomData.roomId,
        roomName: roomData.roomName,
        hostId: userId,
        hostName: username,
        maxMembers: roomData.maxMembers || 10,
        isPrivate: roomData.isPrivate || false,
        gpsLng: roomWithLocation.gpsLng,
        gpsLat: roomWithLocation.gpsLat,
        gameName: '개인 룸',
        members: 1
      };
      console.log('📢 방 생성 브로드캐스트 전송:', broadcastData);
      multiplayerService.sendRoomCreate(broadcastData);
      console.log('✅ 방 생성 브로드캐스트 완료');
    } else {
      console.warn('⚠️ WebSocket 연결 안됨 - 방 생성 브로드캐스트 실패');
    }
    
    // 모달을 닫지 않고 대기실(팝업)을 플레이어에게 보여줌
    // 사용자가 '입장하기'를 누르면 실제로 입장 처리함
    console.log('💡 개인 룸 생성: 팝업 대기 모드로 전환 (모달 유지)');
    setPersonalRoomMode('waiting');
    setShowPersonalRoomModal(true);
  }, [userLocation, userId, username]);

  // 친구 초대 처리
  const handleInviteFriend = useCallback((friend) => {
    console.log('📨 친구 초대:', friend);
    // TODO: WebSocket으로 친구에게 초대 메시지 전송
    // multiplayerService.sendInvite(friend.id, currentPersonalRoom);
  }, [currentPersonalRoom]);

  // 개인 룸 나가기 (방은 유지, 그냥 나가기)
  const handleLeavePersonalRoom = useCallback(() => {
    console.log('🚪 개인 룸 나가기 (방 유지)');
    setCurrentPersonalRoom(null);
    setIsInPersonalRoom(false); // 메인 맵으로 복귀
    setShowPersonalRoomModal(false);
  }, []);

  // 개인 룸 완전 삭제 (호스트만 가능)
  const handleDeleteRoom = useCallback(async (roomId) => {
    if (!roomId || !userId) return;
    
    console.log('🗑️ 개인 룸 삭제 시작:', roomId);
    
    try {
      // 서버에서 방 삭제
      const result = await multiplayerService.deleteRoom(roomId, userId);
      
      if (result.success) {
        console.log('✅ 방 삭제 성공');
        
        // 방 목록에서 제거
        setNearbyRooms(prev => prev.filter(r => r.roomId !== roomId));
        
        // WebSocket으로 다른 플레이어들에게 방 삭제 알림
        if (multiplayerService.connected) {
          multiplayerService.sendRoomDelete(roomId);
          console.log('📢 방 삭제 브로드캐스트 완료');
        }
        
        // 상태 정리
        setCurrentPersonalRoom(null);
        setIsInPersonalRoom(false);
        setShowPersonalRoomModal(false);
      } else {
        console.error('❌ 방 삭제 실패:', result.message);
        alert('방 삭제에 실패했습니다: ' + (result.message || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('❌ 방 삭제 중 오류:', error);
      alert('방 삭제 중 오류가 발생했습니다.');
    }
  }, [userId]);

  // 개인 룸 채팅 메시지 처리 (말풍선 표시)
  const handleRoomChatMessage = useCallback((chatData) => {
    console.log('💬 [MapGamePage] 채팅 메시지 수신:', chatData);
    
    if (String(chatData.userId) === String(userId)) {
      // 내 메시지 - 내 캐릭터 위에 말풍선 표시
      if (myMessageTimerRef.current) {
        clearTimeout(myMessageTimerRef.current);
      }
      
      setMyChatMessage(chatData.message);
      
      // 5초 후 말풍선 숨기기
      myMessageTimerRef.current = setTimeout(() => {
        setMyChatMessage('');
        myMessageTimerRef.current = null;
      }, 5000);
    } else {
      // 다른 플레이어 메시지
      if (playerMessageTimersRef.current[chatData.userId]) {
        clearTimeout(playerMessageTimersRef.current[chatData.userId]);
      }
      
      setPlayerChatMessages(prev => ({
        ...prev,
        [chatData.userId]: {
          message: chatData.message,
          timestamp: Date.now()
        }
      }));
      
      // 5초 후 말풍선 숨기기
      playerMessageTimersRef.current[chatData.userId] = setTimeout(() => {
        setPlayerChatMessages(prev => {
          const updated = { ...prev };
          delete updated[chatData.userId];
          return updated;
        });
        delete playerMessageTimersRef.current[chatData.userId];
      }, 5000);
    }
  }, [userId]);

  // 개인 룸에서 나가기 (3D 뷰에서)
  const handleExitPersonalRoom = useCallback(() => {
    console.log('🚪 개인 룸 3D에서 나가기 시작');
    console.log('현재 상태 - isInPersonalRoom:', isInPersonalRoom, 'currentPersonalRoom:', currentPersonalRoom);
    
    // 캐릭터 위치를 메인 맵 스폰 포인트로 리셋
    if (characterStateRef.current) {
      characterStateRef.current.position = [0, 0, 0];
      characterStateRef.current.rotationY = 0;
      characterStateRef.current.isMoving = false;
      console.log('📍 캐릭터 위치 리셋: [0, 0, 0]');
    }
    
    // 모달 상태 초기화
    setShowRoomPopup(false);
    setShowPersonalRoomModal(false);
    
    // 상태 업데이트
    setIsInPersonalRoom(false);
    
    console.log('🚪 setIsInPersonalRoom(false) 호출 완료');
    
    // 포커스를 document.body로 이동하여 키보드 이벤트가 정상 동작하도록 함
    setTimeout(() => {
      document.body.focus();
      console.log('📍 포커스를 document.body로 이동');
    }, 100);
    
    // 방 데이터는 유지 (나중에 다시 들어갈 수 있음)
  }, [isInPersonalRoom, currentPersonalRoom]);

  // 공개 룸 입장
  const handleJoinPublicRoom = useCallback((room) => {
    console.log('🚪 공개 룸 입장:', room);
    setCurrentPersonalRoom(room);
    setShowPersonalRoomModal(false);
    setShowRoomPopup(false);
    setIsInPersonalRoom(true); // 개인 룸 3D 뷰로 전환
    // TODO: 서버에 입장 알림
  }, []);

  // 포탈 근접 체크 (CharacterViewer에서 호출)
  const handlePortalProximity = useCallback((room, isNear) => {
    if (isNear && !showRoomPopup) {
      setSelectedRoom(room);
      setShowRoomPopup(true);
    } else if (!isNear && selectedRoom?.roomId === room.roomId) {
      setShowRoomPopup(false);
      setSelectedRoom(null);
    }
  }, [showRoomPopup, selectedRoom]);

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100vh',
        background: '#1a1a1a',
        color: '#ff6b6b',
        fontFamily: 'monospace',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div>⚠️ 오류</div>
        <div style={{ fontSize: '12px', color: '#aaa' }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="map-game-split-container">
      {/* 좌측: Three.js 캐릭터 또는 개인 룸 3D */}
      <div className={`map-game-left ${isInPersonalRoom ? 'full-width' : ''}`}>
        <Canvas
          camera={{
            position: isInPersonalRoom ? [0, 8, 15] : [0, 38, 45],
            fov: 60,
            near: 0.1,
            far: 10000
          }}
          style={{ width: '100%', height: '100%' }}
          gl={{ antialias: true, alpha: false }}
        >
          {isInPersonalRoom ? (
            /* 개인 룸 3D 뷰 */
            <>
              <PersonalRoom3D 
                ref={personalRoom3DRef}
                roomData={currentPersonalRoom}
                onExit={handleExitPersonalRoom}
                characterStateRef={characterStateRef}
                userId={userId}
                onDeleteRoom={handleDeleteRoom}
                onFurnitureUpdate={(furnitureData) => {
                  // 가구 업데이트 동기화
                  console.log('Furniture updated:', furnitureData);
                }}
              />
              
              {/* 내 캐릭터 (개인 룸 내부) */}
              <CharacterViewer 
                characterStateRef={characterStateRef} 
                userId={userId}
                username={username}
                modelPath={characterModelPath}
                nearbyRooms={[]}
                userLocation={userLocation}
                onPortalEnter={() => {}}
                isModalOpen={false}
                isInPersonalRoom={true}
                onExitRoom={handleExitPersonalRoom}
                currentPersonalRoom={currentPersonalRoom}
                chatMessage={myChatMessage}
              />
              
              {/* 같은 방에 있는 다른 플레이어들 */}
              {Object.values(otherPlayers)
                .filter(player => player.currentRoomId === currentPersonalRoom?.roomId)
                .map((player) => (
                  <OtherPlayer
                    key={player.userId}
                    userId={player.userId}
                    username={player.username}
                    position={player.position}
                    rotationY={player.rotationY}
                    animation={player.animation}
                    modelPath={player.modelPath}
                    isChangingAvatar={player.isChangingAvatar}
                    chatMessage={playerChatMessages[player.userId]?.message}
                    scale={0.8}
                  />
                ))}
              
              {/* 카메라 제어 (개인 룸용) */}
              <PersonalRoomCamera characterStateRef={characterStateRef} />
            </>
          ) : (
            /* 메인 맵 뷰 */
            <>
              {/* 시간 기반 동적 하늘 */}
              <DynamicSky />
          
          {/* 동적 조명 (시간 기반) */}
          <DynamicLighting />
          
          {/* 가상 풀숲 바닥 + 건물 + 도로 */}
          <VirtualEnvironment 
            buildingsData={buildingsData} 
            roadsData={roadsData}
            userLocation={userLocation}
          />

          {/* 주변 방 포탈들 */}
          {nearbyRooms.map((room) => (
            <RoomPortal
              key={room.roomId}
              room={room}
              userLocation={userLocation}
              characterStateRef={characterStateRef}
              onProximity={handlePortalProximity}
              onEnter={() => handleJoinPublicRoom(room)}
            />
          ))}

          {/* 내 캐릭터 */}
          <CharacterViewer 
            characterStateRef={characterStateRef} 
            userId={userId}
            username={username}
            modelPath={characterModelPath}
            nearbyRooms={nearbyRooms}
            userLocation={userLocation}
            onPortalEnter={handleJoinPublicRoom}
            isModalOpen={showPersonalRoomModal || showRoomPopup}
          />
          
          {/* 다른 플레이어들 (메인 맵에 있는 플레이어만) */}
          {(() => {
            const playersOnMap = Object.values(otherPlayers).filter(player => !player.currentRoomId);
            console.log('👥 [MapGamePage] 메인 맵 플레이어 렌더링:', {
              total: Object.keys(otherPlayers).length,
              onMap: playersOnMap.length,
              players: playersOnMap.map(p => ({ id: p.userId, name: p.username, roomId: p.currentRoomId }))
            });
            return playersOnMap.map((player) => (
              <OtherPlayer
                key={player.userId}
                userId={player.userId}
                username={player.username}
                position={player.position}
                rotationY={player.rotationY}
                animation={player.animation}
                modelPath={player.modelPath}
                isChangingAvatar={player.isChangingAvatar}
                scale={2}
              />
            ));
          })()}
          
          {/* 카메라 제어 */}
          <CameraTracker characterStateRef={characterStateRef} />
          
          {/* 지도 마커 업데이트 (실시간) */}
          <MarkerUpdater characterStateRef={characterStateRef} mapboxManagerRef={mapboxManagerRef} userLocation={userLocation} isReady={isReady} />
            </>
          )}
        </Canvas>

        {/* 개인 룸 채팅만 표시 (개인 룸 모드일 때만) */}
        {isInPersonalRoom && currentPersonalRoom?.roomId && (
          <PersonalRoomChat 
            roomId={currentPersonalRoom.roomId} 
            userProfile={userInfo}
            onChatMessage={handleRoomChatMessage}
          />
        )}

        {/* 미니맵 오버레이 (메인 맵일 때만) */}
        {!isInPersonalRoom && (
          <Minimap 
            userLocation={userLocation}
            characterStateRef={characterStateRef}
            nearbyRooms={nearbyRooms}
            otherPlayers={otherPlayers}
          />
        )}
        
        {/* 시간대 표시 */}
        <TimeIndicator isInPersonalRoom={isInPersonalRoom} />
        
        {!isReady && (
          <div className="map-game-loading-overlay">
            🎮 로딩 중...
          </div>
        )}
      </div>

      {/* 우측: Mapbox 지도 (개인 룸이 아닐 때만 표시) */}
      {!isInPersonalRoom && (
        <div className="map-game-right">
          <div
            ref={mapContainerRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%'
            }}
          />
          
          {!isReady && (
            <div className="map-game-loading-overlay">
              🗺️ 지도 로딩 중...
            </div>
          )}
        </div>
      )}

      {/* 좌측 하단: 뒤로가기 버튼 (개인 룸이 아닐 때만) */}
      {isReady && !isInPersonalRoom && (
        <div className="game-back-button-container">
          <button className="game-back-button" onClick={handleBack}>
            ← 뒤로가기
          </button>
        </div>
      )}

      {/* 개인 룸 전용 좌측 하단 뒤로가기 버튼 */}
      {isReady && isInPersonalRoom && (
        <div className="personal-room-back-button-container">
          <button className="personal-room-back-button" onClick={handleExitPersonalRoom}>
            ← 방 나가기
          </button>
        </div>
      )}

      {/* 개인 룸 전용 우측 상단 가구 관리 UI */}
      {isReady && isInPersonalRoom && (
        <PersonalRoomFurnitureUI 
          roomRef={personalRoom3DRef}
          FURNITURE_TYPES={FURNITURE_TYPES}
        />
      )}

      {/* 방 정보 팝업 */}
      {showRoomPopup && selectedRoom && (
        <RoomInfoPopup 
          room={selectedRoom}
          onJoin={() => handleJoinPublicRoom(selectedRoom)}
          onClose={() => {
            setShowRoomPopup(false);
            setSelectedRoom(null);
          }}
        />
      )}

      {/* 개인 룸 모달 */}
      {showPersonalRoomModal && (
        <PersonalRoomModal
          onClose={() => setShowPersonalRoomModal(false)}
          userProfile={userInfo}
          friends={friendsList}
          mode={personalRoomMode}
          currentRoom={currentPersonalRoom}
          onCreateRoom={handlePersonalRoomCreate}
          onInviteFriend={handleInviteFriend}
          onLeaveRoom={handleLeavePersonalRoom}
          onJoinRoom={handleJoinPublicRoom}
        />
      )}

      {/* 좌측 방 목록 패널 (개인 룸이 아닐 때만) */}
      {!isInPersonalRoom && (
        <RoomListPanel 
          rooms={nearbyRooms}
          onRoomSelect={(room) => {
            setSelectedRoom(room);
            setShowRoomPopup(true);
          }}
          selectedRoomId={selectedRoom?.roomId}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinPublicRoom}
          userId={userId}
        />
      )}
    </div>
  );
}

/**
 * 캐릭터 뷰어 컴포넌트
 * MapCharacterController와 동일한 이동 로직 사용
 * + 위치 브로드캐스트 기능 추가
 */
function CharacterViewer({ 
  characterStateRef, 
  userId, 
  username, 
  modelPath = DEFAULT_CHARACTER_MODEL, 
  isModalOpen = false,
  isInPersonalRoom = false,
  onExitRoom,
  currentPersonalRoom,
  chatMessage
}) {
  const characterRef = useRef(null);
  const groupRef = useRef(null);
  const modelGroupRef = useRef(null);
  const [currentAnimation, setCurrentAnimation] = useState('Idle');
  const currentRotationRef = useRef(new THREE.Quaternion());
  const lastRotationYRef = useRef(0);
  const lastBroadcastTimeRef = useRef(0);
  const BROADCAST_INTERVAL = 100; // 100ms마다 위치 전송
  
  // 개인 룸 출구 거리 체크
  const EXIT_PORTAL_POSITION = [0, 0, -9];
  const EXIT_DISTANCE = 3;
  
  // MapCharacterController와 동일하게 useKeyboardControls 사용
  const { forward, backward, left, right, shift } = useKeyboardControls();
  
  // GLTF 로드 (사용자의 캐릭터 모델 사용)
  const { scene, animations } = useGLTF(modelPath);
  const { actions } = useAnimations(animations, characterRef);

  // modelPath 변경 감지
  useEffect(() => {
    console.log('🟣 [MapCharacterViewer] modelPath 변경:', modelPath);
  }, [modelPath]);

  // 애니메이션 상태 관리
  useEffect(() => {
    let animToPlay = 'Idle';
    if (forward || backward || left || right) {
      animToPlay = shift ? 'Run' : 'Walk';
    } else {
      animToPlay = 'Idle';
    }

    if (currentAnimation !== animToPlay && actions) {
      const oldAction = actions[currentAnimation];
      const newAction = actions[animToPlay];

      if (oldAction) oldAction.fadeOut(0.5);
      if (newAction) {
        newAction.reset().fadeIn(0.5).play();
      }

      setCurrentAnimation(animToPlay);
    }
  }, [forward, backward, left, right, shift, actions, currentAnimation]);

  // 모델 초기화
  useEffect(() => {
    if (characterRef.current) {
      characterRef.current.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }

    if (modelGroupRef.current) {
      characterRef.current = modelGroupRef.current;
      console.log('📍 MapCharacterController 초기화 완료 - 캐릭터 참조 설정');
    }
  }, []);

  // 개인 룸 모드 변경 시 캐릭터 위치 리셋
  useEffect(() => {
    if (!isInPersonalRoom && modelGroupRef.current) {
      // 개인 룸에서 나왔을 때 메인 맵 스폰 위치로 리셋
      const spawnPos = characterStateRef.current?.position || [0, 0, 0];
      modelGroupRef.current.position.set(spawnPos[0], spawnPos[1], spawnPos[2]);
      console.log('📍 개인 룸 나가기 - 캐릭터 위치 리셋:', spawnPos);
    }
  }, [isInPersonalRoom]);

  // 프레임 업데이트 - MapCharacterController와 동일한 로직
  useFrame((state, delta) => {
    if (!modelGroupRef.current) {
      return;
    }

    // 모달이 열려있으면 이동 비활성화
    if (isModalOpen) {
      characterStateRef.current.isMoving = false;
      return;
    }

    // 개인 룸에서는 이동 속도를 줄임 (보행: 5, 뛰기: 10)
    const speed = isInPersonalRoom ? (shift ? 10 : 5) : (shift ? 20 : 10);
    const direction = new THREE.Vector3();

    if (forward) direction.z -= 1;
    if (backward) direction.z += 1;
    if (left) direction.x -= 1;
    if (right) direction.x += 1;

    const isMoving = direction.length() > 0;
    let targetAngleForNetwork = null;

    if (direction.length() > 0) {
      direction.normalize(); // 정규화 - MapCharacterController와 동일

      // 회전 처리 - slerp를 사용한 부드러운 회전
      const targetAngle = Math.atan2(direction.x, direction.z);
      targetAngleForNetwork = targetAngle;

      const targetQuaternion = new THREE.Quaternion();
      targetQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngle);
      currentRotationRef.current.slerp(targetQuaternion, 0.25);

      // 위치 업데이트 (delta 기반)
      modelGroupRef.current.position.x += direction.x * speed * delta;
      modelGroupRef.current.position.z += direction.z * speed * delta;

      lastRotationYRef.current = targetAngle;
    }

    // 개인 룸 경계 체크 (개인 룸 모드일 때만)
    if (isInPersonalRoom) {
      // 벽 경계 제한 (-19 ~ 19)
      const ROOM_BOUNDS = 18;
      modelGroupRef.current.position.x = Math.max(-ROOM_BOUNDS, Math.min(ROOM_BOUNDS, modelGroupRef.current.position.x));
      modelGroupRef.current.position.z = Math.max(-ROOM_BOUNDS, Math.min(ROOM_BOUNDS, modelGroupRef.current.position.z));
      
      // 출구 포탈 근처에서 F키 체크
      const distToExit = Math.sqrt(
        Math.pow(modelGroupRef.current.position.x - EXIT_PORTAL_POSITION[0], 2) +
        Math.pow(modelGroupRef.current.position.z - EXIT_PORTAL_POSITION[2], 2)
      );
      
      if (distToExit < EXIT_DISTANCE) {
        // F키 체크는 별도 이벤트로 처리 (useEffect에서)
        characterStateRef.current.nearExit = true;
      } else {
        characterStateRef.current.nearExit = false;
      }
    }

    // 모델 회전 적용
    modelGroupRef.current.quaternion.copy(currentRotationRef.current);

    // 상태 공유 (isMoving 포함)
    const currentPos = [
      modelGroupRef.current.position.x,
      modelGroupRef.current.position.y,
      modelGroupRef.current.position.z
    ];
    characterStateRef.current.position = currentPos;
    characterStateRef.current.rotation = lastRotationYRef.current;
    characterStateRef.current.isMoving = isMoving;
    characterStateRef.current.animation = currentAnimation.toLowerCase();

    // 위치 브로드캐스트 (100ms마다) - 메인 맵과 개인 룸 모두 전송
    const now = Date.now();
    if (now - lastBroadcastTimeRef.current > BROADCAST_INTERVAL) {
      lastBroadcastTimeRef.current = now;
      
      // 멀티플레이어 서비스를 통해 위치 전송 (사용자의 캐릭터 모델 경로 사용)
      // 연결 상태 체크 - connected만 확인 (client.connected는 간헐적으로 false일 수 있음)
      if (multiplayerService.connected && userId && username) {
        try {
          // 현재 방 ID 전달 (개인 룸에 있으면 roomId, 아니면 null)
          const roomId = isInPersonalRoom && currentPersonalRoom ? currentPersonalRoom.roomId : null;
          multiplayerService.sendPositionUpdate(
            currentPos,
            lastRotationYRef.current,
            currentAnimation.toLowerCase(),
            modelPath,
            false,
            roomId
          );
        } catch (error) {
          // STOMP 연결 오류 발생 시 로그만 남김 (재연결 시 자동 복구)
          if (error.message && !error.message.includes('Cannot read')) {
            console.warn('Position broadcast failed:', error.message);
          }
        }
      }
    }
  });

  // F키로 출구 나가기 (개인 룸 모드일 때만)
  useEffect(() => {
    if (!isInPersonalRoom) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'f' || e.key === 'F') {
        if (characterStateRef.current?.nearExit && onExitRoom) {
          console.log('🚪 F키로 개인 룸 나가기');
          onExitRoom();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInPersonalRoom, onExitRoom, characterStateRef]);

  return (
    <group ref={modelGroupRef} position={[0, 0, 0]}>
      <primitive
        ref={characterRef}
        object={scene}
        scale={isInPersonalRoom ? 0.8 : 2}  // 개인 룸: 0.8배, 메인 맵: 2배
        position={[0, 0, 0]}
      />
      
      {/* 개인 룸에서 닉네임 표시 */}
      {isInPersonalRoom && username && (
        <Billboard position={[0, isInPersonalRoom ? 3 : 7, 0]} follow={true} lockX={false} lockY={false} lockZ={false}>
          <Text
            fontSize={isInPersonalRoom ? 0.3 : 0.6}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.05}
            outlineColor="black"
            outlineOpacity={1}
            fontWeight="bold"
          >
            {username}
          </Text>
        </Billboard>
      )}
      
      {/* 채팅 말풍선 (개인 룸에서) */}
      {isInPersonalRoom && chatMessage && (
        <ChatBubble message={chatMessage} position={[0, isInPersonalRoom ? 3.5 : 8.5, 0]} duration={5000} />
      )}
    </group>
  );
}

/**
 * 개인 룸 가구 관리 UI (우측 상단 고정)
 */
function PersonalRoomFurnitureUI({ roomRef, FURNITURE_TYPES }) {
  const [, forceUpdate] = useState(0);
  
  // ref 상태 동기화를 위한 폴링
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate(n => n + 1);
    }, 100);
    return () => clearInterval(interval);
  }, []);
  
  if (!roomRef?.current) return null;
  
  const {
    furniture = [],
    editMode,
    selectedFurniture,
    showToolbar,
    showInventory,
    showFurnitureList,
    showDeleteConfirm,
    isHost,
    setEditMode,
    setSelectedFurniture,
    setShowToolbar,
    setShowInventory,
    setShowFurnitureList,
    setShowDeleteConfirm,
    handleAddFurniture,
    handleRotateFurniture,
    handleDeleteFurniture,
    handleDeleteRoom,
  } = roomRef.current;

  return (
    <>
      {/* 우측 상단 꾸미기 버튼 컨테이너 */}
      <div className="personal-room-furniture-ui-container">
        {/* 메인 꾸미기 버튼 */}
        <button
          className="personal-room-furniture-button"
          onClick={() => setShowToolbar(!showToolbar)}
        >
          {showToolbar ? '✕ 닫기' : '🎨 방 꾸미기'}
        </button>
        
        {/* 툴바 */}
        {showToolbar && (
          <div className="personal-room-furniture-toolbar">
            {/* 설치된 가구 목록 버튼 */}
            <button
              className={`furniture-toolbar-btn ${showFurnitureList ? 'active' : ''}`}
              onClick={() => {
                setShowFurnitureList(!showFurnitureList);
                setShowInventory(false);
              }}
            >
              📦 설치된 가구 ({furniture.length})
            </button>
            
            {/* 새 가구 추가 버튼 */}
            <button
              className={`furniture-toolbar-btn ${showInventory ? 'active-blue' : ''}`}
              onClick={() => {
                setShowInventory(!showInventory);
                setShowFurnitureList(false);
              }}
            >
              ➕ 새 가구 추가
            </button>
            
            {/* 방 삭제 버튼 (호스트만) */}
            {isHost && (
              <button
                className="furniture-toolbar-btn delete-btn"
                onClick={() => setShowDeleteConfirm(true)}
              >
                🗑️ 방 삭제
              </button>
            )}
          </div>
        )}
        
        {/* 설치된 가구 목록 패널 */}
        {showFurnitureList && showToolbar && (
          <div className="personal-room-furniture-list">
            <div className="furniture-list-header">
              <h4>📦 설치된 가구</h4>
              <span>{furniture.length}개</span>
            </div>
            
            {furniture.length === 0 ? (
              <div className="furniture-list-empty">
                설치된 가구가 없습니다
              </div>
            ) : (
              <div className="furniture-list-items">
                {furniture.map((item) => (
                  <div
                    key={item.id}
                    className={`furniture-list-item ${selectedFurniture === item.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedFurniture(item.id);
                      setEditMode(true);
                    }}
                  >
                    <div className="furniture-item-info">
                      <span className="furniture-icon">{FURNITURE_TYPES[item.type]?.icon}</span>
                      <div className="furniture-details">
                        <span className="furniture-name">{FURNITURE_TYPES[item.type]?.name}</span>
                        <span className="furniture-position">
                          위치: ({item.position[0].toFixed(1)}, {item.position[2].toFixed(1)})
                        </span>
                      </div>
                    </div>
                    
                    {selectedFurniture === item.id && (
                      <div className="furniture-item-actions">
                        <button
                          className="furniture-action-btn rotate"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRotateFurniture(item.id, 1);
                          }}
                        >
                          🔄 회전
                        </button>
                        <button
                          className="furniture-action-btn delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFurniture(item.id);
                          }}
                        >
                          🗑️ 삭제
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 가구 인벤토리 모달 */}
      {showInventory && (
        <FurnitureInventory 
          onSelect={handleAddFurniture}
          onClose={() => setShowInventory(false)}
        />
      )}
      
      {/* 방 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="personal-room-delete-modal-overlay">
          <div className="personal-room-delete-modal">
            <div className="delete-modal-icon">⚠️</div>
            <h3>정말 방을 삭제하시겠습니까?</h3>
            <p>
              방을 삭제하면 배치한 모든 가구와 설정이 영구적으로 삭제됩니다.<br/>
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="delete-modal-buttons">
              <button
                className="delete-modal-btn cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                취소
              </button>
              <button
                className="delete-modal-btn confirm"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  handleDeleteRoom?.();
                }}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MapGamePageNew;

/**
 * 개인 룸 카메라 컨트롤러
 * 더 가까운 시점으로 캐릭터를 따라감
 * 벽 충돌 감지로 방 밖이 보이지 않도록 처리
 */
function PersonalRoomCamera({ characterStateRef }) {
  const { camera, raycaster } = useThree();
  const cameraOffset = new THREE.Vector3(0, 10, 12); // 개인 룸용 카메라 오프셋 (위에서 보는 시점)
  const targetPositionRef = useRef(new THREE.Vector3());

  // 방 경계
  const ROOM_BOUNDS = {
    minX: -19.5,
    maxX: 19.5,
    minZ: -19.5,
    maxZ: 19.5,
    minY: 1,
    maxY: 40,
  };

  /**
   * 카메라 위치를 방 경계 내로 제한
   */
  const clampCameraToRoom = (position) => {
    return new THREE.Vector3(
      Math.max(ROOM_BOUNDS.minX, Math.min(ROOM_BOUNDS.maxX, position.x)),
      Math.max(ROOM_BOUNDS.minY, Math.min(ROOM_BOUNDS.maxY, position.y)),
      Math.max(ROOM_BOUNDS.minZ, Math.min(ROOM_BOUNDS.maxZ, position.z))
    );
  };

  /**
   * 카메라가 벽에 가까운지 확인하고 필요시 줌인
   */
  const checkWallCollision = (characterPos, cameraPos) => {
    const margin = 3; // 벽으로부터의 안전 거리
    const isNearWall = 
      cameraPos.x < ROOM_BOUNDS.minX + margin ||
      cameraPos.x > ROOM_BOUNDS.maxX - margin ||
      cameraPos.z < ROOM_BOUNDS.minZ + margin ||
      cameraPos.z > ROOM_BOUNDS.maxZ - margin;

    if (isNearWall) {
      const distance = characterPos.distanceTo(cameraPos);
      const safeDistance = distance * 0.6; // 원래 거리의 60%로 줌인
      return { hasCollision: true, distance: safeDistance };
    }

    return { hasCollision: false, distance: 0 };
  };

  useFrame((state, delta) => {
    if (!characterStateRef.current) return;

    // 캐릭터 위치 가져오기
    const [charX, charY, charZ] = characterStateRef.current.position;
    const characterPosition = new THREE.Vector3(charX, charY, charZ);

    // 타겟 위치를 부드럽게 보간 (메인 맵과 동일)
    targetPositionRef.current.lerp(characterPosition, delta * 10.0);

    // 타겟 위치에 오프셋을 더해서 카메라 위치 계산
    let targetCameraPosition = targetPositionRef.current.clone().add(cameraOffset);

    // 벽 충돌 감지 및 카메라 조정
    const collision = checkWallCollision(targetPositionRef.current, targetCameraPosition);
    
    if (collision.hasCollision) {
      // 벽이 감지되면 카메라를 캐릭터 쪽으로 이동 (줌인)
      const direction = new THREE.Vector3()
        .subVectors(targetCameraPosition, targetPositionRef.current)
        .normalize();
      targetCameraPosition = targetPositionRef.current.clone()
        .add(direction.multiplyScalar(collision.distance));
    }

    // 카메라 위치를 방 경계 내로 제한
    targetCameraPosition = clampCameraToRoom(targetCameraPosition);

    // 부드러운 카메라 이동
    camera.position.lerp(targetCameraPosition, delta * 5.0);

    // 캐릭터를 바라봄
    camera.lookAt(targetPositionRef.current.x, targetPositionRef.current.y + 1.5, targetPositionRef.current.z);
  });

  return null;
}

/**
 * 카메라 추적 컴포넌트
 * CameraController와 동일한 로직으로 캐릭터를 따라감
 */
function CameraTracker({ characterStateRef }) {
  const { camera } = useThree();
  const cameraOffset = new THREE.Vector3(-0.00, 25, 30); // 고정된 카메라 오프셋 (위에서 보는 시점)
  const targetPositionRef = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    if (!characterStateRef.current) return;

    // 캐릭터 위치 가져오기
    const [charX, charY, charZ] = characterStateRef.current.position;
    const characterPosition = new THREE.Vector3(charX, charY, charZ);

    // 타겟 위치를 부드럽게 보간 (떨림 방지)
    targetPositionRef.current.lerp(characterPosition, delta * 10.0);

    // 타겟 위치에 고정된 오프셋을 더해서 카메라 위치 계산
    const targetCameraPosition = targetPositionRef.current.clone().add(cameraOffset);

    // 부드러운 카메라 이동 (메인맵과 동일한 속도)
    camera.position.lerp(targetCameraPosition, delta * 5.0);

    // 고정된 각도 유지 (lookAt 제거 - 메인맵과 동일)
    // camera.lookAt(targetPositionRef.current);
  });

  return null;
}

/**
 * 지도 마커 업데이트 컴포넌트
 * useFrame으로 실시간 마커 위치 업데이트 (WASD 입력과 동기화)
 */
function MarkerUpdater({ characterStateRef, mapboxManagerRef, userLocation, isReady }) {
  useFrame(() => {
    if (!mapboxManagerRef.current || !isReady || !userLocation) return;

    const map = mapboxManagerRef.current.getMap();
    if (!map || !characterStateRef.current) return;

    const [charX, charY, charZ] = characterStateRef.current.position;

    // 3D 좌표를 지도상의 GPS 좌표로 변환
    const SCALE = 100000;
    const characterLng = userLocation[0] + (charX / SCALE);
    const characterLat = userLocation[1] - (charZ / SCALE);

    // 캐릭터 마커 위치 업데이트
    if (window.characterMarker) {
      window.characterMarker.setLngLat([characterLng, characterLat]);
    }

    // 지도 중심을 캐릭터 위치로 이동
    map.setCenter([characterLng, characterLat]);
  });

  return null;
}

/**
 * 시간 기반 동적 하늘 컴포넌트
 * 실제 시간에 따라 하늘 색상 변경 (낮/밤/노을)
 */
function DynamicSky() {
  const meshRef = useRef();
  const [skyColors, setSkyColors] = useState({ top: '#87CEEB', bottom: '#E0F7FA' });

  useEffect(() => {
    const updateSkyColor = () => {
      const hour = new Date().getHours();
      let top, bottom;

      if (hour >= 6 && hour < 8) {
        // 새벽 (노을)
        top = '#FF9A8B';
        bottom = '#FFECD2';
      } else if (hour >= 8 && hour < 17) {
        // 낮
        top = '#4FC3F7';
        bottom = '#E1F5FE';
      } else if (hour >= 17 && hour < 20) {
        // 저녁 (노을)
        top = '#FF6B6B';
        bottom = '#FFE66D';
      } else {
        // 밤
        top = '#1A237E';
        bottom = '#303F9F';
      }

      setSkyColors({ top, bottom });
    };

    updateSkyColor();
    const interval = setInterval(updateSkyColor, 60000); // 1분마다 업데이트

    return () => clearInterval(interval);
  }, []);

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[500, 32, 32]} />
      <shaderMaterial
        side={THREE.BackSide}
        uniforms={{
          topColor: { value: new THREE.Color(skyColors.top) },
          bottomColor: { value: new THREE.Color(skyColors.bottom) },
        }}
        vertexShader={`
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 topColor;
          uniform vec3 bottomColor;
          varying vec3 vWorldPosition;
          void main() {
            float h = normalize(vWorldPosition).y;
            gl_FragColor = vec4(mix(bottomColor, topColor, max(h, 0.0)), 1.0);
          }
        `}
      />
    </mesh>
  );
}

/**
 * 시간 기반 동적 조명
 */
function DynamicLighting() {
  const directionalRef = useRef();
  const [lightSettings, setLightSettings] = useState({
    intensity: 1.2,
    color: '#ffffff',
    position: [5, 10, 5]
  });

  useEffect(() => {
    const updateLighting = () => {
      const hour = new Date().getHours();
      
      if (hour >= 6 && hour < 8) {
        // 새벽
        setLightSettings({ intensity: 0.8, color: '#FFB347', position: [-5, 3, 5] });
      } else if (hour >= 8 && hour < 17) {
        // 낮
        setLightSettings({ intensity: 1.2, color: '#ffffff', position: [5, 10, 5] });
      } else if (hour >= 17 && hour < 20) {
        // 저녁
        setLightSettings({ intensity: 0.9, color: '#FF6B4A', position: [10, 3, -5] });
      } else {
        // 밤
        setLightSettings({ intensity: 0.4, color: '#8EC8F8', position: [0, 10, 0] });
      }
    };

    updateLighting();
    const interval = setInterval(updateLighting, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <ambientLight intensity={lightSettings.intensity * 0.5} />
      <directionalLight
        ref={directionalRef}
        position={lightSettings.position}
        intensity={lightSettings.intensity}
        color={lightSettings.color}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
    </>
  );
}

/**
 * 시드 기반 랜덤 생성기 (모든 플레이어가 동일한 결과 생성)
 */
function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

/**
 * 가상 환경 컴포넌트 (풀밭 + 간소화된 건물 + 도로)
 * 시드 기반 랜덤으로 모든 플레이어에게 동일한 구조물 배치
 */
function VirtualEnvironment({ buildingsData, roadsData, userLocation }) {
  // 고정된 시드로 모든 플레이어가 동일한 맵 생성
  const FIXED_SEED = 12345;

  const grassPatches = useMemo(() => {
    const random = seededRandom(FIXED_SEED);
    const patches = [];
    for (let i = 0; i < 300; i++) {
      const x = (random() - 0.5) * 400;
      const z = (random() - 0.5) * 400;
      const scale = 0.3 + random() * 0.5;
      const rotation = random() * Math.PI * 2;
      patches.push({ x, z, scale, rotation, key: i });
    }
    return patches;
  }, []);

  const trees = useMemo(() => {
    const random = seededRandom(FIXED_SEED + 1000); // 다른 시드 사용
    const treeList = [];
    for (let i = 0; i < 30; i++) {
      const x = (random() - 0.5) * 300;
      const z = (random() - 0.5) * 300;
      if (Math.abs(x) < 20 && Math.abs(z) < 20) continue;
      const treeScale = 1 + random() * 0.5;
      treeList.push({ x, z, treeScale, key: i });
    }
    return treeList;
  }, []);

  // 간소화된 건물 데이터 (시뮬레이션)
  const buildings = useMemo(() => {
    const random = seededRandom(FIXED_SEED + 2000); // 다른 시드 사용
    const buildingList = [];
    for (let i = 0; i < 20; i++) {
      const x = (random() - 0.5) * 350;
      const z = (random() - 0.5) * 350;
      if (Math.abs(x) < 30 && Math.abs(z) < 30) continue;
      const width = 5 + random() * 10;
      const depth = 5 + random() * 10;
      const height = 8 + random() * 20;
      buildingList.push({ x, z, width, depth, height, key: i });
    }
    return buildingList;
  }, []);

  // 도로 데이터 (십자형 도로)
  const roads = useMemo(() => [
    { x: 0, z: 0, width: 8, length: 400, rotation: 0 }, // 세로 도로
    { x: 0, z: 0, width: 8, length: 400, rotation: Math.PI / 2 }, // 가로 도로
  ], []);

  const GROUND_Y = 0;

  return (
    <group>
      {/* 메인 바닥 - 잔디 */}
      <mesh position={[0, GROUND_Y - 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color={0x4CAF50} roughness={0.9} metalness={0} />
      </mesh>

      {/* 도로 */}
      {roads.map((road, i) => (
        <mesh 
          key={`road-${i}`} 
          position={[road.x, GROUND_Y, road.z]} 
          rotation={[-Math.PI / 2, 0, road.rotation]}
          receiveShadow
        >
          <planeGeometry args={[road.width, road.length]} />
          <meshStandardMaterial color={0x424242} roughness={0.95} />
        </mesh>
      ))}

      {/* 도로 중앙선 */}
      {roads.map((road, i) => (
        <mesh 
          key={`road-line-${i}`} 
          position={[road.x, GROUND_Y + 0.01, road.z]} 
          rotation={[-Math.PI / 2, 0, road.rotation]}
        >
          <planeGeometry args={[0.3, road.length]} />
          <meshStandardMaterial color={0xFFEB3B} />
        </mesh>
      ))}

      {/* 간소화된 건물들 */}
      {buildings.map(({ x, z, width, depth, height, key }) => (
        <group key={`building-${key}`} position={[x, height / 2, z]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial 
              color={key % 3 === 0 ? 0xBDBDBD : key % 3 === 1 ? 0x90A4AE : 0xCFD8DC} 
              roughness={0.8}
            />
          </mesh>
          {/* 건물 창문 (간단한 패턴) */}
          <mesh position={[0, 0, depth / 2 + 0.01]}>
            <planeGeometry args={[width * 0.8, height * 0.8]} />
            <meshStandardMaterial color={0x1976D2} opacity={0.6} transparent />
          </mesh>
        </group>
      ))}

      {/* 풀 패치들 */}
      {grassPatches.map(({ x, z, scale, rotation, key }) => (
        <group key={key} position={[x, GROUND_Y + 0.02, z]} rotation={[0, rotation, 0]}>
          <mesh scale={[scale, 0.08, scale]}>
            <cylinderGeometry args={[0.6, 0.8, 0.2, 6]} />
            <meshStandardMaterial 
              color={key % 3 === 0 ? 0x388E3C : key % 3 === 1 ? 0x43A047 : 0x2E7D32}
              roughness={0.9}
            />
          </mesh>
        </group>
      ))}

      {/* 나무들 */}
      {trees.map(({ x, z, treeScale, key }) => (
        <group key={`tree-${key}`} position={[x, GROUND_Y, z]} scale={[treeScale, treeScale, treeScale]}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.5, 3, 8]} />
            <meshStandardMaterial color={0x5D4037} roughness={0.9} />
          </mesh>
          <mesh position={[0, 4, 0]} castShadow>
            <coneGeometry args={[2, 4, 8]} />
            <meshStandardMaterial color={0x2E7D32} roughness={0.8} />
          </mesh>
          <mesh position={[0, 5.5, 0]} castShadow>
            <coneGeometry args={[1.5, 3, 8]} />
            <meshStandardMaterial color={0x388E3C} roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * 방 포탈 컴포넌트
 * GPS 기반으로 주변 방을 3D 포탈로 표시
 */
function RoomPortal({ room, userLocation, characterStateRef, onProximity, onEnter }) {
  const portalRef = useRef();
  const glowRef = useRef();
  const [isNear, setIsNear] = useState(false);

  // GPS -> 3D 좌표 변환
  const portalPosition = useMemo(() => {
    if (!userLocation || !room.gpsLng || !room.gpsLat) {
      // 기본 위치 (roomId 기반으로 고유한 위치 생성)
      const baseX = ((room.roomId % 10) - 5) * 15;
      const baseZ = (((room.roomId * 7) % 10) - 5) * 15;
      return [baseX, 0, baseZ];
    }
    const x = (room.gpsLng - userLocation[0]) * GPS_SCALE;
    const z = -(room.gpsLat - userLocation[1]) * GPS_SCALE;
    return [x, 0, z];
  }, [room, userLocation]);

  // 거리 체크 및 애니메이션
  useFrame((state) => {
    if (!portalRef.current) return;

    // 포탈 회전 애니메이션
    portalRef.current.rotation.y += 0.01;

    // 글로우 펄스
    if (glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.3 + 0.7;
      glowRef.current.material.opacity = pulse * 0.5;
    }

    // 거리 체크 (ref에서 현재 위치 가져오기)
    const characterPosition = characterStateRef?.current?.position || [0, 0, 0];
    const distance = Math.sqrt(
      Math.pow(characterPosition[0] - portalPosition[0], 2) +
      Math.pow(characterPosition[2] - portalPosition[2], 2)
    );

    const wasNear = isNear;
    const nowNear = distance < PORTAL_ENTER_DISTANCE * 2;

    if (nowNear !== wasNear) {
      setIsNear(nowNear);
      onProximity?.(room, nowNear);
    }

    // 자동 입장 (포탈 중심에 매우 가까울 때)
    if (distance < PORTAL_ENTER_DISTANCE * 0.5) {
      // onEnter?.();
    }
  });

  // 게임 타입별 색상
  const portalColor = useMemo(() => {
    const colors = {
      '반응속도': '#FF6B6B',
      '오목': '#4CAF50',
      '퀴즈': '#2196F3',
      default: '#9C27B0'
    };
    return colors[room.gameName] || colors.default;
  }, [room.gameName]);

  return (
    <group position={portalPosition}>
      {/* 베이스 원형 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <ringGeometry args={[2, 3, 32]} />
        <meshStandardMaterial color={portalColor} side={THREE.DoubleSide} />
      </mesh>

      {/* 포탈 토러스 */}
      <mesh ref={portalRef} position={[0, 3, 0]}>
        <torusGeometry args={[2, 0.3, 16, 32]} />
        <meshStandardMaterial 
          color={portalColor} 
          emissive={portalColor}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* 글로우 이펙트 */}
      <mesh ref={glowRef} position={[0, 3, 0]}>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshBasicMaterial 
          color={portalColor} 
          transparent 
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>

      {/* 방 이름 표시 */}
      <Billboard position={[0, 6, 0]} follow={true}>
        <Text
          fontSize={0.8}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="black"
        >
          {room.roomName || '게임 방'}
        </Text>
      </Billboard>

      {/* 게임 타입 표시 */}
      <Billboard position={[0, 5, 0]} follow={true}>
        <Text
          fontSize={0.5}
          color={portalColor}
          anchorX="center"
          anchorY="middle"
        >
          {room.gameName} ({room.currentPlayers || 1}/{room.maxPlayers || 4})
        </Text>
      </Billboard>

      {/* 근접 시 안내 텍스트 */}
      {isNear && (
        <Billboard position={[0, 7.5, 0]} follow={true}>
          <Text
            fontSize={0.6}
            color="#FFD700"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.03}
            outlineColor="black"
          >
            🚪 Enter를 눌러 입장
          </Text>
        </Billboard>
      )}
    </group>
  );
}

/**
 * 미니맵 컴포넌트
 */
function Minimap({ userLocation, characterStateRef, nearbyRooms, otherPlayers }) {
  const canvasRef = useRef(null);
  const MINIMAP_SIZE = 150;
  const MINIMAP_SCALE = 3; // 1 유닛 = 3 픽셀

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const center = MINIMAP_SIZE / 2;

    // 그리기 함수
    const draw = () => {
      const characterPosition = characterStateRef.current?.position || [0, 0, 0];
      
      // 배경
      ctx.fillStyle = 'rgba(0, 30, 60, 0.85)';
      ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

      // 테두리
      ctx.strokeStyle = 'rgba(100, 180, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

      // 격자
      ctx.strokeStyle = 'rgba(100, 180, 255, 0.2)';
      ctx.lineWidth = 1;
      for (let i = 0; i < MINIMAP_SIZE; i += 30) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, MINIMAP_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(MINIMAP_SIZE, i);
        ctx.stroke();
      }

      // 주변 방 (포탈) 표시
      nearbyRooms.forEach((room) => {
        if (!userLocation || !room.gpsLng) return;
        const dx = (room.gpsLng - userLocation[0]) * GPS_SCALE;
        const dz = -(room.gpsLat - userLocation[1]) * GPS_SCALE;
        const px = center + (dx - characterPosition[0]) * MINIMAP_SCALE;
        const pz = center + (dz - characterPosition[2]) * MINIMAP_SCALE;

        if (px > 0 && px < MINIMAP_SIZE && pz > 0 && pz < MINIMAP_SIZE) {
          ctx.fillStyle = '#9C27B0';
          ctx.beginPath();
          ctx.arc(px, pz, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#E1BEE7';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      // 다른 플레이어 표시
      Object.values(otherPlayers).forEach((player) => {
        const dx = player.position[0] - characterPosition[0];
        const dz = player.position[2] - characterPosition[2];
        const px = center + dx * MINIMAP_SCALE;
        const pz = center + dz * MINIMAP_SCALE;

        if (px > 5 && px < MINIMAP_SIZE - 5 && pz > 5 && pz < MINIMAP_SIZE - 5) {
          ctx.fillStyle = '#2196F3';
          ctx.beginPath();
          ctx.arc(px, pz, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 내 캐릭터 (중앙, 방향 표시)
      ctx.fillStyle = '#4CAF50';
      ctx.beginPath();
      ctx.arc(center, center, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#81C784';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 방향 화살표
      ctx.fillStyle = '#FFEB3B';
      ctx.beginPath();
      ctx.moveTo(center, center - 10);
      ctx.lineTo(center - 5, center);
      ctx.lineTo(center + 5, center);
      ctx.closePath();
      ctx.fill();

      // 나침반 표시
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('N', center, 12);
    };

    draw();
    const interval = setInterval(draw, 100);

    return () => clearInterval(interval);
  }, [characterStateRef, nearbyRooms, otherPlayers, userLocation]);

  return (
    <div className="minimap-container">
      <canvas 
        ref={canvasRef} 
        width={MINIMAP_SIZE} 
        height={MINIMAP_SIZE}
        style={{
          borderRadius: '50%',
          border: '3px solid rgba(100, 180, 255, 0.6)',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(0, 50, 100, 0.3)'
        }}
      />
      <div className="minimap-legend">
        <span style={{ color: '#4CAF50' }}>● 나</span>
        <span style={{ color: '#2196F3' }}>● 플레이어</span>
        <span style={{ color: '#9C27B0' }}>● 방</span>
      </div>
    </div>
  );
}

/**
 * 방 정보 팝업 컴포넌트
 */
function RoomInfoPopup({ room, onJoin, onClose }) {
  return (
    <div className="room-info-popup">
      <div className="room-info-header">
        <h3>{room.roomName || '게임 방'}</h3>
        <button className="popup-close-btn" onClick={onClose}>✕</button>
      </div>
      <div className="room-info-content">
        <div className="room-info-row">
          <span className="label">🎮 게임</span>
          <span className="value">{room.gameName}</span>
        </div>
        <div className="room-info-row">
          <span className="label">👑 방장</span>
          <span className="value">{room.hostName || '알 수 없음'}</span>
        </div>
        <div className="room-info-row">
          <span className="label">👥 인원</span>
          <span className="value">{room.currentPlayers || 1} / {room.maxPlayers || 4}</span>
        </div>
        <div className="room-info-row">
          <span className="label">🔒 상태</span>
          <span className="value">{room.isLocked ? '비공개' : '공개'}</span>
        </div>
      </div>
      <div className="room-info-actions">
        <button className="join-room-btn" onClick={onJoin}>
          🚪 입장하기
        </button>
      </div>
    </div>
  );
}

/**
 * 시간대 표시 컴포넌트
 */
function TimeIndicator({ isInPersonalRoom }) {
  const [timeInfo, setTimeInfo] = useState({ icon: '☀️', text: '낮', time: '' });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hour = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hour}:${minutes}`;
      
      let icon, text;
      if (hour >= 6 && hour < 8) {
        icon = '🌅';
        text = '새벽';
      } else if (hour >= 8 && hour < 17) {
        icon = '☀️';
        text = '낮';
      } else if (hour >= 17 && hour < 20) {
        icon = '🌆';
        text = '저녁';
      } else {
        icon = '🌙';
        text = '밤';
      }
      
      setTimeInfo({ icon, text, time: timeStr });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`time-indicator ${isInPersonalRoom ? 'personal-room' : ''}`}>
      <span className="time-icon">{timeInfo.icon}</span>
      <span>{timeInfo.text} {timeInfo.time}</span>
    </div>
  );
}

/**
 * 좌측 방 목록 패널 컴포넌트
 * GPS 기반 주변 방 목록을 표시하고 클릭 시 확대 보기
 */
function RoomListPanel({ rooms, onRoomSelect, selectedRoomId, onCreateRoom, onJoinRoom, userId }) {
  const [expandedRoomId, setExpandedRoomId] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 게임 타입별 아이콘
  const getGameIcon = (gameName) => {
    const icons = {
      '오목': '⚫',
      '끝말잇기': '💬',
      '에임 맞추기': '🎯',
      'Reaction Race': '⚡',
      '반응속도': '⚡',
      '스무고개': '❓',
      default: '🎮'
    };
    return icons[gameName] || icons.default;
  };

  // 게임 타입별 색상
  const getGameColor = (gameName) => {
    const colors = {
      '오목': '#4CAF50',
      '끝말잇기': '#2196F3',
      '에임 맞추기': '#FF5722',
      'Reaction Race': '#FF6B6B',
      '반응속도': '#FF6B6B',
      '스무고개': '#9C27B0',
      default: '#607D8B'
    };
    return colors[gameName] || colors.default;
  };

  const handleRoomClick = (room) => {
    if (expandedRoomId === room.roomId) {
      // 이미 확대된 상태면 선택
      onRoomSelect(room);
    } else {
      // 확대
      setExpandedRoomId(room.roomId);
    }
  };

  const handleJoinClick = (e, room) => {
    e.stopPropagation();
    onRoomSelect(room);
  };

  if (rooms.length === 0 && isCollapsed) {
    return null;
  }

  return (
    <div className={`room-list-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="room-list-header">
        <h3>📍 주변 게임방 ({rooms.length})</h3>
        <div className="header-buttons">
          <button 
            className="create-room-btn"
            onClick={onCreateRoom}
            title="내 방 만들기"
          >
            🏠
          </button>
          <button 
            className="collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? '▶' : '◀'}
          </button>
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="room-list-content">
          {rooms.length === 0 ? (
            <div className="no-rooms">
              <span className="no-rooms-icon">🏠</span>
              <p>주변에 게임방이 없습니다</p>
              <p className="no-rooms-hint">방을 생성해보세요!</p>
            </div>
          ) : (
            <div className="room-items">
              {rooms.map((room) => (
                <div 
                  key={room.roomId}
                  className={`room-item ${expandedRoomId === room.roomId ? 'expanded' : ''} ${selectedRoomId === room.roomId ? 'selected' : ''}`}
                  onClick={() => handleRoomClick(room)}
                  style={{ borderLeftColor: getGameColor(room.gameName) }}
                >
                  <div className="room-item-header">
                    <span className="room-icon" style={{ backgroundColor: getGameColor(room.gameName) }}>
                      {getGameIcon(room.gameName)}
                    </span>
                    <div className="room-info">
                      <span className="room-name">{room.roomName}</span>
                      <span className="room-game">{room.gameName}</span>
                    </div>
                    <div className="room-players">
                      <span className="player-count">
                        {room.currentPlayers || 1}/{room.maxPlayers || 4}
                      </span>
                      {room.isLocked && <span className="lock-icon">🔒</span>}
                    </div>

                    {/* 내 방인 경우 헤더에 입장 버튼 표시 (바로 입장 가능) */}
                    {String(room.hostId) === String(userId) && (
                      <div className="my-room-action">
                        <button
                          className="my-room-enter-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onJoinRoom?.(room);
                          }}
                        >
                          🚪 입장 (내 방)
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* 확대 시 추가 정보 */}
                  {expandedRoomId === room.roomId && (
                    <div className="room-item-expanded">
                      <div className="expanded-info">
                        <div className="info-row">
                          <span className="label">👑 방장</span>
                          <span className="value">{room.hostName || '알 수 없음'}</span>
                        </div>
                        <div className="info-row">
                          <span className="label">📍 위치</span>
                          <span className="value">
                            {room.gpsLat && room.gpsLng 
                              ? `${room.gpsLat.toFixed(4)}, ${room.gpsLng.toFixed(4)}`
                              : '위치 정보 없음'
                            }
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="label">🎮 상태</span>
                          <span className="value">{room.isPlaying ? '게임 중' : '대기 중'}</span>
                        </div>
                      </div>
                      <button 
                        className="join-btn"
                        onClick={(e) => handleJoinClick(e, room)}
                        disabled={room.isLocked || (room.currentPlayers >= room.maxPlayers)}
                      >
                        {room.isLocked ? '🔒 비공개' : 
                         room.currentPlayers >= room.maxPlayers ? '인원 초과' : 
                         '🚪 입장하기'}
                      </button>

                      {/* 내 방용 추가 입장 버튼 (확장 영역에도 표시) */}
                      {String(room.hostId) === String(userId) && (
                        <button
                          className="join-btn my-room-join-btn"
                          onClick={(e) => { e.stopPropagation(); onJoinRoom?.(room); }}
                        >
                          🚪 내 방 입장
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* 스타일 추가를 위한 inline style block (간단 추가) */}
              <style>{`
                .my-room-action { margin-left: 8px; }
                .my-room-enter-btn { padding:6px 8px; background: linear-gradient(135deg,#4CAF50,#45a049); border:none; color:#fff; border-radius:8px; cursor:pointer; font-weight:600; }
                .my-room-enter-btn:hover { transform: translateY(-1px); }
                .my-room-join-btn { margin-left:8px; background: linear-gradient(135deg,#00bcd4,#0097a7); }
              `}</style>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
