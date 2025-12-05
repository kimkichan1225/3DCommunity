import React from 'react';
import './Popup.css';

function Popup({ message, onClose }) {
  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-container" onClick={(e) => e.stopPropagation()}>
        <div className="popup-content">
          <div className="popup-message">{message}</div>
          <button className="popup-close-btn" onClick={onClose}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

export default Popup;
