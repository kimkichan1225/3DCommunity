import React, { useState, useEffect } from 'react';
import './ShopModal.css';
import shopService from '../services/shopService';

/**
 * ShopModal 컴포넌트
 * - 상점 아이템 목록 및 상세 정보 표시
 * - 카테고리별 필터, 검색, 정렬 기능
 * - 구매, 착용/해제 기능
 */
function ShopModal({ onClose, userCoins, onCoinsUpdate, setCharacterModelPath }) {
  // 상태 관리
  const [activeTab, setActiveTab] = useState('ALL'); // 카테고리 탭
  const [filter, setFilter] = useState('all'); // 전체/미보유/보유중
  const [sortBy, setSortBy] = useState('latest'); // 정렬 기준
  const [searchQuery, setSearchQuery] = useState(''); // 검색어
  const [selectedItem, setSelectedItem] = useState(null); // 선택된 아이템
  const [popup, setPopup] = useState(null); // { message, type: 'success' | 'error' }

  // 데이터
  const [categories, setCategories] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [myInventory, setMyInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // 먼저 중복 착용 아바타 정리
      try {
        await shopService.cleanupEquippedAvatars();
        console.log('✅ 중복 착용 아바타 정리 완료');
      } catch (cleanupError) {
        console.warn('⚠️ 중복 착용 아바타 정리 실패:', cleanupError);
        // 정리 실패해도 계속 진행
      }

      const [categoriesData, itemsData, inventoryData] = await Promise.all([
        shopService.getActiveCategories(),
        shopService.getActiveShopItems(),
        shopService.getMyInventory()
      ]);

      setCategories(categoriesData);
      setAllItems(itemsData);
      setMyInventory(inventoryData);
    } catch (error) {
      console.error('Failed to load shop data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 필터링된 아이템 목록
  const getFilteredItems = () => {
    let items = [...allItems];

    // 카테고리 필터
    if (activeTab !== 'ALL') {
      const category = categories.find(c => c.name === activeTab);
      if (category) {
        items = items.filter(item => item.categoryId === category.id);
      }
    }

    // 보유 상태 필터
    if (filter === 'unowned') {
      items = items.filter(item => !myInventory.some(inv => inv.shopItemId === item.id));
    } else if (filter === 'owned') {
      items = items.filter(item => myInventory.some(inv => inv.shopItemId === item.id));
    }

    // 검색어 필터
    if (searchQuery) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 정렬
    if (sortBy === 'latest') {
      // 기본 순서 (최신순)
    } else if (sortBy === 'price-asc') {
      items.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      items.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name') {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }

    return items;
  };

  const filteredItems = getFilteredItems();

  // 아이템이 보유 중인지 확인
  const isOwned = (itemId) => {
    return myInventory.some(inv => inv.shopItemId === itemId);
  };

  // 아이템이 착용 중인지 확인
  const isEquipped = (itemId) => {
    return myInventory.some(inv => inv.shopItemId === itemId && inv.isEquipped);
  };

  // 아이템이 신규인지 확인
  const isNew = (itemId) => {
    return myInventory.some(inv => inv.shopItemId === itemId && inv.isNew);
  };

  // 아이템 구매
  const handlePurchase = async (itemId, currencyType = 'SILVER', autoEquip = false) => {
    try {
      const response = await shopService.purchaseItem(itemId, currencyType, autoEquip);
      if (response.success) {
        setPopup({ message: '구매가 완료되었습니다!', type: 'success' });
        await loadData(); // 데이터 새로고침
        if (onCoinsUpdate) {
          onCoinsUpdate(response.remainingSilverCoins, response.remainingGoldCoins);
        }

        // 구매 후 자동 착용 시 캐릭터 모델 변경
        if (autoEquip && setCharacterModelPath) {
          const equippedItem = allItems.find(item => item.id === itemId);
          if (equippedItem && equippedItem.modelUrl) {
            setCharacterModelPath(equippedItem.modelUrl);
          }
        }
      } else {
        setPopup({ message: response.message, type: 'error' });
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      setPopup({ message: '구매에 실패했습니다.', type: 'error' });
    }
  };

  // 아이템 착용/해제
  const handleToggleEquip = async (itemId) => {
    try {
      console.log('🔵 [1] handleToggleEquip 시작, itemId:', itemId);

      const inventoryItem = myInventory.find(inv => inv.shopItemId === itemId);
      console.log('🔵 [2] inventoryItem 찾음:', inventoryItem);

      if (inventoryItem) {
        const wasEquipped = inventoryItem.isEquipped;
        console.log('🔵 [3] wasEquipped:', wasEquipped);

        await shopService.toggleEquipItem(inventoryItem.id);
        console.log('🔵 [4] API 호출 완료');

        await loadData(); // 데이터 새로고침
        console.log('🔵 [5] loadData 완료');

        // 착용 시 캐릭터 모델 변경
        if (!wasEquipped && setCharacterModelPath) {
          console.log('🔵 [6] 캐릭터 모델 변경 시작');

          const equippedItem = allItems.find(item => item.id === itemId);
          console.log('🔵 [7] equippedItem:', equippedItem);

          // 백엔드는 modelUrl 필드를 사용함
          if (equippedItem && equippedItem.modelUrl) {
            console.log('🟢 [8] 모델 경로 변경:', equippedItem.modelUrl);
            setCharacterModelPath(equippedItem.modelUrl);
            console.log('🟢 [9] setCharacterModelPath 호출 완료!');
          } else {
            console.error('❌ [8] equippedItem 또는 modelUrl 없음:', {
              equippedItem,
              modelUrl: equippedItem?.modelUrl
            });
          }
        } else {
          console.log('⚠️ [6] 캐릭터 모델 변경 건너뜀:', {
            wasEquipped,
            hasSetFunction: !!setCharacterModelPath
          });
        }
      }
    } catch (error) {
      console.error('❌ Toggle equip failed:', error);
      setPopup({ message: '착용/해제에 실패했습니다.', type: 'error' });
    }
  };

  // 신규 아이템 확인
  const handleMarkAsViewed = async (itemId) => {
    try {
      const inventoryItem = myInventory.find(inv => inv.shopItemId === itemId);
      if (inventoryItem && inventoryItem.isNew) {
        await shopService.markItemAsViewed(inventoryItem.id);
        await loadData(); // 데이터 새로고침
      }
    } catch (error) {
      console.error('Mark as viewed failed:', error);
    }
  };

  // 아이템 선택 시 자동으로 신규 배지 제거
  const handleSelectItem = (item) => {
    setSelectedItem(item);
    if (isNew(item.id)) {
      handleMarkAsViewed(item.id);
    }
  };

  return (
    <div className="shop-modal-overlay" onClick={onClose}>
      <div className="shop-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="shop-modal-header">
          <h2>🛒 상점</h2>
          <div className="shop-coins-display">
            <div className="coin-item">
              <img src="/resources/Icon/Silver-Coin.png" alt="실버 코인" />
              <span>{userCoins?.silver || 0}</span>
            </div>
            <div className="coin-item">
              <img src="/resources/Icon/Gold-Coin.png" alt="골드 코인" />
              <span>{userCoins?.gold || 0}</span>
            </div>
          </div>
          <button className="shop-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* 카테고리 탭 */}
        <div className="shop-modal-tabs">
          <button
            className={`shop-tab ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            전체
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={`shop-tab ${activeTab === category.name ? 'active' : ''}`}
              onClick={() => setActiveTab(category.name)}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* 필터 & 정렬 바 */}
        <div className="shop-filter-bar">
          <select
            className="shop-filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">전체 보기</option>
            <option value="unowned">미보유 아이템만</option>
            <option value="owned">보유한 아이템만</option>
          </select>

          <input
            type="text"
            className="shop-search-input"
            placeholder="🔍 아이템 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            className="shop-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="latest">최신순</option>
            <option value="price-asc">가격 낮은순</option>
            <option value="price-desc">가격 높은순</option>
            <option value="name">이름순</option>
          </select>
        </div>

        {/* 메인 컨텐츠: 왼쪽(목록) + 오른쪽(상세) */}
        <div className="shop-modal-body">
          {/* 왼쪽: 아이템 그리드 */}
          <div className="shop-items-section">
            {isLoading ? (
              <div className="shop-loading">로딩 중...</div>
            ) : filteredItems.length === 0 ? (
              <div className="shop-empty">아이템이 없습니다.</div>
            ) : (
              <div className="shop-items-grid">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className={`shop-item-card ${selectedItem?.id === item.id ? 'selected' : ''}`}
                    onClick={() => handleSelectItem(item)}
                  >
                    <div className="shop-item-image">
                      <img
                        src={item.imageUrl || '/resources/Icon/Event-icon.png'}
                        alt={item.name}
                      />
                      {isNew(item.id) && <div className="item-badge new-badge">NEW</div>}
                      {isEquipped(item.id) && <div className="item-badge equipped-badge">착용중</div>}
                      {isOwned(item.id) && !isEquipped(item.id) && (
                        <div className="item-badge owned-badge">보유중</div>
                      )}
                    </div>
                    <div className="shop-item-info">
                      <h4>{item.name}</h4>
                      <div className="shop-item-price">
                        {item.silverCoinPrice > 0 && (
                          <div className="price-item">
                            <img src="/resources/Icon/Silver-Coin.png" alt="실버" style={{ width: '16px', height: '16px' }} />
                            <span>{item.silverCoinPrice?.toLocaleString()}</span>
                          </div>
                        )}
                        {item.goldCoinPrice > 0 && (
                          <div className="price-item">
                            <img src="/resources/Icon/Gold-Coin.png" alt="골드" style={{ width: '16px', height: '16px' }} />
                            <span>{item.goldCoinPrice?.toLocaleString()}</span>
                          </div>
                        )}
                        {item.silverCoinPrice === 0 && item.goldCoinPrice === 0 && (
                          <span style={{ fontSize: '12px', color: '#999' }}>가격 미설정</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 오른쪽: 상세 정보 */}
          <div className="shop-detail-section">
            {selectedItem ? (
              <>
                <div className="shop-detail-header">
                  <img
                    src={selectedItem.imageUrl || '/resources/Icon/Event-icon.png'}
                    alt={selectedItem.name}
                  />
                  <h3>{selectedItem.name}</h3>
                </div>
                <div className="shop-detail-content">
                  <p className="detail-description">
                    {selectedItem.description || '아이템 설명이 없습니다.'}
                  </p>

                  <div className="detail-price-box">
                    <h4>가격</h4>
                    <div className="price-display-horizontal">
                      {selectedItem.silverCoinPrice > 0 && (
                        <div className="price-item-detail">
                          <img src="/resources/Icon/Silver-Coin.png" alt="실버 코인" style={{ width: '24px', height: '24px' }} />
                          <span className="price-value">{selectedItem.silverCoinPrice?.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedItem.goldCoinPrice > 0 && (
                        <div className="price-item-detail">
                          <img src="/resources/Icon/Gold-Coin.png" alt="골드 코인" style={{ width: '24px', height: '24px' }} />
                          <span className="price-value">{selectedItem.goldCoinPrice?.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedItem.silverCoinPrice === 0 && selectedItem.goldCoinPrice === 0 && (
                        <span className="price-value" style={{ color: '#999' }}>가격 미설정</span>
                      )}
                    </div>
                  </div>

                  {/* 상태 표시 */}
                  <div className="detail-status">
                    {isOwned(selectedItem.id) && (
                      <div className="status-badge owned">✓ 보유 중</div>
                    )}
                    {isEquipped(selectedItem.id) && (
                      <div className="status-badge equipped">★ 착용 중</div>
                    )}
                  </div>

                  {/* 버튼 */}
                  <div className="detail-actions">
                    {!isOwned(selectedItem.id) ? (
                      <>
                        {selectedItem.silverCoinPrice > 0 && selectedItem.goldCoinPrice > 0 ? (
                          /* 은화와 금화 둘 다 가능 */
                          <>
                            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                              <button
                                className="btn-purchase"
                                onClick={() => handlePurchase(selectedItem.id, 'SILVER', false)}
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                              >
                                <img src="/resources/Icon/Silver-Coin.png" alt="Silver" style={{ width: '20px', height: '20px' }} />
                                {selectedItem.silverCoinPrice?.toLocaleString()}
                              </button>
                              <button
                                className="btn-purchase"
                                onClick={() => handlePurchase(selectedItem.id, 'GOLD', false)}
                                style={{ flex: 1, background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                              >
                                <img src="/resources/Icon/Gold-Coin.png" alt="Gold" style={{ width: '20px', height: '20px' }} />
                                {selectedItem.goldCoinPrice?.toLocaleString()}
                              </button>
                            </div>
                            {/* OUTLINE 타입이 아닐 때만 구매 후 착용 버튼 표시 */}
                            {selectedItem.itemType !== 'OUTLINE' && (
                              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                <button
                                  className="btn-purchase-equip"
                                  onClick={() => handlePurchase(selectedItem.id, 'SILVER', true)}
                                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                >
                                  <img src="/resources/Icon/Silver-Coin.png" alt="Silver" style={{ width: '18px', height: '18px' }} />
                                  구매 후 착용
                                </button>
                                <button
                                  className="btn-purchase-equip"
                                  onClick={() => handlePurchase(selectedItem.id, 'GOLD', true)}
                                  style={{ flex: 1, background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)', color: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                >
                                  <img src="/resources/Icon/Gold-Coin.png" alt="Gold" style={{ width: '18px', height: '18px' }} />
                                  구매 후 착용
                                </button>
                              </div>
                            )}
                          </>
                        ) : selectedItem.silverCoinPrice > 0 ? (
                          /* 은화만 가능 */
                          <>
                            <button
                              className="btn-purchase"
                              onClick={() => handlePurchase(selectedItem.id, 'SILVER', false)}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            >
                              <img src="/resources/Icon/Silver-Coin.png" alt="Silver" style={{ width: '20px', height: '20px' }} />
                              {selectedItem.silverCoinPrice?.toLocaleString()} 구매
                            </button>
                            {/* OUTLINE 타입이 아닐 때만 구매 후 착용 버튼 표시 */}
                            {selectedItem.itemType !== 'OUTLINE' && (
                              <button
                                className="btn-purchase-equip"
                                onClick={() => handlePurchase(selectedItem.id, 'SILVER', true)}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                              >
                                <img src="/resources/Icon/Silver-Coin.png" alt="Silver" style={{ width: '20px', height: '20px' }} />
                                구매 후 착용
                              </button>
                            )}
                          </>
                        ) : selectedItem.goldCoinPrice > 0 ? (
                          /* 금화만 가능 */
                          <>
                            <button
                              className="btn-purchase"
                              onClick={() => handlePurchase(selectedItem.id, 'GOLD', false)}
                              style={{ background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            >
                              <img src="/resources/Icon/Gold-Coin.png" alt="Gold" style={{ width: '20px', height: '20px' }} />
                              {selectedItem.goldCoinPrice?.toLocaleString()} 구매
                            </button>
                            {/* OUTLINE 타입이 아닐 때만 구매 후 착용 버튼 표시 */}
                            {selectedItem.itemType !== 'OUTLINE' && (
                              <button
                                className="btn-purchase-equip"
                                onClick={() => handlePurchase(selectedItem.id, 'GOLD', true)}
                                style={{ background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                              >
                                <img src="/resources/Icon/Gold-Coin.png" alt="Gold" style={{ width: '20px', height: '20px' }} />
                                구매 후 착용
                              </button>
                            )}
                          </>
                        ) : (
                          <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
                            가격이 설정되지 않은 아이템입니다
                          </div>
                        )}
                      </>
                    ) : (
                      /* 보유 중인 아이템 - OUTLINE이 아닐 때만 착용 버튼 표시 */
                      selectedItem.itemType !== 'OUTLINE' ? (
                        <button
                          className={`btn-equip ${isEquipped(selectedItem.id) ? 'equipped' : ''}`}
                          onClick={() => handleToggleEquip(selectedItem.id)}
                        >
                          {isEquipped(selectedItem.id) ? '착용 해제' : '착용하기'}
                        </button>
                      ) : (
                        <div style={{ color: '#4CAF50', textAlign: 'center', padding: '20px', fontSize: '14px' }}>
                          프로필 커스터마이징에서 착용하실 수 있습니다
                        </div>
                      )
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="shop-detail-empty">
                <p>아이템을 선택해주세요</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 팝업 메시지 */}
      {popup && (
        <div className="shop-popup-overlay" onClick={() => setPopup(null)}>
          <div className={`shop-popup ${popup.type}`} onClick={(e) => e.stopPropagation()}>
            <div className="shop-popup-icon">
              {popup.type === 'success' ? '✓' : '✕'}
            </div>
            <div className="shop-popup-message">{popup.message}</div>
            <button className="shop-popup-close" onClick={() => setPopup(null)}>
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShopModal;
