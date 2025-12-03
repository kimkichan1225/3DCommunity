import React, { useEffect, useState } from 'react';
import './BoardManagement.css';

const BoardManagement = () => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'FREE',
    isActive: true,
    orderIndex: 0,
  });

  const categories = [
    { value: 'FREE', label: '자유 게시판' },
    { value: 'NOTICE', label: '공지사항' },
    { value: 'STRATEGY', label: '공략 게시판' },
    { value: 'SUGGESTION', label: '건의 게시판' },
  ];

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/admin/boards', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBoards(data || []);
      } else {
        console.error('Failed to fetch boards');
      }
    } catch (error) {
      console.error('Error fetching boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const url = editingBoard
        ? `http://localhost:8080/api/admin/boards/${editingBoard.id}`
        : 'http://localhost:8080/api/admin/boards';

      const response = await fetch(url, {
        method: editingBoard ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(editingBoard ? '게시판이 수정되었습니다.' : '게시판이 생성되었습니다.');
        setShowForm(false);
        setEditingBoard(null);
        setFormData({ name: '', description: '', category: 'FREE', isActive: true, orderIndex: 0 });
        fetchBoards();
      } else {
        const errorMsg = await response.text();
        alert('작업에 실패했습니다: ' + errorMsg);
      }
    } catch (error) {
      console.error('Error submitting board:', error);
      alert('오류가 발생했습니다.');
    }
  };

  const handleEdit = (board) => {
    setEditingBoard(board);
    setFormData({
      name: board.name,
      description: board.description || '',
      category: board.category,
      isActive: board.isActive,
      orderIndex: board.orderIndex,
    });
    setShowForm(true);
  };

  const handleDelete = async (boardId) => {
    if (!window.confirm('정말 삭제하시겠습니까? 게시글이 있는 게시판은 삭제할 수 없습니다.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/admin/boards/${boardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('게시판이 삭제되었습니다.');
        fetchBoards();
      } else {
        const errorMsg = await response.text();
        alert('삭제에 실패했습니다: ' + errorMsg);
      }
    } catch (error) {
      console.error('Error deleting board:', error);
      alert('오류가 발생했습니다.');
    }
  };

  const handleToggleStatus = async (boardId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/admin/boards/${boardId}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchBoards();
      } else {
        alert('상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('오류가 발생했습니다.');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBoard(null);
    setFormData({ name: '', description: '', category: 'FREE', isActive: true, orderIndex: 0 });
  };

  const getCategoryLabel = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="board-management">
      <div className="header">
        <h2>게시판 관리</h2>
        {!showForm && (
          <button className="btn-create" onClick={() => setShowForm(true)}>
            새 게시판 생성
          </button>
        )}
      </div>

      {showForm ? (
        <div className="board-form">
          <h3>{editingBoard ? '게시판 수정' : '새 게시판 생성'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>게시판 이름</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                maxLength={50}
                placeholder="예: 자유 게시판"
              />
            </div>

            <div className="form-group">
              <label>설명</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="게시판 설명을 입력하세요"
              />
            </div>

            <div className="form-group">
              <label>카테고리</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>정렬 순서 (낮을수록 먼저 표시)</label>
              <input
                type="number"
                value={formData.orderIndex}
                onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) })}
                min={0}
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                활성화
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit">
                {editingBoard ? '수정' : '생성'}
              </button>
              <button type="button" className="btn-cancel" onClick={handleCancel}>
                취소
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="board-list">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>게시판 이름</th>
                <th>카테고리</th>
                <th>전체 게시글</th>
                <th>일반</th>
                <th>❓질문</th>
                <th>🖼️짤</th>
                <th>🎬영상</th>
                <th>정렬 순서</th>
                <th>상태</th>
                <th>생성일</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {boards.length === 0 ? (
                <tr>
                  <td colSpan="12" className="empty">
                    게시판이 없습니다.
                  </td>
                </tr>
              ) : (
                boards.map((board) => (
                  <tr key={board.id} className={!board.isActive ? 'inactive' : ''}>
                    <td>{board.id}</td>
                    <td className="name">{board.name}</td>
                    <td>{getCategoryLabel(board.category)}</td>
                    <td><strong>{board.postCount || 0}</strong></td>
                    <td>{board.generalCount || 0}</td>
                    <td>{board.questionCount || 0}</td>
                    <td>{board.imageCount || 0}</td>
                    <td>{board.videoCount || 0}</td>
                    <td>{board.orderIndex}</td>
                    <td>
                      <button
                        className={`status-badge ${board.isActive ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleStatus(board.id)}
                        title="클릭하여 상태 변경"
                      >
                        {board.isActive ? '활성' : '비활성'}
                      </button>
                    </td>
                    <td>{new Date(board.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn-edit" onClick={() => handleEdit(board)}>
                        수정
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(board.id)}>
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BoardManagement;
