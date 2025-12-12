import React, { useEffect, useRef, useState } from 'react';
import { MapboxManager } from '../../core/map/MapboxManager';

/**
 * GameManager - 간단한 버전
 * map 디렉토리의 GameManager 로직을 기반으로 함
 */
function GameManager({
  mapboxToken,
  characterModelPath,
  startPosition = [127.0276, 37.4979],
  endPosition = [127.0300, 37.4980]
}) {
  const gameContainerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('초기화 중...');

  // 참조
  const mapboxManagerRef = useRef(null);

  useEffect(() => {
    const initializeGame = async () => {
      try {
        if (!gameContainerRef.current) {
          throw new Error('Game container not found');
        }

        console.log('🎮 게임 초기화 시작...');
        setStatus('Mapbox 초기화 중...');

        // Mapbox 초기화
        const mapboxManager = new MapboxManager({
          accessToken: mapboxToken,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: startPosition,
          zoom: 19.2,
          pitch: 78,
          bearing: 0
        });

        await mapboxManager.initialize(gameContainerRef.current);
        mapboxManagerRef.current = mapboxManager;

        console.log('✅ Mapbox 초기화 완료!');
        setStatus('준비 완료!');
        setIsReady(true);
      } catch (err) {
        console.error('❌ 초기화 실패:', err);
        setError(err.message || '게임을 초기화할 수 없습니다');
        setStatus(`오류: ${err.message}`);
      }
    };

    initializeGame();

    return () => {
      if (mapboxManagerRef.current) {
        mapboxManagerRef.current.dispose();
      }
    };
  }, [mapboxToken, startPosition]);

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        background: '#1a1a1a',
        color: '#ff6b6b',
        fontFamily: 'monospace',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div>⚠️ 오류 발생</div>
        <div style={{ fontSize: '12px', color: '#aaa' }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      background: '#000'
    }}>
      {/* 게임 컨테이너 */}
      <div
        ref={gameContainerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      />

      {/* 로딩 상태 표시 */}
      {!isReady && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.9)',
          color: '#0f0',
          padding: '20px 40px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          border: '1px solid #0f0',
          zIndex: 999,
          textAlign: 'center'
        }}>
          <div>🎮 {status}</div>
        </div>
      )}

      {/* 상태 HUD */}
      {isReady && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          background: 'rgba(0, 0, 0, 0.8)',
          color: '#0f0',
          padding: '12px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '11px',
          border: '1px solid #0f0',
          zIndex: 10,
          maxWidth: '300px',
          lineHeight: '1.6'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>📊 게임 상태</div>
          <div>상태: ✅ {status}</div>
          <div style={{ marginTop: '8px', fontSize: '10px', color: '#888' }}>
            WASD: 이동<br/>
            화살표: 카메라 조절<br/>
            R/F: 거리 조절
          </div>
        </div>
      )}
    </div>
  );
}

export default GameManager;
