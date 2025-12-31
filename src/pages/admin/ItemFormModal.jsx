import React, { useState, useEffect } from 'react';
import './ItemFormModal.css';
import adminProfileService from '../../services/adminProfileService';

function ItemFormModal({ item, onClose, onSuccess }) {
  const isEdit = !!item;

  const [formData, setFormData] = useState({
    itemType: 'PROFILE',
    itemCode: '',
    itemName: '',
    imagePath: '',
    isDefault: false,
    unlockConditionType: 'NONE',
    unlockConditionValue: '',
    displayOrder: 0
  });

  const [conditionTypes, setConditionTypes] = useState([]);
  const [conditionDescription, setConditionDescription] = useState('');
  const [conditionValue, setConditionValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConditionTypes();

    if (item) {
      setFormData({
        itemType: item.itemType,
        itemCode: item.itemCode,
        itemName: item.itemName,
        imagePath: item.imagePath,
        isDefault: item.isDefault,
        unlockConditionType: item.unlockConditionType || 'NONE',
        unlockConditionValue: item.unlockConditionValue || '',
        displayOrder: item.displayOrder
      });

      // 조건 값 파싱
      if (item.unlockConditionValue) {
        try {
          const parsed = JSON.parse(item.unlockConditionValue);
          setConditionDescription(parsed.description || '');
          setConditionValue(parsed.value || '');
        } catch (e) {
          console.error('Failed to parse condition value:', e);
        }
      }
    }
  }, [item]);

  const loadConditionTypes = async () => {
    try {
      const types = await adminProfileService.getUnlockConditionTypes();
      setConditionTypes(types);
    } catch (error) {
      console.error('Failed to load condition types:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 조건 값 생성
    let conditionValueJson = '';
    if (formData.unlockConditionType !== 'NONE') {
      conditionValueJson = JSON.stringify({
        value: conditionValue,
        description: conditionDescription
      });
    }

    const submitData = {
      ...formData,
      unlockConditionValue: conditionValueJson
    };

    try {
      setLoading(true);

      if (isEdit) {
        await adminProfileService.updateProfileItem(item.id, submitData);
        alert('아이템이 수정되었습니다.');
      } else {
        await adminProfileService.createProfileItem(submitData);
        alert('아이템이 생성되었습니다.');
      }

      onSuccess();
    } catch (error) {
      const message = error.response?.data?.message || '작업에 실패했습니다.';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="item-form-modal-overlay" onClick={onClose}>
      <div className="item-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? '아이템 수정' : '새 아이템 추가'}</h2>
          <button className="close-modal-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="item-form">
          {/* 아이템 타입 */}
          <div className="form-group">
            <label>아이템 타입 *</label>
            <select
              name="itemType"
              value={formData.itemType}
              onChange={handleChange}
              required
            >
              <option value="PROFILE">프로필 이미지</option>
              <option value="OUTLINE">테두리</option>
              <option value="NICKNAME_TICKET">닉네임 변경권 (소비 아이템)</option>
            </select>
          </div>

          {/* 아이템 코드 */}
          <div className="form-group">
            <label>아이템 코드 *</label>
            <input
              type="text"
              name="itemCode"
              value={formData.itemCode}
              onChange={handleChange}
              placeholder="예: base-profile4"
              required
            />
            <small>고유한 코드를 입력하세요 (영문, 숫자, 하이픈만)</small>
          </div>

          {/* 아이템 이름 */}
          <div className="form-group">
            <label>아이템 이름 *</label>
            <input
              type="text"
              name="itemName"
              value={formData.itemName}
              onChange={handleChange}
              placeholder="예: 프리미엄 프로필"
              required
            />
          </div>

          {/* 이미지 경로 */}
          <div className="form-group">
            <label>이미지 경로 *</label>
            <input
              type="text"
              name="imagePath"
              value={formData.imagePath}
              onChange={handleChange}
              placeholder="/resources/Profile/base-profile4.png"
              required
            />
            <small>public 폴더 기준 경로를 입력하세요</small>
          </div>

          {/* 기본 제공 */}
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleChange}
              />
              <span>기본 제공 아이템 (모든 사용자에게 자동 지급)</span>
            </label>
          </div>

          {/* 잠금해제 조건 타입 */}
          <div className="form-group">
            <label>잠금해제 조건 타입</label>
            <select
              name="unlockConditionType"
              value={formData.unlockConditionType}
              onChange={handleChange}
            >
              {conditionTypes.map((type) => (
                <option key={type.type} value={type.type}>
                  {type.name} - {type.description}
                </option>
              ))}
            </select>
          </div>

          {/* 조건 값 (NONE이 아닐 때만 표시) */}
          {formData.unlockConditionType !== 'NONE' && (
            <>
              <div className="form-group">
                <label>조건 값</label>
                <input
                  type="text"
                  value={conditionValue}
                  onChange={(e) => setConditionValue(e.target.value)}
                  placeholder="예: 10 (게시글 10개)"
                />
                <small>숫자나 문자열 값을 입력하세요</small>
              </div>

              <div className="form-group">
                <label>조건 설명</label>
                <input
                  type="text"
                  value={conditionDescription}
                  onChange={(e) => setConditionDescription(e.target.value)}
                  placeholder="예: 게시글 10개 작성"
                />
                <small>사용자에게 표시될 설명을 입력하세요</small>
              </div>
            </>
          )}

          {/* 표시 순서 */}
          <div className="form-group">
            <label>표시 순서</label>
            <input
              type="number"
              name="displayOrder"
              value={formData.displayOrder}
              onChange={handleChange}
              min="0"
            />
            <small>작은 숫자가 먼저 표시됩니다</small>
          </div>

          {/* 버튼 */}
          <div className="form-actions">
            <button type="button" className="cancel-form-btn" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="submit-form-btn" disabled={loading}>
              {loading ? '처리 중...' : (isEdit ? '수정' : '생성')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ItemFormModal;
