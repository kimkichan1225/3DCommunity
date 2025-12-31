import React, { useState, useEffect } from 'react';
import { FaUser, FaTimes, FaEdit, FaCamera, FaPalette } from 'react-icons/fa';
import './ProfileModal.css';
import authService from '../../auth/services/authService';
import profileService from '../services/profileService';
import ProfileCustomizer from './ProfileCustomizer';
import ProfileAvatar from '../../../components/ProfileAvatar';

function ProfileModal({ onClose, onLogout, onProfileUpdate }) {
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [editedData, setEditedData] = useState({
    username: '',
    statusMessage: ''
  });
  const [usernameError, setUsernameError] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [popup, setPopup] = useState(null); // { message, type: 'success' | 'error' }

  useEffect(() => {
    // Supabase에서 유저 프로필 데이터 가져오기
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const profile = await profileService.getCurrentUserProfile();
        setUserData(profile);
        setEditedData({
          username: profile.username || '',
          statusMessage: profile.statusMessage || ''
        });
      } catch (error) {
        console.error('프로필 로드 실패:', error);
        // 실패 시 로컬 스토리지에서 가져오기
        const user = authService.getCurrentUser();
        if (user) {
          setUserData(user);
          setEditedData({
            username: user.username || '',
            statusMessage: user.statusMessage || ''
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
    setUsernameError('');
  };

  // 사용자명 변경 핸들러 (중복 확인 포함)
  const handleUsernameChange = async (newUsername) => {
    setEditedData({ ...editedData, username: newUsername });
    setUsernameError('');

    // 원래 사용자명과 같으면 중복 확인 안함
    if (newUsername === userData.username) {
      return;
    }

    // 빈 값이면 중복 확인 안함
    if (!newUsername.trim()) {
      return;
    }

    // 중복 확인
    try {
      setIsCheckingUsername(true);
      const result = await authService.checkUsername(newUsername);
      if (!result.available) {
        setUsernameError('이미 사용 중인 닉네임입니다.');
      }
    } catch (error) {
      console.error('닉네임 중복 확인 실패:', error);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleSave = async () => {
    // 닉네임 중복 확인 에러가 있으면 저장 불가
    if (usernameError) {
      setPopup({ message: '닉네임 중복을 확인해주세요.', type: 'error' });
      return;
    }

    // 닉네임이 비어있으면 저장 불가
    if (!editedData.username.trim()) {
      setPopup({ message: '닉네임을 입력해주세요.', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);

      // 프로필 업데이트 (username, statusMessage 전송)
      const updatedProfile = await profileService.updateProfile(userData.id, {
        username: editedData.username,
        statusMessage: editedData.statusMessage
      });

      // 전체 프로필 데이터 새로고침
      const fullProfile = await profileService.getCurrentUserProfile();

      // 상태 및 로컬 스토리지 업데이트
      setUserData(fullProfile);
      localStorage.setItem('user', JSON.stringify(fullProfile));
      setIsEditing(false);

      // 부모 컴포넌트(App.js)에 프로필 업데이트 알림
      if (onProfileUpdate) {
        onProfileUpdate(fullProfile);
      }

      setPopup({ message: '프로필이 업데이트되었습니다.', type: 'success' });
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      const errorMessage = error.response?.data?.message || error.message;
      setPopup({ message: '프로필 업데이트에 실패했습니다: ' + errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedData({
      username: userData.username || '',
      statusMessage: userData.statusMessage || ''
    });
    setUsernameError('');
    setIsEditing(false);
  };

  const handleLogout = () => {
    if (window.confirm('로그아웃하시겠습니까?')) {
      onLogout();
      onClose();
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
          {/* 프로필 이미지 - 커스터마이징한 프로필 표시 */}
          <div
            className="profile-image-container clickable"
            onClick={() => !isEditing && setShowCustomizer(true)}
            title="클릭하여 프로필 꾸미기"
          >
            <ProfileAvatar
              profileImage={userData.selectedProfile}
              outlineImage={userData.selectedOutline}
              size={150}
            />
            {!isEditing && (
              <div className="profile-customizer-overlay">
                <FaPalette />
                <span>프로필 꾸미기</span>
              </div>
            )}
          </div>

          {/* 프로필 정보 */}
          <div className="profile-info">
            {/* 사용자명 */}
            <div className="profile-field">
              <label className="profile-label">사용자명</label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    className="profile-input"
                    value={editedData.username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="사용자명을 입력하세요"
                  />
                  {isCheckingUsername && (
                    <p style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                      중복 확인 중...
                    </p>
                  )}
                  {usernameError && (
                    <p style={{ fontSize: '12px', color: '#ff4444', marginTop: '4px' }}>
                      {usernameError}
                    </p>
                  )}
                  {!usernameError && editedData.username && editedData.username !== userData.username && !isCheckingUsername && (
                    <p style={{ fontSize: '12px', color: '#4CAF50', marginTop: '4px' }}>
                      사용 가능한 닉네임입니다.
                    </p>
                  )}
                </div>
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

      {/* 팝업 메시지 */}
      {popup && (
        <div className="profile-popup-overlay" onClick={() => setPopup(null)}>
          <div className={`profile-popup ${popup.type}`} onClick={(e) => e.stopPropagation()}>
            <div className="profile-popup-icon">
              {popup.type === 'success' ? '✓' : '✕'}
            </div>
            <div className="profile-popup-message">{popup.message}</div>
            <button className="profile-popup-close" onClick={() => setPopup(null)}>
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileModal;
