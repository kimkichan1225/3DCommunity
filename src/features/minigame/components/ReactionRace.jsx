import React, { useEffect, useState } from 'react';
import minigameService from '../../../services/minigameService';
import './ReactionRace.css';

export default function ReactionRace({ roomId, isHost, userProfile, players }) {
  const [phase, setPhase] = useState('idle'); // idle, prepare, go, ended
  const [message, setMessage] = useState('');
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    const handler = (evt) => {
      if (!evt || !evt.type || evt.roomId !== roomId) return;
      
      switch(evt.type) {
        case 'reactionPrepare':
          setPhase('prepare');
          setMessage('Get Ready...');
          setWinner(null);
          break;
        case 'reactionGo':
          setPhase('go');
          setMessage('GO! Click now!');
          break;
        case 'reactionResult':
        case 'reactionEnd':
          setPhase('ended');
          setWinner(evt.playerName || evt.payload || 'N/A');
          setMessage(evt.playerName ? `${evt.playerName} won!` : 'Round over!');
          break;
        default:
          break;
      }
    };

    minigameService.on('gameEvent', handler);
    return () => minigameService.on('gameEvent', null);
  }, [roomId]);

  const sendStart = () => {
    if (isHost) {
      minigameService.sendGameEvent(roomId, { type: 'reactionStart' });
    }
  };

  const sendHit = () => {
    if (phase !== 'go') return;
    minigameService.sendGameEvent(roomId, { type: 'reactionHit' });
  };

  return (
    <div className="reaction-overlay" onClick={sendHit}>
      <div className="reaction-box">
        <div className="reaction-message">{message || 'Reaction Race'}</div>
        
        {phase === 'idle' && isHost && (
          <button className="reaction-start" onClick={sendStart}>Start Round</button>
        )}

        {phase === 'idle' && !isHost && (
          <div className="reaction-wait">Waiting for host to start the round...</div>
        )}

        {phase === 'ended' && (
            <div className="reaction-winner">Winner: {winner}</div>
        )}

        {/* Display players and scores if available */}
        <div className="aim-game-players" style={{marginTop: '20px'}}>
            {players.map(p => (
                <div key={p.userId} className={`player-score ${p.userId === userProfile.id ? 'self' : ''}`}>
                <span className="player-name">{p.username}</span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
