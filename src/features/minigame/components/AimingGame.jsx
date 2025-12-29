import React, { useState, useEffect, useCallback } from 'react';
import minigameService from '../../../services/minigameService';
import './AimingGame.css';

const GAME_CONFIG = {
  GAME_AREA_WIDTH: 500,
  GAME_AREA_HEIGHT: 400,
};

const SimplePlayerList = ({ scores, players, userProfile }) => (
  <div className="aim-game-players">
    {players.map(p => {
      const isSelf = p.userId === userProfile?.id;
      return (
        <div key={p.userId} className={`player-score ${isSelf ? 'self' : ''}`}>
          <span className="player-name">{isSelf ? `${p.username} (You)` : p.username}</span>
          <span className="player-points">{scores[p.userId] || 0}</span>
        </div>
      );
    })}
  </div>
);

export default function AimingGame({ roomId, isHost, userProfile, players = [], onGameEnd }) {
  console.log('AimingGame mounted');
  const [targets, setTargets] = useState({}); // Using an object for quick lookup by ID
  const [scores, setScores] = useState({});
  const [gameStatus, setGameStatus] = useState('playing'); // playing, ended
  const [finalScores, setFinalScores] = useState(null);

  // Initialize scores for all players
  useEffect(() => {
    const initialScores = {};
    players.forEach(p => {
      initialScores[p.userId] = 0;
    });
    setScores(initialScores);
    return () => console.log('AimingGame unmounted');
  }, [players]);

  // Main event handler for backend communication
  useEffect(() => {
    const handler = (evt) => {
      if (!evt || !evt.type || evt.roomId !== roomId) return;

      console.log('AimGame received event:', evt); // Uncommented log

      switch (evt.type) {
        case 'spawnTarget':
          setTargets(prev => {
            const newTargets = {
              ...prev,
              [evt.target.id]: evt.target,
            };
            console.log('Targets after spawn:', newTargets); // Added log
            return newTargets;
          });
          break;

        case 'targetRemoved':
          setTargets(prev => {
            const newTargets = { ...prev };
            delete newTargets[evt.target.id];
            console.log('Targets after removal:', newTargets); // Added log
            return newTargets;
          });
          break;

        case 'scoreUpdate':
          setScores(prev => ({
            ...prev,
            [evt.playerId]: parseInt(evt.payload, 10),
          }));
          break;

        case 'gameEnd':
          setGameStatus('ended');
          setFinalScores(evt.payload);
          setTargets({}); // Clear all targets
          console.log('Game ended. Final scores:', evt.payload); // Added log
          break;
        
        default:
          break;
      }
    };

    minigameService.on('gameEvent', handler);
    return () => minigameService.on('gameEvent', null);
  }, [roomId]);

  const handleTargetClick = (targetId) => {
    if (gameStatus !== 'playing') return;

    // Send hit event to the backend. The backend is the source of truth.
    minigameService.handleHit(
      roomId,
      userProfile.id,
      userProfile.username,
      targetId,
      Date.now()
    );
  };

  console.log('Rendering targets:', Object.values(targets).length, targets); // Added log

  return (
    <div className="aim-game-overlay">
      <div className="aim-game-container">
        <div className="aim-game-header">
          <SimplePlayerList scores={scores} players={players} userProfile={userProfile} />
        </div>
        <div
          className="aim-game-area"
          style={{
            width: `${GAME_CONFIG.GAME_AREA_WIDTH}px`,
            height: `${GAME_CONFIG.GAME_AREA_HEIGHT}px`,
          }}
        >
          {gameStatus === 'playing' && Object.values(targets).map(target => (
            <div
              key={target.id}
              className="aim-game-target"
              style={{
                left: `${target.x * (GAME_CONFIG.GAME_AREA_WIDTH - (target.size * 2 * 100))}px`,
                top: `${target.y * (GAME_CONFIG.GAME_AREA_HEIGHT - (target.size * 2 * 100))}px`,
                width: `${target.size * 2 * 100}px`,
                height: `${target.size * 2 * 100}px`,
              }}
              onClick={() => handleTargetClick(target.id)}
            />
          ))}

          {gameStatus === 'ended' && (
            <div className="aim-game-over-screen">
              <h2>Game Over</h2>
              <p>The round has finished!</p>
              {/* The finalScores payload could be displayed here if parsed */}
              <button onClick={onGameEnd} style={{marginTop: '10px'}}>Back to Lobby</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
