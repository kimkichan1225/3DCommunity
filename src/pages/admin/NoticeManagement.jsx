import React, { useEffect, useState } from 'react';
import './NoticeManagement.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const NoticeManagement = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isPinned: false,
    priority: 0,
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/notices`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotices(data.content || []);
      } else {
        console.error('Failed to fetch notices');
      }
    } catch (error) {
      console.error('Error fetching notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const url = editingNotice
        ? `${API_URL}/api/admin/notices/${editingNotice.id}`
        : `${API_URL}/api/admin/notices`;

      const response = await fetch(url, {
        method: editingNotice ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(editingNotice ? '공지사항이 수정되었습니다.' : '공지사항이 작성되었습니다.');
        setShowForm(false);
        setEditingNotice(null);
        setFormData({ title: '', content: '', isPinned: false, priority: 0 });
        fetchNotices();
      } else {
        alert('작업에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error submitting notice:', error);
      alert('오류가 발생했습니다.');
    }
  };

  const handleEdit = (notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      isPinned: notice.isPinned,
      priority: notice.priority,
    });
    setShowForm(true);
  };

  const handleDelete = async (noticeId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
<<<<<<< HEAD
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
=======
>>>>>>> kim
      const response = await fetch(`${API_URL}/api/admin/notices/${noticeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('공지사항이 삭제되었습니다.');
        fetchNotices();
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting notice:', error);
      alert('오류가 발생했습니다.');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingNotice(null);
    setFormData({ title: '', content: '', isPinned: false, priority: 0 });
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="notice-management">
      <div className="header">
        <h2>공지사항 관리</h2>
        {!showForm && (
          <button className="btn-create" onClick={() => setShowForm(true)}>
            새 공지사항 작성
          </button>
        )}
      </div>

      {showForm ? (
        <div className="notice-form">
          <h3>{editingNotice ? '공지사항 수정' : '새 공지사항 작성'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>제목</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                maxLength={200}
              />
            </div>

            <div className="form-group">
              <label>내용</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                rows={10}
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                />
                고정 공지
              </label>
            </div>

            <div className="form-group">
              <label>우선순위 (높을수록 상단 표시)</label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                min={0}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit">
                {editingNotice ? '수정' : '작성'}
              </button>
              <button type="button" className="btn-cancel" onClick={handleCancel}>
                취소
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="notice-list">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>제목</th>
                <th>작성자</th>
                <th>고정</th>
                <th>우선순위</th>
                <th>조회수</th>
                <th>작성일</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {notices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty">
                    공지사항이 없습니다.
                  </td>
                </tr>
              ) : (
                notices.map((notice) => (
                  <tr key={notice.id}>
                    <td>{notice.id}</td>
                    <td className="title">{notice.title}</td>
                    <td>{notice.authorName}</td>
                    <td>{notice.isPinned ? '📌' : '-'}</td>
                    <td>{notice.priority}</td>
                    <td>{notice.viewCount}</td>
                    <td>{new Date(notice.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn-edit" onClick={() => handleEdit(notice)}>
                        수정
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(notice.id)}>
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

export default NoticeManagement;

