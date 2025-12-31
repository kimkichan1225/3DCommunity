/**
 * MapGamePageSimple.jsx
 * Simplified version for testing multiplayer without WebGL conflicts
 */

import React, { useRef, useEffect, useState } from 'react';
import MultiplayerService from '../services/multiplayerService';
import './MapGamePageV2.css';

export default function MapGamePageSimple() {
  const canvasRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [remotePlayersData, setRemotePlayersData] = useState(new Map());
  const userInfoRef = useRef(null);

  // Simple canvas setup
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // Draw background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Multiplayer Test - No WebGL', canvas.width / 2, canvas.height / 2);

    setIsInitialized(true);
  }, []);

  // Initialize MultiplayerService
  useEffect(() => {
    if (!isInitialized) return;

    const initMultiplayer = async () => {
      try {
        let userId = localStorage.getItem('userId');
        let username = localStorage.getItem('username');

        if (!userId || !username) {
          userId = 'test-user-' + Math.random().toString(36).substr(2, 9);
          username = 'TestPlayer_' + Math.random().toString(36).substr(2, 5);
          console.log('🧪 [TEST MODE]', { userId, username });
        }

        userInfoRef.current = { userId, username };
        MultiplayerService.connect(userId, username, false);

        MultiplayerService.onPositionUpdateCallbacks.push((data) => {
          if (String(data.userId) !== String(userId)) {
            console.log('📍 Remote Player:', data.username, 'pos:', [data.x, data.y, data.z]);
            setRemotePlayersData(prev => {
              const newMap = new Map(prev);
              newMap.set(String(data.userId), { userId: data.userId, username: data.username });
              return newMap;
            });
          }
        });

        MultiplayerService.onPlayerJoinCallbacks.push((data) => {
          if (String(data.userId) !== String(userId)) {
            console.log('🎮 Player joined:', data.username);
          }
        });

        MultiplayerService.onPlayerLeaveCallbacks.push((data) => {
          console.log('👋 Player left:', data.username);
          setRemotePlayersData(prev => {
            const newMap = new Map(prev);
            newMap.delete(String(data.userId));
            return newMap;
          });
        });

        // Send position every 2 seconds
        const interval = setInterval(() => {
          MultiplayerService.sendPositionUpdate([0, 0, 0], 0, 'idle', '', false);
        }, 2000);

        return () => clearInterval(interval);
      } catch (err) {
        console.error('❌ Multiplayer init failed:', err);
      }
    };

    initMultiplayer();
  }, [isInitialized]);

  return (
    <div className="map-game-container">
      <canvas ref={canvasRef} className="game-canvas" style={{ width: '100%', height: '100%' }} />
      
      <div className="game-hud">
        <div className="hud-panel" style={{ position: 'absolute', top: 20, left: 20 }}>
          <h3>Multiplayer Test</h3>
          <p>User: {userInfoRef.current?.username}</p>
          <p>Players: {remotePlayersData.size + 1}</p>
          {Array.from(remotePlayersData.values()).map(p => (
            <div key={p.userId}>👤 {p.username}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
