import React, { useState } from 'react';
import { FaTimes, FaDesktop, FaVolumeUp, FaCog } from 'react-icons/fa';
import './SettingModal.css';

function SettingModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('graphics');

  // 설정 상태 (UI만, 실제 기능은 나중에)
  const [settings, setSettings] = useState({
    graphics: {
      quality: 'medium',
      shadows: 'medium',
      fpsLimit: '60'
    },
    sound: {
      master: 70,
      masterEnabled: true,
      effects: 80,
      effectsEnabled: true,
      music: 60,
      musicEnabled: true
    },
    other: {
      language: 'ko',
      chatNotifications: true,
      eventNotifications: true,
      nightNotifications: false
    }
  });

  const handleSettingChange = (category, key, value) => {
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value
      }
    });
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
                <label className="setting-label">그래픽 품질</label>
                <select
                  className="setting-select"
                  value={settings.graphics.quality}
                  onChange={(e) => handleSettingChange('graphics', 'quality', e.target.value)}
                >
                  <option value="low">낮음</option>
                  <option value="medium">중간</option>
                  <option value="high">높음</option>
                  <option value="ultra">최상</option>
                </select>
              </div>

              <div className="setting-item">
                <label className="setting-label">그림자 품질</label>
                <select
                  className="setting-select"
                  value={settings.graphics.shadows}
                  onChange={(e) => handleSettingChange('graphics', 'shadows', e.target.value)}
                >
                  <option value="off">끄기</option>
                  <option value="low">낮음</option>
                  <option value="medium">중간</option>
                  <option value="high">높음</option>
                </select>
              </div>

              <div className="setting-item">
                <label className="setting-label">FPS 제한</label>
                <select
                  className="setting-select"
                  value={settings.graphics.fpsLimit}
                  onChange={(e) => handleSettingChange('graphics', 'fpsLimit', e.target.value)}
                >
                  <option value="30">30 FPS</option>
                  <option value="60">60 FPS</option>
                  <option value="120">120 FPS</option>
                  <option value="unlimited">제한 없음</option>
                </select>
              </div>
            </div>
          )}

          {/* 사운드 설정 */}
          {activeTab === 'sound' && (
            <div className="setting-section">
              <h3 className="setting-section-title">사운드 설정</h3>

              <div className="setting-item sound-item">
                <div className="sound-header">
                  <label className="setting-label">
                    마스터 볼륨
                    <span className="setting-value">{settings.sound.master}%</span>
                  </label>
                  <label className="setting-toggle">
                    <input
                      type="checkbox"
                      checked={settings.sound.masterEnabled}
                      onChange={(e) => handleSettingChange('sound', 'masterEnabled', e.target.checked)}
                    />
                    <span className="setting-toggle-slider"></span>
                  </label>
                </div>
                <input
                  type="range"
                  className="setting-slider"
                  min="0"
                  max="100"
                  value={settings.sound.master}
                  onChange={(e) => handleSettingChange('sound', 'master', parseInt(e.target.value))}
                  disabled={!settings.sound.masterEnabled}
                />
              </div>

              <div className="setting-item sound-item">
                <div className="sound-header">
                  <label className="setting-label">
                    효과음 볼륨
                    <span className="setting-value">{settings.sound.effects}%</span>
                  </label>
                  <label className="setting-toggle">
                    <input
                      type="checkbox"
                      checked={settings.sound.effectsEnabled}
                      onChange={(e) => handleSettingChange('sound', 'effectsEnabled', e.target.checked)}
                    />
                    <span className="setting-toggle-slider"></span>
                  </label>
                </div>
                <input
                  type="range"
                  className="setting-slider"
                  min="0"
                  max="100"
                  value={settings.sound.effects}
                  onChange={(e) => handleSettingChange('sound', 'effects', parseInt(e.target.value))}
                  disabled={!settings.sound.effectsEnabled}
                />
              </div>

              <div className="setting-item sound-item">
                <div className="sound-header">
                  <label className="setting-label">
                    배경음악 볼륨
                    <span className="setting-value">{settings.sound.music}%</span>
                  </label>
                  <label className="setting-toggle">
                    <input
                      type="checkbox"
                      checked={settings.sound.musicEnabled}
                      onChange={(e) => handleSettingChange('sound', 'musicEnabled', e.target.checked)}
                    />
                    <span className="setting-toggle-slider"></span>
                  </label>
                </div>
                <input
                  type="range"
                  className="setting-slider"
                  min="0"
                  max="100"
                  value={settings.sound.music}
                  onChange={(e) => handleSettingChange('sound', 'music', parseInt(e.target.value))}
                  disabled={!settings.sound.musicEnabled}
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
          <button className="setting-btn apply-btn" onClick={onClose}>
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
