import React, { useState, useEffect } from 'react';
import PostList from './PostList';
import boardService from '../../services/boardService';
import './BoardList.css';

const BoardList = () => {
  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      setLoading(true);
      const data = await boardService.getBoards();
      setBoards(data);
      if (data.length > 0) {
        setSelectedBoard(data[0]);
      }
    } catch (err) {
      console.error('게시판 로드 실패:', err);
      setError('게시판을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="board-container"><p>로딩 중...</p></div>;
  }

  if (error) {
    return <div className="board-container"><p className="error">{error}</p></div>;
  }

  if (boards.length === 0) {
    return (
      <div className="board-container">
        <p>등록된 게시판이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="board-container">
      <div className="board-header">
        <h1>게시판</h1>
        <div className="board-tabs">
          {boards.map(board => (
            <button
              key={board.id}
              className={`board-tab ${selectedBoard?.id === board.id ? 'active' : ''}`}
              onClick={() => setSelectedBoard(board)}
            >
              {board.name}
            </button>
          ))}
        </div>
      </div>
      {selectedBoard && <PostList boardId={selectedBoard.id} />}
    </div>
  );
};

export default BoardList;
