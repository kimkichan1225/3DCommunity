import React, { useState, useEffect } from 'react';
import './InventoryModal.css';
import shopService from '../../shop/services/shopService';

function InventoryModal({ onClose }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await shopService.getMyInventory();
      setInventory(data);
      setError(null);
    } catch (err) {
      console.error('인벤토리 로드 실패:', err);
      setError('인벤토리를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEquip = async (inventoryId) => {
    try {
      await shopService.toggleEquipItem(inventoryId);
      // 인벤토리 새로고침
      await loadInventory();
    } catch (err) {
      console.error('아이템 착용/해제 실패:', err);
      alert('아이템 착용/해제에 실패했습니다.');
    }
  };

  return (
    <div className="inventory-modal-overlay" onClick={onClose}>
      <div className="inventory-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="inventory-modal-header">
          <h2>인벤토리</h2>
          <button className="inventory-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="inventory-modal-content">
          {loading ? (
            <div className="inventory-loading">로딩 중...</div>
          ) : error ? (
            <div className="inventory-error">{error}</div>
          ) : inventory.length === 0 ? (
            <div className="inventory-empty">
              <p>보유한 아이템이 없습니다.</p>
              <p className="inventory-empty-hint">상점에서 아이템을 구매해보세요!</p>
            </div>
          ) : (
            <div className="inventory-grid">
              {inventory.map((item) => (
                <div
                  key={item.id}
                  className={`inventory-item ${item.isEquipped ? 'equipped' : ''}`}
                >
                  {item.shopItem?.imageUrl ? (
                    <img
                      src={item.shopItem.imageUrl}
                      alt={item.shopItem.name}
                      className="inventory-item-image"
                    />
                  ) : (
                    <div className="inventory-item-no-image">
                      <span>이미지 없음</span>
                    </div>
                  )}
                  <div className="inventory-item-info">
                    <h4 className="inventory-item-name">{item.shopItem?.name}</h4>
                    <p className="inventory-item-category">
                      {item.shopItem?.category?.name || '카테고리 없음'}
                    </p>
                  </div>
                  <button
                    className={`inventory-equip-btn ${item.isEquipped ? 'equipped' : ''}`}
                    onClick={() => handleToggleEquip(item.id)}
                  >
                    {item.isEquipped ? '착용 중' : '착용하기'}
                  </button>
                  {item.isNew && <span className="inventory-new-badge">NEW</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InventoryModal;
