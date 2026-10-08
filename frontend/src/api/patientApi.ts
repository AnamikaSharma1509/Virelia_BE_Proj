import { apiClient } from './client';
import { AssessmentAssignment, Scenario, ExposureSession, Report, NotificationItem } from '../types';

export const patientApi = {
  async getDashboard() {
    const res = await apiClient.get('/patient/dashboard');
    return res.data;
  },

  async getProfile() {
    const res = await apiClient.get('/patient/profile');
    return res.data;
  },

  async updateProfile(data: any) {
    const res = await apiClient.patch('/patient/profile', data);
    return res.data;
  },

  async getAssignments(): Promise<AssessmentAssignment[]> {
    const res = await apiClient.get('/patient/assignments');
    return res.data;
  },

  async getScenarios(): Promise<Scenario[]> {
    const res = await apiClient.get('/patient/scenarios');
    return res.data;
  },

  async getSessions(): Promise<ExposureSession[]> {
    const res = await apiClient.get('/patient/sessions');
    return res.data;
  },

  async getReports(): Promise<Report[]> {
    const res = await apiClient.get('/patient/reports');
    return res.data;
  },

  async getReportDetail(reportId: string): Promise<Report> {
    const res = await apiClient.get(`/reports/${reportId}`);
    return res.data;
  },

  async getNotifications(): Promise<NotificationItem[]> {
    const res = await apiClient.get('/patient/notifications');
    return res.data;
  },

  async markNotificationRead(id: string) {
    const res = await apiClient.post(`/patient/notifications/${id}/read`);
    return res.data;
  },
};
