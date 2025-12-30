import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ShopManagement.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const ShopManagement = () => {
  const [activeTab, setActiveTab] = useState('items');
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="검색"]');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
      if (event.key === 'Escape' && activeTab === 'items') {
        setSearchTerm('');
        setSelectedCategory('all');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'items') {
        await Promise.all([fetchItems(), fetchCategories()]);
      } else if (activeTab === 'categories') {
        await fetchCategories();
      }
    } catch (error) {
      console.error('데이터 조회 오류:', error);
      alert('데이터 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/shop-items`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(response.data || []);
    } catch (error) {
      console.error('아이템 조회 오류:', error);
      throw error;
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/item-categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data || []);
    } catch (error) {
      console.error('카테고리 조회 오류:', error);
      throw error;
    }
  };

  const handleItemSave = async (itemData) => {
    try {
      const token = localStorage.getItem('token');
      if (editingItem && editingItem.id) {
        await axios.put(`${API_URL}/api/admin/shop-items/${editingItem.id}`, itemData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/api/admin/shop-items`, itemData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setEditingItem(null);
      setShowItemModal(false);
      fetchItems();
      alert('아이템이 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('아이템 저장 오류:', error);
      alert('아이템 저장 중 오류가 발생했습니다.');
    }
  };

  const handleItemDelete = async (itemId) => {
    if (!window.confirm('정말로 이 아이템을 삭제하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/admin/shop-items/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchItems();
      alert('아이템이 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('아이템 삭제 오류:', error);
      alert('아이템 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleCategorySave = async (categoryData) => {
    try {
      const token = localStorage.getItem('token');
      if (editingCategory && editingCategory.id) {
        await axios.put(`${API_URL}/api/admin/item-categories/${editingCategory.id}`, categoryData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/api/admin/item-categories`, categoryData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setEditingCategory(null);
      setShowCategoryModal(false);
      fetchCategories();
      alert('카테고리가 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('카테고리 저장 오류:', error);
      alert('카테고리 저장 중 오류가 발생했습니다.');
    }
  };

  const handleCategoryDelete = async (categoryId) => {
    if (!window.confirm('정말로 이 카테고리를 삭제하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/admin/item-categories/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCategories();
      alert('카테고리가 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('카테고리 삭제 오류:', error);
      alert('카테고리 삭제 중 오류가 발생했습니다.');
    }
  };

  const getFilteredItems = () => {
    return items.filter(item => {
      // image_url이 있는 아이템만 표시 (상점에 보이는 아이템들)
      const hasImage = item.imageUrl && item.imageUrl.trim() !== '';

      const matchesSearch = searchTerm === '' ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || item.categoryId === parseInt(selectedCategory);

      return hasImage && matchesSearch && matchesCategory;
    });
  };

  const renderItemsTab = () => {
    const filteredItems = getFilteredItems();
    const totalPages = Math.ceil(filteredItems.length / pageSize);
    const paginatedItems = filteredItems.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

    const handlePageChange = (newPage) => {
      if (newPage >= 0 && newPage < totalPages) {
        setCurrentPage(newPage);
      }
    };

    // 페이지 번호 생성 (최대 5개씩 표시)
    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5;
      let startPage = Math.max(0, currentPage - Math.floor(maxVisible / 2));
      let endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);

      // 끝에서 시작할 경우 startPage 조정
      if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(0, endPage - maxVisible + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      return pages;
    };

    return (
      <>
        <div className="filters-section">
          <div className="filters-row">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="아이템명, 설명으로 검색... (Ctrl+K)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="search-clear">
                  ✕
                </button>
              )}
            </div>

            <div className="filters-right">
              <div className="filter-group">
                <label>카테고리</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">전체</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>표시 개수</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(0);
                  }}
                >
                  <option value={5}>5개</option>
                  <option value={10}>10개</option>
                  <option value={20}>20개</option>
                  <option value={50}>50개</option>
                </select>
              </div>

              <div className="items-count">
                <span className="count-badge">{filteredItems.length}</span>
                <span className="count-label">/ {items.length}개</span>
              </div>
            </div>
          </div>
        </div>

        <div className="table-container">
          <table className="items-table">
            <thead>
              <tr>
                <th>이미지</th>
                <th>아이템명</th>
                <th>카테고리</th>
                <th>가격</th>
                <th>상태</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="item-image">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} />
                      ) : (
                        <span className="item-image-placeholder">👁️</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="item-info">
                      <div className="item-name">{item.name}</div>
                      {item.description && (
                        <div className="item-description">{item.description}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    {categories.find(c => c.id === item.categoryId)?.name || '-'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {item.silverCoinPrice > 0 && (
                        <span>💰 {item.silverCoinPrice?.toLocaleString()}</span>
                      )}
                      {item.goldCoinPrice > 0 && (
                        <span>🪙 {item.goldCoinPrice?.toLocaleString()}</span>
                      )}
                      {item.silverCoinPrice === 0 && item.goldCoinPrice === 0 && (
                        <span style={{ color: '#999' }}>가격 미설정</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${item.isActive ? 'active' : 'inactive'}`}>
                      {item.isActive ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setShowItemModal(true);
                        }}
                        className="btn-icon"
                        title="수정"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleItemDelete(item.id)}
                        className="btn-icon delete"
                        title="삭제"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>

        {filteredItems.length === 0 && (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <p className="no-results-text">검색 조건에 맞는 아이템이 없습니다.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="btn-link"
            >
              모든 필터 초기화
            </button>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="pagination-btn"
            >
              ‹
            </button>

            {getPageNumbers().map(pageNum => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
              >
                {pageNum + 1}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="pagination-btn"
            >
              ›
            </button>
          </div>
        )}
      </>
    );
  };

  const renderCategoriesTab = () => (
    <div className="table-container">
      <table className="items-table">
        <thead>
          <tr>
            <th>카테고리명</th>
            <th>순서</th>
            <th>상태</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id}>
              <td className="item-name">{category.name}</td>
              <td>{category.displayOrder}</td>
              <td>
                <span className={`status-badge ${category.isActive ? 'active' : 'inactive'}`}>
                  {category.isActive ? '활성' : '비활성'}
                </span>
              </td>
              <td>
                <div className="action-buttons">
                  <button
                    onClick={() => {
                      setEditingCategory(category);
                      setShowCategoryModal(true);
                    }}
                    className="btn-icon"
                    title="수정"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleCategoryDelete(category.id)}
                    className="btn-icon delete"
                    title="삭제"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (loading) {
    return (
      <div className="shop-management">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="shop-management">
      <div className="shop-management-header">
        <h1>상점 관리</h1>
        {activeTab === 'items' ? (
          <button
            onClick={() => {
              setEditingItem({});
              setShowItemModal(true);
            }}
            className="btn-add"
          >
            <span>➕</span>
            <span>새 아이템 추가</span>
          </button>
        ) : (
          <button
            onClick={() => {
              setEditingCategory({});
              setShowCategoryModal(true);
            }}
            className="btn-add"
          >
            <span>➕</span>
            <span>새 카테고리 추가</span>
          </button>
        )}
      </div>

      <div className="tabs-nav">
        <button
          onClick={() => setActiveTab('items')}
          className={`tab-button ${activeTab === 'items' ? 'active' : ''}`}
        >
          <span style={{ marginRight: '6px' }}>🎁</span>
          아이템
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`tab-button ${activeTab === 'categories' ? 'active' : ''}`}
        >
          <span style={{ marginRight: '6px' }}>📂</span>
          카테고리
        </button>
      </div>

      {activeTab === 'items' && renderItemsTab()}
      {activeTab === 'categories' && renderCategoriesTab()}

      {showItemModal && (
        <ItemModal
          item={editingItem}
          categories={categories}
          onSave={handleItemSave}
          onClose={() => {
            setShowItemModal(false);
            setEditingItem(null);
          }}
        />
      )}

      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onSave={handleCategorySave}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
        />
      )}
    </div>
  );
};

// 아이템 모달
const ItemModal = ({ item, categories, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    categoryId: item?.categoryId || '',
    price: item?.price || 0,
    silverCoinPrice: item?.silverCoinPrice || 0,
    goldCoinPrice: item?.goldCoinPrice || 0,
    imageUrl: item?.imageUrl || '',
    modelUrl: item?.modelUrl || '',
    itemType: item?.itemType || 'ACCESSORY',
    isActive: item?.isActive ?? true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert('아이템명은 필수 입력 사항입니다.');
      return;
    }
    if (formData.silverCoinPrice === 0 && formData.goldCoinPrice === 0) {
      alert('은화 또는 금화 가격 중 최소 하나는 설정해야 합니다.');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{item?.id ? '아이템 수정' : '새 아이템 추가'}</h3>
          <button onClick={onClose} className="btn-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            <div className="form-group">
              <label>아이템명 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="아이템명을 입력하세요"
                required
              />
            </div>

            <div className="form-group">
              <label>카테고리</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
              >
                <option value="">카테고리 선택</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>은화 가격 💰</label>
              <input
                type="number"
                value={formData.silverCoinPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, silverCoinPrice: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                min="0"
              />
              <small style={{ color: '#666', fontSize: '0.85em' }}>0으로 설정하면 은화로 구매 불가</small>
            </div>

            <div className="form-group">
              <label>금화 가격 🪙</label>
              <input
                type="number"
                value={formData.goldCoinPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, goldCoinPrice: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                min="0"
              />
              <small style={{ color: '#666', fontSize: '0.85em' }}>0으로 설정하면 금화로 구매 불가</small>
            </div>

            <div className="form-group">
              <label>아이템 타입</label>
              <select
                value={formData.itemType}
                onChange={(e) => setFormData(prev => ({ ...prev, itemType: e.target.value }))}
              >
                <option value="ACCESSORY">악세서리</option>
                <option value="CLOTHING">의상</option>
                <option value="HAIR">헤어</option>
                <option value="OUTLINE">프로필 테두리</option>
                <option value="OTHER">기타</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>설명</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="아이템에 대한 설명을 입력하세요"
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>이미지 URL</label>
              <input
                type="text"
                value={formData.imageUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://example.com/image.png 또는 /resources/..."
              />
            </div>

            <div className="form-group">
              <label>3D 모델 URL (.glb / .gltf)</label>
              <input
                type="text"
                value={formData.modelUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, modelUrl: e.target.value }))}
                placeholder="https://example.com/model.glb 또는 /resources/..."
              />
            </div>
          </div>

          <div className="form-checkbox">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
            />
            <label htmlFor="is_active">활성 상태</label>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              취소
            </button>
            <button type="submit" className="btn-submit">
              {item?.id ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 카테고리 모달
const CategoryModal = ({ category, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    displayOrder: category?.displayOrder || 0,
    isActive: category?.isActive ?? true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert('카테고리명은 필수 입력 사항입니다.');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{category?.id ? '카테고리 수정' : '새 카테고리 추가'}</h3>
          <button onClick={onClose} className="btn-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            <div className="form-group">
              <label>카테고리명 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="카테고리명을 입력하세요"
                required
              />
            </div>

            <div className="form-group">
              <label>표시 순서</label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label>설명</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="카테고리에 대한 설명을 입력하세요"
            />
          </div>

          <div className="form-checkbox">
            <input
              type="checkbox"
              id="category_active"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
            />
            <label htmlFor="category_active">활성 상태</label>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              취소
            </button>
            <button type="submit" className="btn-submit">
              {category?.id ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShopManagement;
