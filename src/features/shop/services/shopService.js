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
  }
};

export default shopService;
