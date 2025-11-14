import { create } from 'zustand';
import authService from '../services/authService';

const useAuthStore = create((set) => ({
  user: authService.getCurrentUser(),
  isAuthenticated: authService.isAuthenticated(),

  setUser: (user) => set({ user, isAuthenticated: true }),

  login: async (credentials) => {
    try {
      const data = await authService.login(credentials);
      set({ user: data.user, isAuthenticated: true });
      return data;
    } catch (error) {
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const data = await authService.register(userData);
      return data;
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false });
  }
}));

export default useAuthStore;
