import { apiClient } from './client';
import { User, MFAChallenge } from '../types';

export const authApi = {
  async register(data: { full_name: string; email: string; password: string; consent_agreed: boolean }) {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },

  async login(data: { email: string; password: string }) {
    const res = await apiClient.post('/auth/login', data);
    return res.data;
  },

  async verifyMFA(data: { challenge_id: string; otp: string }) {
    const res = await apiClient.post('/auth/verify-mfa', data);
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  async changePassword(current_password: string, new_password: string) {
    const res = await apiClient.post('/auth/change-password', {
      current_password,
      new_password,
    });
    return res.data;
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('virelia_access_token');
      localStorage.removeItem('virelia_refresh_token');
      localStorage.removeItem('virelia_user');
    }
  },
};
