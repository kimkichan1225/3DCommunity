import React, { useState, useEffect } from 'react';
import { FaTimes, FaDesktop, FaVolumeUp, FaCog } from 'react-icons/fa';
import './SettingModal.css';

function SettingModal({ onClose, onSettingsChange }) {
  const [activeTab, setActiveTab] = useState('graphics');

  // 로컬 스토리지에서 설정 불러오기
  const loadSettings = () => {
    try {
      const stored = localStorage.getItem('appSettings');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    // 기본 설정
    return {
      graphics: {
        quality: 'basic',
        shadows: 'on'
      },
      sound: {
        master: 70,
        effects: 80,
        music: 60
      },
      other: {
        language: 'ko',
        showToastNotifications: true,
        chatNotifications: true,
        eventNotifications: true,
        nightNotifications: false
      }
    };
  };

  const [settings, setSettings] = useState(loadSettings());

  const handleSettingChange = (category, key, value) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value
      }
    };
    setSettings(newSettings);
  };

  const handleApply = () => {
    if (onSettingsChange) {
      onSettingsChange(settings);
    }
    onClose();
  };

  return (
    <div className="setting-modal-overlay" onClick={onClose}>
      <div className="setting-modal" onClick={(e) => e.stopPropagation()}>
        <button className="setting-close-btn" onClick={onClose}>
          <FaTimes />
        </button>

        <h2 className="setting-modal-title">설정</h2>

        {/* 탭 메뉴 */}
        <div className="setting-tabs">
          <button
            className={`setting-tab ${activeTab === 'graphics' ? 'active' : ''}`}
            onClick={() => setActiveTab('graphics')}
          >
            <FaDesktop />
            <span>그래픽</span>
          </button>
          <button
            className={`setting-tab ${activeTab === 'sound' ? 'active' : ''}`}
            onClick={() => setActiveTab('sound')}
          >
            <FaVolumeUp />
            <span>사운드</span>
          </button>
          <button
            className={`setting-tab ${activeTab === 'other' ? 'active' : ''}`}
            onClick={() => setActiveTab('other')}
          >
            <FaCog />
            <span>기타</span>
          </button>
        </div>

        {/* 설정 내용 */}
        <div className="setting-content">
          {/* 그래픽 설정 */}
          {activeTab === 'graphics' && (
            <div className="setting-section">
              <h3 className="setting-section-title">그래픽 설정</h3>

              <div className="setting-item">
                <label className="setting-label">해상도 품질</label>
                <select
                  className="setting-select"
                  value={settings.graphics.quality}
                  onChange={(e) => handleSettingChange('graphics', 'quality', e.target.value)}
                >
                  <option value="basic">기본</option>
                  <option value="advanced">고급</option>
                </select>
              </div>

              <div className="setting-item">
                <label className="setting-label">그림자 설정</label>
                <select
                  className="setting-select"
                  value={settings.graphics.shadows}
                  onChange={(e) => handleSettingChange('graphics', 'shadows', e.target.value)}
                >
                  <option value="on">켜기</option>
                  <option value="off">끄기</option>
                </select>
              </div>
            </div>
          )}

          {/* 사운드 설정 */}
          {activeTab === 'sound' && (
            <div className="setting-section">
              <h3 className="setting-section-title">사운드 설정</h3>

              <div className="setting-item">
                <label className="setting-label">
                  마스터 볼륨
                  <span className="setting-value">{settings.sound.master}%</span>
                </label>
                <input
                  type="range"
                  className="setting-slider"
                  min="0"
                  max="100"
                  value={settings.sound.master}
                  onChange={(e) => handleSettingChange('sound', 'master', parseInt(e.target.value))}
                />
              </div>

              <div className="setting-item">
                <label className="setting-label">
                  효과음 볼륨
                  <span className="setting-value">{settings.sound.effects}%</span>
                </label>
                <input
                  type="range"
                  className="setting-slider"
                  min="0"
                  max="100"
                  value={settings.sound.effects}
                  onChange={(e) => handleSettingChange('sound', 'effects', parseInt(e.target.value))}
                />
              </div>

              <div className="setting-item">
                <label className="setting-label">
                  배경음악 볼륨
                  <span className="setting-value">{settings.sound.music}%</span>
                </label>
                <input
                  type="range"
                  className="setting-slider"
                  min="0"
                  max="100"
                  value={settings.sound.music}
                  onChange={(e) => handleSettingChange('sound', 'music', parseInt(e.target.value))}
                />
              </div>
            </div>
          )}

          {/* 기타 설정 */}
          {activeTab === 'other' && (
            <div className="setting-section">
              <h3 className="setting-section-title">기타 설정</h3>

              <div className="setting-item">
                <label className="setting-label">언어</label>
                <select
                  className="setting-select"
                  value={settings.other.language}
                  onChange={(e) => handleSettingChange('other', 'language', e.target.value)}
                >
                  <option value="ko">한국어</option>
                  <option value="en">English</option>
                  <option value="ja">日本語</option>
                  <option value="zh">中文</option>
                </select>
              </div>

              <div className="setting-subsection">
                <h4 className="setting-subsection-title">알림 설정</h4>

                <div className="setting-item">
                  <label className="setting-label">
                    실시간 알림 표시
                    <span className="setting-description">(화면 좌측 상단에 표시)</span>
                  </label>
                  <label className="setting-toggle">
                    <input
                      type="checkbox"
                      checked={settings.other.showToastNotifications !== false}
                      onChange={(e) => handleSettingChange('other', 'showToastNotifications', e.target.checked)}
                    />
                    <span className="setting-toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <label className="setting-label">채팅 알림</label>
                  <label className="setting-toggle">
                    <input
                      type="checkbox"
                      checked={settings.other.chatNotifications}
                      onChange={(e) => handleSettingChange('other', 'chatNotifications', e.target.checked)}
                    />
                    <span className="setting-toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <label className="setting-label">이벤트 알림</label>
                  <label className="setting-toggle">
                    <input
                      type="checkbox"
                      checked={settings.other.eventNotifications}
                      onChange={(e) => handleSettingChange('other', 'eventNotifications', e.target.checked)}
                    />
                    <span className="setting-toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <label className="setting-label">
                    야간 알림 설정
                    <span className="setting-description">(21:00 ~ 08:00)</span>
                  </label>
                  <label className="setting-toggle">
                    <input
                      type="checkbox"
                      checked={settings.other.nightNotifications}
                      onChange={(e) => handleSettingChange('other', 'nightNotifications', e.target.checked)}
                    />
                    <span className="setting-toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 버튼 */}
        <div className="setting-buttons">
          <button className="setting-btn apply-btn" onClick={handleApply}>
            적용
          </button>
          <button className="setting-btn cancel-btn" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingModal;
