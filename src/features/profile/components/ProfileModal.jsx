import React, { useState, useEffect } from 'react';
import { FaUser, FaTimes, FaEdit, FaCamera, FaPalette } from 'react-icons/fa';
import './ProfileModal.css';
import authService from '../../auth/services/authService';
import profileService from '../services/profileService';
import ProfileCustomizer from './ProfileCustomizer';

function ProfileModal({ onClose, onLogout, onProfileUpdate }) {
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [editedData, setEditedData] = useState({
    username: '',
    statusMessage: '',
    profileImage: ''
  });

  useEffect(() => {
    // Supabase에서 유저 프로필 데이터 가져오기
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const profile = await profileService.getCurrentUserProfile();
        setUserData(profile);
        setEditedData({
          username: profile.username || '',
          statusMessage: profile.statusMessage || '',
          profileImage: profile.profileImage || ''
        });
      } catch (error) {
        console.error('프로필 로드 실패:', error);
        // 실패 시 로컬 스토리지에서 가져오기
        const user = authService.getCurrentUser();
        if (user) {
          setUserData(user);
          setEditedData({
            username: user.username || '',
            statusMessage: user.statusMessage || '',
            profileImage: user.profileImage || ''
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);

      // Supabase를 통해 프로필 업데이트
      const updatedProfile = await profileService.updateProfile(userData.id, {
        username: editedData.username,
        statusMessage: editedData.statusMessage,
        profileImage: editedData.profileImage
      });

      // 상태 및 로컬 스토리지 업데이트
      setUserData(updatedProfile);
      localStorage.setItem('user', JSON.stringify(updatedProfile));
      setIsEditing(false);
      alert('프로필이 업데이트되었습니다.');
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      alert('프로필 업데이트에 실패했습니다: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedData({
      username: userData.username || '',
      statusMessage: userData.statusMessage || '',
      profileImage: userData.profileImage || ''
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    if (window.confirm('로그아웃하시겠습니까?')) {
      onLogout();
      onClose();
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setIsLoading(true);

        // Supabase Storage에 이미지 업로드
        const imageUrl = await profileService.uploadProfileImage(userData.id, file);
        setEditedData({ ...editedData, profileImage: imageUrl });

        alert('이미지가 업로드되었습니다.');
      } catch (error) {
        console.error('이미지 업로드 실패:', error);

        // 업로드 실패 시 임시로 FileReader 사용
        const reader = new FileReader();
        reader.onloadend = () => {
          setEditedData({ ...editedData, profileImage: reader.result });
        };
        reader.readAsDataURL(file);

        alert('이미지 업로드에 실패했습니다. 임시로 미리보기만 표시됩니다.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (isLoading && !userData) {
    return (
      <div className="profile-modal-overlay" onClick={onClose}>
        <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
          <div style={{ textAlign: 'center', color: 'white', padding: '40px' }}>
            <p>프로필 로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="profile-close-btn" onClick={onClose}>
          <FaTimes />
        </button>

        <h2 className="profile-modal-title">
          {showCustomizer ? '프로필 커스터마이징' : '프로필'}
        </h2>

        {isLoading && (
          <div className="profile-loading-overlay">
            <p>처리 중...</p>
          </div>
        )}

        {/* 프로필 커스터마이저 표시 */}
        {showCustomizer ? (
          <>
            <ProfileCustomizer
              onUpdate={() => {
                // 프로필 업데이트 후 새로고침
                const fetchProfile = async () => {
                  try {
                    const profile = await profileService.getCurrentUserProfile();
                    setUserData(profile);
                    // 부모 컴포넌트(App.js)에도 알림
                    if (onProfileUpdate) {
                      onProfileUpdate();
                    }
                  } catch (error) {
                    console.error('프로필 새로고침 실패:', error);
                  }
                };
                fetchProfile();
              }}
            />
            <div className="profile-buttons">
              <button
                className="profile-btn cancel-btn"
                onClick={() => setShowCustomizer(false)}
              >
                뒤로
              </button>
            </div>
          </>
        ) : (
          <>

        <div className="profile-content">
          {/* 프로필 이미지 */}
          <div className="profile-image-container">
            {isEditing ? (
              <label className="profile-image-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                {editedData.profileImage ? (
                  <img src={editedData.profileImage} alt="Profile" className="profile-image" />
                ) : (
                  <div className="profile-image-placeholder">
                    <FaUser />
                  </div>
                )}
                <div className="profile-image-overlay">
                  <FaCamera />
                </div>
              </label>
            ) : (
              <>
                {userData.profileImage ? (
                  <img src={userData.profileImage} alt="Profile" className="profile-image" />
                ) : (
                  <div className="profile-image-placeholder">
                    <FaUser />
                  </div>
                )}
              </>
            )}
          </div>

          {/* 프로필 정보 */}
          <div className="profile-info">
            {/* 사용자명 */}
            <div className="profile-field">
              <label className="profile-label">사용자명</label>
              {isEditing ? (
                <input
                  type="text"
                  className="profile-input"
                  value={editedData.username}
                  onChange={(e) => setEditedData({ ...editedData, username: e.target.value })}
                />
              ) : (
                <p className="profile-value">{userData.username}</p>
              )}
            </div>

            {/* 이메일 (읽기 전용) */}
            <div className="profile-field">
              <label className="profile-label">이메일</label>
              <p className="profile-value">{userData.email}</p>
            </div>

            {/* 상태 메시지 */}
            <div className="profile-field">
              <label className="profile-label">상태 메시지</label>
              {isEditing ? (
                <textarea
                  className="profile-textarea"
                  value={editedData.statusMessage}
                  onChange={(e) => setEditedData({ ...editedData, statusMessage: e.target.value })}
                  placeholder="상태 메시지를 입력하세요"
                />
              ) : (
                <p className="profile-value">{userData.statusMessage || '상태 메시지 없음'}</p>
              )}
            </div>

            {/* 레벨 (읽기 전용) */}
            <div className="profile-field">
              <label className="profile-label">레벨</label>
              <p className="profile-value">Lv. {userData.level || 1}</p>
            </div>
          </div>

          {/* 버튼 */}
          <div className="profile-buttons">
            {isEditing ? (
              <>
                <button className="profile-btn save-btn" onClick={handleSave}>
                  저장
                </button>
                <button className="profile-btn cancel-btn" onClick={handleCancel}>
                  취소
                </button>
              </>
            ) : (
              <>
                <button className="profile-btn edit-btn" onClick={handleEdit}>
                  <FaEdit />
                  <span>프로필 수정</span>
                </button>
                <button className="profile-btn customizer-btn" onClick={() => setShowCustomizer(true)}>
                  <FaPalette />
                  <span>프로필 꾸미기</span>
                </button>
                <button className="profile-btn logout-btn" onClick={handleLogout}>
                  로그아웃
                </button>
              </>
            )}
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}

export default ProfileModal;
