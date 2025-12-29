import React, { useEffect, useState } from 'react';
import minigameService from '../../../services/minigameService';
import './ReactionRace.css';

export default function ReactionRace({ roomId, isHost = false, onStartGame }) {
  const [phase, setPhase] = useState('idle'); // idle, prepare, go, ended
  const [message, setMessage] = useState('');
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    const handler = (evt) => {
      if (!evt || !evt.type) return;
      if (evt.type === 'reactionPrepare') {
        console.log('reactionPrepare received');
        setPhase('prepare');
        setMessage('Get Ready...');
        setWinner(null);
      } else if (evt.type === 'reactionGo') {
        console.log('reactionGo received');
        setPhase('go');
        setMessage('GO! Click now!');
      } else if (evt.type === 'reactionResult' || evt.type === 'reactionEnd') {
        console.log('reaction end/result received', evt);
        setPhase('ended');
        setWinner(evt.playerName || evt.payload || null);
        setMessage(evt.playerName ? `${evt.playerName} won!` : 'No winner');
      }
    };

    minigameService.on('gameEvent', handler);
    return () => minigameService.on('gameEvent', null);
  }, [roomId]);

  // This function is no longer the primary action for the host, 
  // but is kept in case the reaction game logic is used elsewhere.
  const sendStart = (immediate = true) => {
    // Prevent double start and show immediate prepare feedback
    setPhase('prepare');
    setMessage('Get Ready...');
    const payload = immediate ? 'immediate' : null;
    minigameService.sendGameEvent(roomId, { type: 'reactionStart', payload });
    console.log('reactionStart sent (immediate=', immediate, ')');
  };

  const sendHit = () => {
    if (phase !== 'go') return;
    minigameService.sendGameEvent(roomId, { type: 'reactionHit' });
  };

  const handleStartClick = (e) => {
    e.stopPropagation();
    if (onStartGame) {
      onStartGame();
    }
  };

  return (
    <div className="reaction-overlay" onClick={sendHit}>
      <div className="reaction-box">
        <div className="reaction-message">{message || 'Waiting...'}</div>
        {phase === 'idle' && isHost && (
          <button className="reaction-start" onClick={handleStartClick}>Start Aiming Game</button>
        )}
        {phase === 'idle' && !isHost && (
          <div className="reaction-wait">Waiting for host to start</div>
        )}
        {winner && <div className="reaction-winner">Winner: {winner}</div>}
      </div>
    </div>
  );
}
