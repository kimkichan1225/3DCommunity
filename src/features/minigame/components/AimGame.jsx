import React, { useEffect, useState, useRef } from 'react';
import minigameService from '../../../services/minigameService';
import './AimGame.css';

export default function AimGame({ roomId }) {
  const [targets, setTargets] = useState({});
  const [scores, setScores] = useState({});
  const [myScore, setMyScore] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const handler = (evt) => {
      if (!evt || !evt.type) return;
      if (evt.type === 'spawnTarget' && evt.target) {
        setTargets((t) => ({ ...t, [evt.target.id]: evt.target }));
      } else if (evt.type === 'targetRemoved' && evt.target) {
        setTargets((t) => {
          const copy = { ...t };
          delete copy[evt.target.id];
          return copy;
        });
      } else if (evt.type === 'scoreUpdate') {
        setScores((s) => ({ ...s, [evt.playerId]: parseInt(evt.payload || '0') }));
        if (evt.playerId === minigameService.userId) {
          setMyScore(parseInt(evt.payload || '0'));
        }
      } else if (evt.type === 'gameStart') {
        setTargets({});
        setScores({});
        setMyScore(0);
      } else if (evt.type === 'gameEnd') {
        // show final results (payload is stringified map)
        console.log('Game ended:', evt.payload);
      }
    };

    minigameService.on('gameEvent', handler);

    return () => {
      mountedRef.current = false;
      // unregister by setting to null if needed
      minigameService.on('gameEvent', null);
    };
  }, [roomId]);

  const handleTargetClick = (target) => {
    if (!roomId || !target) return;

    // optimistic removal for UX
    setTargets((t) => {
      const copy = { ...t };
      delete copy[target.id];
      return copy;
    });

    minigameService.sendGameEvent(roomId, {
      type: 'hit',
      target: { id: target.id }
    });
  };

  return (
    <div className="aimgame-overlay">
      <div className="aimgame-topbar">
        <div className="aimgame-score">내 점수: {myScore}</div>
        <div className="aimgame-scores">
          {Object.entries(scores).map(([pid, sc]) => (
            <div key={pid} className="score-item">{pid}: {sc}</div>
          ))}
        </div>
      </div>

      {/* crosshair center */}
      <div className="aimgame-crosshair">+</div>

      {/* targets */}
      {Object.values(targets).map((t) => {
        const left = `${Math.max(0, Math.min(100, t.x * 100))}%`;
        const top = `${Math.max(0, Math.min(100, t.y * 100))}%`;
        const sizeVw = Math.max(2, Math.min(18, t.size * 100));
        return (
          <div
            key={t.id}
            className="aimgame-target"
            onClick={() => handleTargetClick(t)}
            style={{ left, top, width: `${sizeVw}vmin`, height: `${sizeVw}vmin`, marginLeft: `-${sizeVw/2}vmin`, marginTop: `-${sizeVw/2}vmin` }}
          >
            <div className="target-inner" />
          </div>
        );
      })}
    </div>
  );
}
