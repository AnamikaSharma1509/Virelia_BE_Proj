import { apiClient } from './client';
import { ExposureSession } from '../types';

export const sessionApi = {
  async startSession(data: { scenario_id: string; video_id?: string; pre_comfort_rating: number }): Promise<ExposureSession> {
    const res = await apiClient.post('/sessions/start', data);
    return res.data;
  },

  async recordEvent(sessionId: string, event_type: string, event_data?: any) {
    const res = await apiClient.post(`/sessions/${sessionId}/events`, { event_type, event_data });
    return res.data;
  },

  async completeSession(sessionId: string, data: { post_comfort_rating: number; reflection?: string; duration_seconds: number }): Promise<ExposureSession> {
    const res = await apiClient.post(`/sessions/${sessionId}/complete`, data);
    return res.data;
  },

  async stopSession(sessionId: string, data: { post_comfort_rating?: number; reflection?: string; duration_seconds?: number }): Promise<ExposureSession> {
    const res = await apiClient.post(`/sessions/${sessionId}/stop`, data);
    return res.data;
  },

  async getSession(sessionId: string): Promise<ExposureSession> {
    const res = await apiClient.get(`/sessions/${sessionId}`);
    return res.data;
  },
};
