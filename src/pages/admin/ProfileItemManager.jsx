import React, { useState, useEffect } from 'react';
import './ProfileItemManager.css';
import adminProfileService from '../../services/adminProfileService';
import ItemFormModal from './ItemFormModal';
import ProfileAvatar from '../../components/ProfileAvatar';

function ProfileItemManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'PROFILE', 'OUTLINE'

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await adminProfileService.getAllProfileItems();
      setItems(data);
    } catch (error) {
      alert('아이템 목록을 불러오는데 실패했습니다.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setShowFormModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowFormModal(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`"${item.itemName}"을(를) 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await adminProfileService.deleteProfileItem(item.id);
      alert('아이템이 삭제되었습니다.');
      loadItems();
    } catch (error) {
      const message = error.response?.data?.message || '아이템 삭제에 실패했습니다.';
      alert(message);
    }
  };

  const handleFormSuccess = () => {
    setShowFormModal(false);
    setEditingItem(null);
    loadItems();
  };

  const handleGrantDefaultItems = async () => {
    if (!window.confirm('모든 사용자에게 기본 아이템을 지급하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      const message = await adminProfileService.grantDefaultItemsToAllUsers();
      alert(message);
    } catch (error) {
      const message = error.response?.data?.message || '기본 아이템 지급에 실패했습니다.';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    if (filterType === 'ALL') return true;
    return item.itemType === filterType;
  });

  const profileCount = items.filter(i => i.itemType === 'PROFILE').length;
  const outlineCount = items.filter(i => i.itemType === 'OUTLINE').length;
  const defaultCount = items.filter(i => i.isDefault).length;

  if (loading) {
    return (
      <div className="profile-item-manager">
        <div className="loading-message">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="profile-item-manager">
      <div className="manager-header">
        <h1>프로필 아이템 관리</h1>
        <div className="header-actions">
          <button className="grant-btn" onClick={handleGrantDefaultItems}>
            🎁 기본 아이템 지급
          </button>
          <button className="create-btn" onClick={handleCreate}>
            + 새 아이템 추가
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">전체 아이템</div>
          <div className="stat-value">{items.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">프로필 이미지</div>
          <div className="stat-value">{profileCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">테두리</div>
          <div className="stat-value">{outlineCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">기본 제공</div>
          <div className="stat-value">{defaultCount}</div>
        </div>
      </div>

      {/* 필터 */}
      <div className="filter-bar">
        <button
          className={`filter-btn ${filterType === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilterType('ALL')}
        >
          전체
        </button>
        <button
          className={`filter-btn ${filterType === 'PROFILE' ? 'active' : ''}`}
          onClick={() => setFilterType('PROFILE')}
        >
          프로필 이미지
        </button>
        <button
          className={`filter-btn ${filterType === 'OUTLINE' ? 'active' : ''}`}
          onClick={() => setFilterType('OUTLINE')}
        >
          테두리
        </button>
      </div>

      {/* 아이템 테이블 */}
      <div className="items-table-container">
        <table className="items-table">
          <thead>
            <tr>
              <th>미리보기</th>
              <th>ID</th>
              <th>코드</th>
              <th>이름</th>
              <th>타입</th>
              <th>기본 제공</th>
              <th>잠금 조건</th>
              <th>순서</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id}>
                <td>
                  <img
                    src={item.imagePath}
                    alt={item.itemName}
                    className="item-preview"
                  />
                </td>
                <td>{item.id}</td>
                <td><code>{item.itemCode}</code></td>
                <td>{item.itemName}</td>
                <td>
                  <span className={`type-badge ${item.itemType.toLowerCase()}`}>
                    {item.itemType === 'PROFILE' ? '프로필' : '테두리'}
                  </span>
                </td>
                <td>
                  {item.isDefault ? (
                    <span className="badge-success">✓</span>
                  ) : (
                    <span className="badge-secondary">-</span>
                  )}
                </td>
                <td>
                  {item.unlockConditionType === 'NONE' ? (
                    <span className="condition-none">없음</span>
                  ) : (
                    <div className="condition-info">
                      <div className="condition-type">{item.unlockConditionType}</div>
                      {item.unlockConditionValue && (
                        <div className="condition-value">
                          {JSON.parse(item.unlockConditionValue).description}
                        </div>
                      )}
                    </div>
                  )}
                </td>
                <td>{item.displayOrder}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="edit-action-btn"
                      onClick={() => handleEdit(item)}
                      title="수정"
                    >
                      ✏️
                    </button>
                    <button
                      className="delete-action-btn"
                      onClick={() => handleDelete(item)}
                      title="삭제"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredItems.length === 0 && (
          <div className="empty-message">
            표시할 아이템이 없습니다.
          </div>
        )}
      </div>

      {/* 아이템 추가/수정 모달 */}
      {showFormModal && (
        <ItemFormModal
          item={editingItem}
          onClose={() => {
            setShowFormModal(false);
            setEditingItem(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}

export default ProfileItemManager;
