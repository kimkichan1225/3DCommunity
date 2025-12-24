import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const shopService = {
  // 아이템 관련
  getAllItems: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/admin/shop-items`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  getItemById: async (id) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/admin/shop-items/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  createItem: async (itemData) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/api/admin/shop-items`, itemData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  updateItem: async (id, itemData) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/api/admin/shop-items/${id}`, itemData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  deleteItem: async (id) => {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${API_URL}/api/admin/shop-items/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // 카테고리 관련
  getAllCategories: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/admin/item-categories`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  createCategory: async (categoryData) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/api/admin/item-categories`, categoryData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  updateCategory: async (id, categoryData) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/api/admin/item-categories/${id}`, categoryData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  deleteCategory: async (id) => {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${API_URL}/api/admin/item-categories/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // ============ 유저 상점 기능 ============

  /**
   * 활성화된 상점 아이템 목록 조회
   */
  getActiveShopItems: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/shop/items`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * 카테고리별 상점 아이템 조회
   */
  getShopItemsByCategory: async (categoryId) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/shop/items/category/${categoryId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * 활성화된 카테고리 목록 조회
   */
  getActiveCategories: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/shop/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * 내 인벤토리 조회
   */
  getMyInventory: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/shop/my-inventory`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * 내 신규 아이템 조회 (NEW 배지 있는 아이템)
   */
  getMyNewItems: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/shop/my-inventory/new`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * 아이템 구매
   * @param {number} shopItemId - 구매할 아이템 ID
   * @param {boolean} autoEquip - 구매 후 즉시 착용 여부
   */
  purchaseItem: async (shopItemId, autoEquip = false) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/api/shop/purchase`,
      { shopItemId, autoEquip },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  /**
   * 아이템 착용/해제
   */
  toggleEquipItem: async (inventoryId) => {
    const token = localStorage.getItem('token');
    const response = await axios.patch(
      `${API_URL}/api/shop/my-inventory/${inventoryId}/toggle-equip`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  /**
   * 신규 아이템 확인 (NEW 배지 제거)
   */
  markItemAsViewed: async (inventoryId) => {
    const token = localStorage.getItem('token');
    const response = await axios.patch(
      `${API_URL}/api/shop/my-inventory/${inventoryId}/mark-viewed`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  /**
   * 중복 착용 아바타 정리 (데이터베이스 정리용)
   */
  cleanupEquippedAvatars: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/api/shop/cleanup-equipped-avatars`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  /**
   * 착용 중인 아바타 조회
   */
  getEquippedAvatar: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/shop/equipped-avatar`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};

export default shopService;
