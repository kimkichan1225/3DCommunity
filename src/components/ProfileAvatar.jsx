import React from 'react';
import './ProfileAvatar.css';

/**
 * 프로필 이미지 + 테두리를 함께 표시하는 컴포넌트
 * @param {object} profileImage - { imagePath, itemName }
 * @param {object} outlineImage - { imagePath, itemName }
 * @param {number} size - 아바타 크기 (px)
 * @param {string} className - 추가 CSS 클래스
 */
function ProfileAvatar({ profileImage, outlineImage, size = 60, className = '' }) {
  const defaultProfile = '/resources/Profile/base-profile3.png';
  const defaultOutline = '/resources/ProfileOutline/base-outline1.png';

  const profileSrc = profileImage?.imagePath || defaultProfile;
  const outlineSrc = outlineImage?.imagePath || defaultOutline;

  return (
    <div
      className={`profile-avatar ${className}`}
      style={{ width: size, height: size }}
    >
      {/* 테두리 이미지 (배경) */}
      <img
        src={outlineSrc}
        alt={outlineImage?.itemName || 'outline'}
        className="profile-outline"
      />

      {/* 프로필 이미지 (전경) */}
      <img
        src={profileSrc}
        alt={profileImage?.itemName || 'profile'}
        className="profile-image"
      />
    </div>
  );
}

export default ProfileAvatar;
