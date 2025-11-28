import React, { useState, useEffect } from 'react';
import './ProfileCustomizer.css';
import profileItemService from '../services/profileItemService';
import ProfileAvatar from '../../../components/ProfileAvatar';

function ProfileCustomizer({ onUpdate }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'outline'
  const [profileItems, setProfileItems] = useState([]);
  const [outlineItems, setOutlineItems] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedOutline, setSelectedOutline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null); // { message, type: 'success' | 'error' | 'warning' }

  useEffect(() => {
    loadProfileItems();
  }, []);

  // 팝업 알림 표시 함수
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 2000); // 2초 후 자동 닫힘
  };

  const loadProfileItems = async () => {
    try {
      setLoading(true);
      const items = await profileItemService.getUserProfileItems();

      const profiles = items.filter(item => item.itemType === 'PROFILE');
      const outlines = items.filter(item => item.itemType === 'OUTLINE');

      setProfileItems(profiles);
      setOutlineItems(outlines);

      // 현재 선택된 아이템 설정
      const currentProfile = profiles.find(item => item.isSelected);
      const currentOutline = outlines.find(item => item.isSelected);

      setSelectedProfile(currentProfile);
      setSelectedOutline(currentOutline);

      setLoading(false);
    } catch (err) {
      console.error('Failed to load profile items:', err);
      setError('프로필 아이템을 불러오는데 실패했습니다.');
      setLoading(false);
    }
  };

  const handleSelectProfile = (item) => {
    if (!item.isUnlocked) {
      showNotification('잠금 해제되지 않은 아이템입니다.', 'warning');
      return;
    }
    setSelectedProfile(item);
  };

  const handleSelectOutline = (item) => {
    if (!item.isUnlocked) {
      showNotification('잠금 해제되지 않은 아이템입니다.', 'warning');
      return;
    }
    setSelectedOutline(item);
  };

  const handleUnlock = async (item) => {
    try {
      await profileItemService.unlockItem(item.id);
      showNotification(`${item.itemName}을(를) 잠금 해제했습니다!`, 'success');
      loadProfileItems(); // 새로고침
    } catch (err) {
      const message = err.response?.data?.message || '잠금 해제에 실패했습니다.';
      showNotification(message, 'error');
    }
  };

  const handleSave = async () => {
    try {
      await profileItemService.selectProfileItems({
        selectedProfileId: selectedProfile?.id || null,
        selectedOutlineId: selectedOutline?.id || null
      });
      showNotification('프로필이 저장되었습니다!', 'success');
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      showNotification('프로필 저장에 실패했습니다.', 'error');
    }
  };

  if (loading) {
    return <div className="profile-customizer-loading">로딩 중...</div>;
  }

  if (error) {
    return <div className="profile-customizer-error">{error}</div>;
  }

  const currentItems = activeTab === 'profile' ? profileItems : outlineItems;

  return (
    <>
      {/* 팝업 알림 */}
      {notification && (
        <>
          <div className="notification-backdrop" />
          <div className={`notification-popup ${notification.type}`}>
            {notification.message}
          </div>
        </>
      )}

      <div className="profile-customizer">
        {/* 미리보기 */}
        <div className="profile-preview">
        <h3>미리보기</h3>
        <ProfileAvatar
          profileImage={selectedProfile}
          outlineImage={selectedOutline}
          size={150}
        />
      </div>

      {/* 탭 선택 */}
      <div className="customizer-tabs">
        <button
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          프로필 이미지
        </button>
        <button
          className={`tab-button ${activeTab === 'outline' ? 'active' : ''}`}
          onClick={() => setActiveTab('outline')}
        >
          테두리
        </button>
      </div>

      {/* 아이템 그리드 */}
      <div className="items-grid">
        {currentItems.map((item) => (
          <div
            key={item.id}
            className={`item-card ${
              item.isUnlocked ? 'unlocked' : 'locked'
            } ${
              (activeTab === 'profile' && selectedProfile?.id === item.id) ||
              (activeTab === 'outline' && selectedOutline?.id === item.id)
                ? 'selected'
                : ''
            }`}
            onClick={() =>
              activeTab === 'profile'
                ? handleSelectProfile(item)
                : handleSelectOutline(item)
            }
          >
            {/* 아이템 이미지 */}
            <div className="item-image-wrapper">
              <img
                src={item.imagePath}
                alt={item.itemName}
                className={`item-image ${!item.isUnlocked ? 'grayscale' : ''}`}
              />
              {!item.isUnlocked && <div className="lock-overlay">🔒</div>}
            </div>

            {/* 아이템 정보 */}
            <div className="item-info">
              <div className="item-name">{item.itemName}</div>
              {!item.isUnlocked && item.unlockConditionValue && (
                <div className="unlock-condition">
                  {JSON.parse(item.unlockConditionValue).description}
                </div>
              )}
            </div>

            {/* 잠금 해제 버튼 */}
            {!item.isUnlocked && !item.isDefault && (
              <button
                className="unlock-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnlock(item);
                }}
              >
                잠금 해제 시도
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 저장 버튼 */}
      <div className="customizer-actions">
        <button className="save-button" onClick={handleSave}>
          프로필 저장
        </button>
      </div>
    </div>
    </>
  );
}

export default ProfileCustomizer;
