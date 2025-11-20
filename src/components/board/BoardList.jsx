import React, { useState } from 'react';
import PostList from './PostList';
import './BoardList.css';

const BoardList = () => {
  const [selectedBoard, setSelectedBoard] = useState('FREE');

  const boards = [
    { id: 'FREE', name: '자유 게시판', category: 'FREE' },
    { id: 'STRATEGY', name: '공략 게시판', category: 'STRATEGY' },
    { id: 'SUGGESTION', name: '건의 게시판', category: 'SUGGESTION' }
  ];

  return (
    <div className="board-container">
      <div className="board-header">
        <h1>게시판</h1>
        <div className="board-tabs">
          {boards.map(board => (
            <button
              key={board.id}
              className={`board-tab ${selectedBoard === board.id ? 'active' : ''}`}
              onClick={() => setSelectedBoard(board.id)}
            >
              {board.name}
            </button>
          ))}
        </div>
      </div>
      <PostList boardId={selectedBoard} />
    </div>
  );
};

export default BoardList;
