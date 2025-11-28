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

  useEffect(() => {
    loadProfileItems();
  }, []);

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
      alert('잠금 해제되지 않은 아이템입니다.');
      return;
    }
    setSelectedProfile(item);
  };

  const handleSelectOutline = (item) => {
    if (!item.isUnlocked) {
      alert('잠금 해제되지 않은 아이템입니다.');
      return;
    }
    setSelectedOutline(item);
  };

  const handleUnlock = async (item) => {
    try {
      await profileItemService.unlockItem(item.id);
      alert(`${item.itemName}을(를) 잠금 해제했습니다!`);
      loadProfileItems(); // 새로고침
    } catch (err) {
      const message = err.response?.data?.message || '잠금 해제에 실패했습니다.';
      alert(message);
    }
  };

  const handleSave = async () => {
    try {
      await profileItemService.selectProfileItems({
        selectedProfileId: selectedProfile?.id || null,
        selectedOutlineId: selectedOutline?.id || null
      });
      alert('프로필이 저장되었습니다!');
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      alert('프로필 저장에 실패했습니다.');
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
  );
}

export default ProfileCustomizer;
