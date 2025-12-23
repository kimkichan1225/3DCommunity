import React, { useState, useEffect } from 'react';
import profileService from '../features/profile/services/profileService';
import ProfileAvatar from './ProfileAvatar';
import './OtherPlayerProfileModal.css';

const OtherPlayerProfileModal = ({ userId, username, onClose, onAddFriend }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await profileService.getUserProfile(userId);
        setProfile(data);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError('프로필을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleAddFriendClick = () => {
    if (profile) {
      onAddFriend({ userId: profile.id, username: profile.nickname });
    }
  };

  return (
    <div className="other-player-profile-modal-overlay" onClick={onClose}>
      <div className="other-player-profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          ×
        </button>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>프로필 로딩 중...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button className="retry-button" onClick={() => window.location.reload()}>
              다시 시도
            </button>
          </div>
        ) : profile ? (
          <>
            <div className="profile-header">
              <h2>프로필</h2>
            </div>

            <div className="profile-content">
              {/* 아바타 */}
              <div className="avatar-section">
                <ProfileAvatar
                  profileImage={{ imagePath: profile.selectedProfile }}
                  outlineImage={{ imagePath: profile.selectedOutline }}
                  size={150}
                />
              </div>

              {/* 사용자 정보 */}
              <div className="user-info-section">
                <div className="info-item">
                  <span className="info-label">사용자명</span>
                  <span className="info-value">{profile.nickname || username}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">레벨</span>
                  <span className="info-value level">Lv. {profile.level || 1}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">상태 메시지</span>
                  <span className="info-value status-message">
                    {profile.statusMessage || '상태 메시지가 없습니다.'}
                  </span>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="action-buttons">
                <button className="add-friend-button" onClick={handleAddFriendClick}>
                  <span className="button-icon">➕</span>
                  친구 추가
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default OtherPlayerProfileModal;
