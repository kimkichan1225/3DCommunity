import React, { useState, useEffect } from 'react';
import minigameService from '../../../services/minigameService';
import './OmokGame.css';

const BOARD_SIZE = 15;

const OmokGame = ({ roomId, isHost, userProfile, players = [], onGameEnd }) => {
  const [board, setBoard] = useState(Array(BOARD_SIZE * BOARD_SIZE).fill(null));
  const [currentTurn, setCurrentTurn] = useState(0); // 0 or 1 (플레이어 인덱스)
  const [gameStatus, setGameStatus] = useState('playing'); // playing, ended
  const [winner, setWinner] = useState(null);
  const [moves, setMoves] = useState([]);

  // 플레이어 매칭 헬퍼 함수
  const getMyPlayerIndex = () => {
    if (!userProfile || !players || players.length === 0) return -1;
    
    // 다양한 속성으로 매칭 시도
    let index = players.findIndex(p => p.userId === userProfile.id);
    if (index !== -1) return index;
    
    index = players.findIndex(p => p.userId === userProfile.userId);
    if (index !== -1) return index;
    
    index = players.findIndex(p => p.username === userProfile.username);
    if (index !== -1) return index;
    
    index = players.findIndex(p => String(p.userId) === String(userProfile.id));
    if (index !== -1) return index;
    
    index = players.findIndex(p => String(p.userId) === String(userProfile.userId));
    if (index !== -1) return index;
    
    return -1;
  };

  // 디버깅: props 확인
  useEffect(() => {
    console.log('=== OmokGame Props Debug ===');
    console.log('userProfile:', userProfile);
    console.log('players:', players);
    console.log('roomId:', roomId);
    console.log('isHost:', isHost);
    
    if (players.length > 0) {
      console.log('First player structure:', players[0]);
      console.log('My player index:', getMyPlayerIndex());
    }
  }, [userProfile, players, roomId, isHost]);

  // 게임 이벤트 리스너 (백엔드 통신)
  useEffect(() => {
    const handler = (evt) => {
      if (!evt || !evt.type || evt.roomId !== roomId) return;

      console.log('OmokGame received event:', evt);

      switch (evt.type) {
        case 'omokMove':
          // 오목 움직임 처리
          setBoard(prevBoard => {
            const newBoard = [...prevBoard];
            const playerIndex = players.findIndex(p => p.userId === evt.playerId);
            const playerSymbol = playerIndex === 0 ? 1 : 2;
            newBoard[evt.position] = playerSymbol;

            const row = Math.floor(evt.position / BOARD_SIZE);
            const col = evt.position % BOARD_SIZE;

            if (checkWin(newBoard, row, col, playerSymbol)) {
              setGameStatus('ended');
              setWinner(evt.playerId);
            } else {
              // 다음 차례로
              setCurrentTurn(prev => (prev + 1) % players.length);
            }

            return newBoard;
          });

          setMoves(prev => [...prev, evt.position]);
          break;

        case 'gameEnd':
          setGameStatus('ended');
          setWinner(evt.winnerId);
          break;

        default:
          break;
      }
    };

    minigameService.on('gameEvent', handler);

    // Mount 시 현재 게임 상태 요청 (중간 입장/새로고침 대비)
    minigameService.requestGameState(roomId);

    return () => minigameService.off('gameEvent', handler);
  }, [roomId, players]);

  // 인접한 5개 돌 확인 (오목 판정)
  const checkWin = (newBoard, row, col, player) => {
    const directions = [
      [0, 1], // 가로
      [1, 0], // 세로
      [1, 1], // 대각선 \
      [1, -1], // 대각선 /
    ];

    for (let [dx, dy] of directions) {
      let count = 1;

      // 양방향 확인
      for (let i = 1; i < 5; i++) {
        const nr = row + dx * i;
        const nc = col + dy * i;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
          if (newBoard[nr * BOARD_SIZE + nc] === player) {
            count++;
          } else {
            break;
          }
        } else {
          break;
        }
      }

      for (let i = 1; i < 5; i++) {
        const nr = row - dx * i;
        const nc = col - dy * i;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
          if (newBoard[nr * BOARD_SIZE + nc] === player) {
            count++;
          } else {
            break;
          }
        } else {
          break;
        }
      }

      if (count >= 5) {
        return true;
      }
    }
    return false;
  };

  const handleBoardClick = (index) => {
    if (gameStatus !== 'playing') return;

    const myPlayerIndex = getMyPlayerIndex();
    if (currentTurn !== myPlayerIndex) {
      console.log('Not your turn');
      return;
    }

    if (board[index] !== null) {
      console.log('Cell already occupied');
      return;
    }

    // 백엔드에 이벤트 전송. 백엔드가 진실의 근원(source of truth)
    minigameService.sendGameEvent(roomId, {
      type: 'omokMove',
      position: index,
      playerId: userProfile.id,
      playerName: userProfile.username
    });
  };

  const resetGame = () => {
    setBoard(Array(BOARD_SIZE * BOARD_SIZE).fill(null));
    setMoves([]);
    setGameStatus('playing');
    setWinner(null);
    setCurrentTurn(0);
  };

  const myPlayerIndex = getMyPlayerIndex();
  const isMyTurn = currentTurn === myPlayerIndex;
  const currentPlayerName = players[currentTurn]?.username || '';
  const winnerName = players.find(p => p.userId === winner)?.username;

  return (
    <div className="omok-game-wrapper">
      <div className="omok-game-header">
        <div className="omok-player-info">
          <div className="omok-player-1">
            <span className="omok-player-name">{players[0]?.username}</span>
            <span className="omok-player-symbol black">●</span>
          </div>
          <span className="omok-vs">vs</span>
          <div className="omok-player-2">
            <span className="omok-player-symbol white">○</span>
            <span className="omok-player-name">{players[1]?.username}</span>
          </div>
        </div>
        {gameStatus === 'playing' && (
          <div className={`omok-turn-indicator ${isMyTurn ? 'active' : ''}`}>
            {isMyTurn ? '🎮 당신의 차례' : '⏳ 상대방 차례'}
          </div>
        )}
      </div>

      <div className="omok-board-container">
        <div className="omok-board">
          {board.map((cell, index) => {
            const row = Math.floor(index / BOARD_SIZE);
            const col = index % BOARD_SIZE;
            const isEdge = row === 0 || row === BOARD_SIZE - 1 || col === 0 || col === BOARD_SIZE - 1;

            return (
              <div
                key={index}
                className={`omok-cell ${cell === 1 ? 'black' : ''} ${cell === 2 ? 'white' : ''} ${
                  isEdge ? 'edge' : ''
                }`}
                onClick={() => handleBoardClick(index)}
              >
                {cell === 1 && <div className="omok-stone black-stone">●</div>}
                {cell === 2 && <div className="omok-stone white-stone">○</div>}
              </div>
            );
          })}
        </div>
      </div>

      {gameStatus === 'ended' && (
        <div className="omok-result-modal">
          <div className="omok-result-content">
            <h2>🎉 게임 종료!</h2>
            {winner ? (
              <>
                <p className="omok-winner">
                  <span className="winner-icon">👑</span>
                  {winnerName} 승리!
                </p>
              </>
            ) : (
              <p>무승부</p>
            )}
            <div className="omok-result-actions">
              <button className="btn-reset" onClick={resetGame}>
                다시 하기
              </button>
              <button className="btn-back" onClick={onGameEnd}>
                로비로
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OmokGame;
