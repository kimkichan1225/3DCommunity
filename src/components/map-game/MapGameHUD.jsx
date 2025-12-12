/**
 * 지도 게임 HUD - 네비게이션 스타일
 * Google Maps / Apple Maps 스타일의 내비게이션 UI
 */

import React, { useState } from 'react';
import './MapGameHUD.css';

export function MapGameHUD({
  gameState,
  game,
  route,
  destination,
  navigationInfo,
  onNavigateTo,
  onClearRoute,
}) {
  const [showNav, setShowNav] = useState(false);
  const [destLng, setDestLng] = useState('');
  const [destLat, setDestLat] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const handleNavigate = () => {
    if (destLng && destLat) {
      onNavigateTo(parseFloat(destLng), parseFloat(destLat));
      setDestLng('');
      setDestLat('');
      setSearchInput('');
      setShowNav(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleNavigate();
    }
  };

  // 거리를 km 또는 m으로 표시
  const formatDistance = (meters) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  // 시간 계산 (시속 5km 기준)
  const formatTime = (meters) => {
    const hours = meters / 5000 / 3.6; // 5m/s = 18km/h
    if (hours < 1) {
      return `${Math.round(hours * 60)} 분`;
    }
    return `${hours.toFixed(1)} 시간`;
  };

  return (
    <div className="map-game-hud">
      {/* 상단: 검색 바 */}
      <div className="hud-search-bar">
        <button
          className="btn-search-back"
          onClick={() => {
            setShowNav(false);
            setSearchInput('');
          }}
        >
          {showNav ? '←' : '🔍'}
        </button>

        {!showNav ? (
          <div className="current-location-display">
            <span className="location-icon">📍</span>
            <span className="location-text">현재 위치</span>
          </div>
        ) : (
          <input
            type="text"
            className="search-input"
            placeholder="목적지 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            autoFocus
          />
        )}

        {route && (
          <button className="btn-clear-route" onClick={onClearRoute}>
            ✕
          </button>
        )}
      </div>

      {/* 검색 패널 */}
      {showNav && (
        <div className="search-panel">
          <div className="coordinate-inputs">
            <div className="input-group">
              <label>경도</label>
              <input
                type="number"
                step="0.000001"
                placeholder="127.0276"
                value={destLng}
                onChange={(e) => setDestLng(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            <div className="input-group">
              <label>위도</label>
              <input
                type="number"
                step="0.000001"
                placeholder="37.4979"
                value={destLat}
                onChange={(e) => setDestLat(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
          </div>

          <button className="btn-search-navigate" onClick={handleNavigate}>
            경로 시작
          </button>
        </div>
      )}

      {/* 하단: 네비게이션 정보 (경로 중일 때) */}
      {route && navigationInfo && (
        <div className="nav-info-panel">
          <div className="nav-header">
            <div className="nav-distance">
              <span className="distance-value">
                {formatDistance(navigationInfo.distanceRemaining || 0)}
              </span>
              <span className="distance-unit">남음</span>
            </div>
            <div className="nav-time">
              <span className="time-icon">⏱</span>
              {formatTime(navigationInfo.distanceRemaining || 0)}
            </div>
          </div>

          <div className="nav-instruction">
            <div className="instruction-direction">
              {navigationInfo.direction || '경로를 따라 이동중...'}
            </div>
            <div className="instruction-road">
              {navigationInfo.currentRoad || '길을 따라 이동하세요'}
            </div>
          </div>

          <div className="nav-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${
                    route.geometry.coordinates.length > 0
                      ? ((navigationInfo.progress || 0) / 100) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <span className="progress-percent">
              {Math.round(navigationInfo.progress || 0)}%
            </span>
          </div>
        </div>
      )}

      {/* 우측 하단: 제어 버튼 */}
      <div className="nav-controls">
        <button
          className="nav-btn nav-search-btn"
          onClick={() => setShowNav(!showNav)}
          title="목적지 검색"
        >
          🔍
        </button>

        <button
          className="nav-btn nav-location-btn"
          onClick={() => {
            if (game && game.gpsManager) {
              console.log('📡 GPS 위치 재시작');
            }
          }}
          title="위치 새로고침"
        >
          🧭
        </button>

        <button
          className="nav-btn nav-sound-btn"
          onClick={() => {
            console.log('🔊 음성 안내');
          }}
          title="음성 안내"
        >
          🔊
        </button>
      </div>

      {/* 조작 정보 (선택사항) */}
      <div className="nav-info-tooltip">
        <p><kbd>W/A/S/D</kbd> 이동 | <kbd>SPACE</kbd> 점프 | <kbd>드래그</kbd> 카메라</p>
      </div>

      {/* 게임 상태 (디버그 정보) */}
      {gameState && (
        <div className="game-debug-info">
          <div className="debug-item">
            <span>FPS: {gameState.fps || 0}</span>
          </div>
          <div className="debug-item">
            <span>
              좌표: {gameState.position[0]?.toFixed(1)}, {gameState.position[2]?.toFixed(1)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
