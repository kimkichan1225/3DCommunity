import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import './App.css';
import { Physics } from '@react-three/rapier';
import { Mapbox3D } from './features/map';
import { LandingPage } from './features/auth';
import { BoardModal } from './features/board';
import { ProfileModal } from './features/profile';
import { SettingModal } from './features/system/settings';
import Character from './components/character/Character';
import CameraController from './components/camera/CameraController';
import CameraLogger from './components/camera/CameraLogger';
import Level1 from './components/map/Level1';
import GlobalChat from './components/GlobalChat';
import OtherPlayer from './components/character/OtherPlayer';
import ProfileAvatar from './components/ProfileAvatar';
import PhoneUI from './components/PhoneUI';
import multiplayerService from './services/multiplayerService';
import authService from './features/auth/services/authService';

function App() {
  const characterRef = useRef();
  const mainCameraRef = useRef();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [mapHelpers, setMapHelpers] = useState(null);
  const [initialPosition, setInitialPosition] = useState(null);
  const [isMapFull, setIsMapFull] = useState(false);
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingModal, setShowSettingModal] = useState(false);
  const [showPhoneUI, setShowPhoneUI] = useState(false);
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [otherPlayers, setOtherPlayers] = useState({});
  const [userProfile, setUserProfile] = useState(null); // 사용자 프로필 (selectedProfile, selectedOutline 포함)
  const [onlineCount, setOnlineCount] = useState(0); // 온라인 인원 수
  const [playerJoinEvent, setPlayerJoinEvent] = useState(null); // 플레이어 입장 이벤트
  const [playerLeaveEvent, setPlayerLeaveEvent] = useState(null); // 플레이어 퇴장 이벤트
  const [isChatInputFocused, setIsChatInputFocused] = useState(false); // 채팅 입력 포커스 상태
  const [playerChatMessages, setPlayerChatMessages] = useState({}); // 플레이어별 채팅 메시지 { userId: { message, timestamp } }
  const [myChatMessage, setMyChatMessage] = useState(''); // 내 캐릭터의 채팅 메시지
  const myMessageTimerRef = useRef(null); // 내 메시지 타이머 참조
  const playerMessageTimersRef = useRef({}); // 다른 플레이어 메시지 타이머 참조
  const mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1IjoiYmluc3MwMTI0IiwiYSI6ImNtaTcyM24wdjAwZDMybHEwbzEyenJ2MjEifQ.yi82NwUcsPMGP4M3Ri136g';

  // 모달이 열려있는지 확인 (PhoneUI는 제외 - 게임플레이에 영향 없음)
  const isAnyModalOpen = showBoardModal || showProfileModal || showSettingModal || showLanding;

  // 캐릭터 이동을 막아야 하는 상태 (모달 열림 또는 채팅 입력 중)
  const shouldBlockMovement = isAnyModalOpen || isChatInputFocused;

  // Map가 준비되면 호출됩니다. mapbox의 projection helper를 받아와
  // 현재 위치(geolocation)를 Three.js 월드 좌표로 변환해 캐릭터 초기 위치를 설정합니다.
  const handleMapReady = ({ map, project }) => {
    setMapHelpers({ map, project });

    // Try to get browser geolocation; fallback to map center
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lng = pos.coords.longitude;
          const lat = pos.coords.latitude;

          try {
            const center = map.getCenter();
            const centerMerc = project([center.lng, center.lat], 0);
            const userMerc = project([lng, lat], 0);

            // Convert mercator units difference to meters
            const unitsPerMeter = userMerc.meterInMercatorCoordinateUnits || 1;
            const dx = (userMerc.translateX - centerMerc.translateX) / unitsPerMeter;
            const dz = (userMerc.translateY - centerMerc.translateY) / unitsPerMeter;

            // Mapbox의 Y increases northwards; Three.js Z forward is negative, adjust sign if needed
            const threeX = dx;
            const threeY = 2; // 약간 띄워서 시작
            const threeZ = -dz;

            setInitialPosition([threeX, threeY, threeZ]);
            console.log('Initial character position (Three.js):', [threeX, threeY, threeZ]);
          } catch (e) {
            console.warn('map projection failed', e);
          }
        },
        (err) => {
          console.warn('Geolocation denied or unavailable, using map center', err);
          // use map center as fallback
          const threeX = 0;
          const threeY = 2;
          const threeZ = 0;
          setInitialPosition([threeX, threeY, threeZ]);
        }
      );
    } else {
      console.warn('Geolocation not supported, using map center');
      setInitialPosition([0, 2, 0]);
    }
  };

  const toggleMapFull = (e) => {
    e && e.stopPropagation();
    // Only toggle the boolean; Mapbox3D will mount when isMapFull becomes true
    setIsMapFull((v) => !v);
  };

  // Helper: request geolocation and set initialPosition using provided project helper
  const requestGeolocationAndSet = (project, map) => {
    if (!project || !map) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lng = pos.coords.longitude;
          const lat = pos.coords.latitude;
          try {
            const center = map.getCenter();
            const centerMerc = project([center.lng, center.lat], 0);
            const userMerc = project([lng, lat], 0);
            const unitsPerMeter = userMerc.meterInMercatorCoordinateUnits || 1;
            const dx = (userMerc.translateX - centerMerc.translateX) / unitsPerMeter;
            const dz = (userMerc.translateY - centerMerc.translateY) / unitsPerMeter;
            const threeX = dx;
            const threeY = 2;
            const threeZ = -dz;
            setInitialPosition([threeX, threeY, threeZ]);
            console.log('Initial character position (from toggle):', [threeX, threeY, threeZ]);
          } catch (e) {
            console.warn('map projection failed', e);
          }
        },
        (err) => {
          console.warn('Geolocation denied/unavailable when opening map', err);
        }
      );
    }
  };

  const handleLoginSuccess = (user) => {
    console.log('로그인 성공:', user);
    setIsLoggedIn(true);
    setShowLanding(false);
    setUsername(user.username || 'Guest');
    setUserId(user.id || String(Date.now()));
    setUserProfile(user); // 프로필 정보 저장 (selectedProfile, selectedOutline 포함)
  };

  // 프로필 업데이트 시 호출되는 함수
  const handleProfileUpdate = async () => {
    try {
      // 서버에서 최신 사용자 정보 가져오기
      const updatedUser = await authService.fetchCurrentUser();
      if (updatedUser) {
        setUserProfile(updatedUser);
        console.log('✅ 프로필 업데이트 완료:', updatedUser);
      }
    } catch (error) {
      console.error('Failed to update user profile:', error);
    }
  };

  const handleLogout = async () => {
    try {
      // Call logout API to remove user from active list
      await authService.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    }

    // Disconnect from multiplayer service
    multiplayerService.disconnect();
    setIsLoggedIn(false);
    setShowLanding(true);
    setUsername('');
    setUserId('');
    setUserProfile(null);
    setOtherPlayers({});
    setOnlineCount(0);
  };

  // 채팅 메시지 처리 함수 (GlobalChat에서 호출됨)
  const handleChatMessage = (data) => {
    if (String(data.userId) === String(userId)) {
      // My own message
      // 이전 타이머가 있으면 취소
      if (myMessageTimerRef.current) {
        clearTimeout(myMessageTimerRef.current);
      }

      setMyChatMessage(data.message);

      // 새 타이머 설정 - 5초 후 삭제
      myMessageTimerRef.current = setTimeout(() => {
        setMyChatMessage('');
        myMessageTimerRef.current = null;
      }, 5000);
    } else {
      // Other player's message
      // 이전 타이머가 있으면 취소
      if (playerMessageTimersRef.current[data.userId]) {
        clearTimeout(playerMessageTimersRef.current[data.userId]);
      }

      setPlayerChatMessages((prev) => ({
        ...prev,
        [data.userId]: {
          message: data.message,
          timestamp: Date.now()
        }
      }));

      // 새 타이머 설정 - 5초 후 삭제
      playerMessageTimersRef.current[data.userId] = setTimeout(() => {
        setPlayerChatMessages((prev) => {
          const updated = { ...prev };
          delete updated[data.userId];
          return updated;
        });
        delete playerMessageTimersRef.current[data.userId];
      }, 5000);
    }
  };

  // Connect to multiplayer service - even when not logged in (as observer)
  useEffect(() => {
    // Set up callbacks first
    multiplayerService.onPlayerJoin((data) => {
      // 중복 로그인 체크
      if (data.action === 'duplicate') {
        // 자신의 중복 로그인 시도인지 확인
        if (isLoggedIn && String(data.userId) === String(userId)) {
          alert('현재 접속 중인 아이디입니다.');
          handleLogout();
        }
        return;
      }

      // If logged in, ignore own join event
      if (isLoggedIn && String(data.userId) === String(userId)) {
        return;
      }

      // Update otherPlayers state
      setOtherPlayers((prev) => ({
        ...prev,
        [data.userId]: {
          userId: data.userId,
          username: data.username,
          position: [5, 10, 5], // Higher position to make it visible
          rotationY: 0,
          animation: 'idle'
        }
      }));

      // Notify GlobalChat
      setPlayerJoinEvent({ ...data, timestamp: Date.now() });
    });

    multiplayerService.onPlayerLeave((data) => {
      setOtherPlayers((prev) => {
        const updated = { ...prev };
        delete updated[data.userId];
        return updated;
      });

      // Notify GlobalChat
      setPlayerLeaveEvent({ ...data, timestamp: Date.now() });
    });

    multiplayerService.onPositionUpdate((data) => {
      setOtherPlayers((prev) => ({
        ...prev,
        [data.userId]: {
          userId: data.userId,
          username: data.username,
          position: [data.x, data.y, data.z],
          rotationY: data.rotationY,
          animation: data.animation
        }
      }));
    });

    // Online count update handler
    multiplayerService.onOnlineCountUpdate((count) => {
      setOnlineCount(count);
    });

    // Connect as observer if not logged in, or as player if logged in
    if (isLoggedIn && userId && username) {
      // console.log('🔗 Connecting to multiplayer service as player...', { userId, username });
      multiplayerService.connect(userId, username);
    } else {
      // Connect as observer (anonymous viewer)
      // console.log('👀 Connecting to multiplayer service as observer...');
      const observerId = 'observer_' + Date.now();
      multiplayerService.connect(observerId, 'Observer', true); // true = observer mode
    }

    // Cleanup on unmount
    return () => {
      multiplayerService.disconnect();
    };
  }, [isLoggedIn, userId, username]);

  // Cleanup on window close or refresh
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isLoggedIn) {
        // Disconnect WebSocket - this will trigger SessionDisconnectEvent on server
        multiplayerService.disconnect();

        // Send beacon to logout endpoint (non-blocking)
        const token = authService.getToken();
        if (token) {
          const url = `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/auth/logout`;
          const blob = new Blob([JSON.stringify({})], { type: 'application/json' });
          navigator.sendBeacon(url, blob);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isLoggedIn]);



  return (
    <div className="App">
      {/* Mapbox 배경 및 Three.js 오버레이 */}
      {isMapFull && (
        <Mapbox3D onMapReady={handleMapReady} isFull={isMapFull} />
      )}

      {/* 프로필 아바타 (좌측 상단, 로그인한 사용자만 표시) */}
      {isLoggedIn && (
        <button className="profile-avatar-button" onClick={() => setShowProfileModal(true)} title="프로필">
          <ProfileAvatar
            profileImage={userProfile?.selectedProfile}
            outlineImage={userProfile?.selectedOutline}
            size={150}
          />
        </button>
      )}

      {/* 아이콘 메뉴 (로그인한 사용자만 표시) */}
      {isLoggedIn && (
        <div className={`icon-menu-container ${isMenuExpanded ? 'expanded' : ''}`}>
          {/* 토글 화살표 */}
          <button
            className="menu-toggle-arrow"
            onClick={() => setIsMenuExpanded(!isMenuExpanded)}
          >
            <img
              src={isMenuExpanded ? '/resources/Icon/rightarrow.png' : '/resources/Icon/leftarrow.png'}
              alt={isMenuExpanded ? 'Close' : 'Open'}
            />
          </button>

          {/* 확장 시 보이는 아이콘들 */}
          <div className={`secondary-icons ${isMenuExpanded ? 'show' : 'hide'}`}>
            <button className="icon-button" onClick={() => console.log('알람')} title="알람">
              <img src="/resources/Icon/Alarm-icon.png" alt="Alarm" />
            </button>
            <button className="icon-button" onClick={() => setShowPhoneUI(true)} title="채팅">
              <img src="/resources/Icon/Chat-icon.png" alt="Chat" />
            </button>
            <button className="icon-button" onClick={() => console.log('이벤트')} title="이벤트">
              <img src="/resources/Icon/Event-icon.png" alt="Event" />
            </button>
            <button className="icon-button" onClick={() => setShowPhoneUI(true)} title="친구목록">
              <img src="/resources/Icon/Friend-icon.png" alt="Friend" />
            </button>
            <button className="icon-button" onClick={() => setShowSettingModal(true)} title="설정">
              <img src="/resources/Icon/Setting-icon.png" alt="Setting" />
            </button>
            <button className="icon-button" onClick={() => console.log('상점')} title="상점">
              <img src="/resources/Icon/Shop-icon.png" alt="Shop" />
            </button>
          </div>

          {/* 게시판 아이콘 */}
          <button className="icon-button primary-board" onClick={() => setShowBoardModal(true)} title="게시판">
            <img src="/resources/Icon/Board-icon.png" alt="Board" />
          </button>

          {/* 지도 아이콘 */}
          <button className="icon-button primary-map" onClick={toggleMapFull} title="지도">
            <img src="/resources/Icon/Map-icon.png" alt="Map" />
          </button>
        </div>
      )}

      {/* Token warning if user opens map but token missing */}
      {isMapFull && !mapboxToken && (
        <div className="map-token-warning">Mapbox token not set. Fill `REACT_APP_MAPBOX_TOKEN` in your `.env`.</div>
      )}

      {/* 3D 배경 (항상 렌더링) - 지도 위에 오버레이로 렌더링됩니다 */}
      <div className="three-overlay">
      <Canvas
        className="three-canvas"
        camera={{ position: [-0.00, 28.35, 19.76], rotation: [-0.96, -0.00, -0.00] }}
        shadows
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[50, 50, 25]}
          intensity={6}
          castShadow
          shadow-mapSize-width={8192}
          shadow-mapSize-height={8192}
          shadow-camera-far={1000}
          shadow-camera-left={-500}
          shadow-camera-right={500}
          shadow-camera-top={500}
          shadow-camera-bottom={-500}
          shadow-bias={-0.0001}
          shadow-normalBias={0.02}
          shadow-radius={4}
        />
        {/* Sun visual */}
        <mesh position={[50, 50, 25]}>
          <sphereGeometry args={[3, 16, 16]} />
          <meshBasicMaterial color="#FDB813" />
        </mesh>

        <Suspense fallback={null}>
          <Physics gravity={[0, -40, 0]} debug>
            {/* 로그인 후에만 캐릭터 표시 */}
            {isLoggedIn && (
              <>
                <Character
                  characterRef={characterRef}
                  initialPosition={initialPosition}
                  isMovementDisabled={shouldBlockMovement && !isMapFull}
                  username={username}
                  userId={userId}
                  multiplayerService={multiplayerService}
                  chatMessage={myChatMessage}
                />
                <CameraLogger />
              </>
            )}

            {/* Render other players - 로그인 여부와 관계없이 항상 표시 (observer 제외) */}
            {Object.values(otherPlayers)
              .filter((player) => !String(player.userId).startsWith('observer_'))
              .map((player) => (
                <OtherPlayer
                  key={player.userId}
                  userId={player.userId}
                  username={player.username}
                  position={player.position}
                  rotationY={player.rotationY}
                  animation={player.animation}
                  chatMessage={playerChatMessages[player.userId]?.message}
                />
              ))}

            {/* CameraController는 항상 렌더링 (로그인 전: MainCamera, 로그인 후: Character) */}
            <CameraController
              characterRef={characterRef}
              mainCameraRef={mainCameraRef}
              isLoggedIn={isLoggedIn}
            />
            <Level1 characterRef={characterRef} mainCameraRef={mainCameraRef} />
          </Physics>
        </Suspense>
      </Canvas>
      </div>

      {/* 랜딩 페이지 오버레이 (지도 전체화면일 때는 숨김) */}
      {showLanding && !isMapFull && (
        <LandingPage onLoginSuccess={handleLoginSuccess} />
      )}

      {/* 맵 전체화면일 때 뒤로가기 버튼 (왼쪽 상단) */}
      {isMapFull && (
        <button className="map-back-button" onClick={toggleMapFull}>Back</button>
      )}

      {/* 게시판 모달 */}
      {showBoardModal && (
        <BoardModal onClose={() => setShowBoardModal(false)} />
      )}

      {/* 프로필 모달 */}
      {showProfileModal && (
        <ProfileModal
          onClose={() => setShowProfileModal(false)}
          onLogout={handleLogout}
          onProfileUpdate={handleProfileUpdate}
        />
      )}

      {/* 설정 모달 */}
      {showSettingModal && (
        <SettingModal onClose={() => setShowSettingModal(false)} />
      )}

      {/* Phone UI (친구목록/채팅) */}
      <PhoneUI
        isOpen={showPhoneUI}
        onClose={() => setShowPhoneUI(false)}
        userId={userId}
        username={username}
      />

      {/* 전체 채팅 (로그인한 사용자만, 맵 전체화면 아닐 때만 표시) */}
      {isLoggedIn && !isMapFull && (
        <GlobalChat
          isVisible={true}
          username={username}
          userId={userId}
          onlineCount={onlineCount}
          playerJoinEvent={playerJoinEvent}
          playerLeaveEvent={playerLeaveEvent}
          onInputFocusChange={setIsChatInputFocused}
          onChatMessage={handleChatMessage}
        />
      )}
    </div>
  );
}

export default App;