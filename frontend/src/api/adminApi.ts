import { apiClient } from './client';
import { Assessment, AssessmentAssignment, Scenario, ScenarioVideo, Report, User } from '../types';

export interface ReportItem extends Report {
  patient_name?: string;
}

export const adminApi = {
  async getDashboard() {
    const res = await apiClient.get('/admin/dashboard');
    return res.data;
  },

  async listPatients(search?: string, statusFilter?: string) {
    const res = await apiClient.get('/admin/patients', {
      params: { search, status_filter: statusFilter }
    });
    return res.data;
  },

  async createPatient(data: { full_name: string; email: string; initial_password?: string; date_of_birth?: string }) {
    const res = await apiClient.post('/admin/patients', data);
    return res.data;
  },

  async getPatientDetail(patientId: string) {
    const res = await apiClient.get(`/admin/patients/${patientId}`);
    return res.data;
  },

  async activatePatient(patientId: string) {
    const res = await apiClient.post(`/admin/patients/${patientId}/activate`);
    return res.data;
  },

  async deactivatePatient(patientId: string) {
    const res = await apiClient.post(`/admin/patients/${patientId}/deactivate`);
    return res.data;
  },

  async listAssessments(): Promise<Assessment[]> {
    const res = await apiClient.get('/admin/assessments');
    return res.data;
  },

  async createAssessment(data: any): Promise<Assessment> {
    const res = await apiClient.post('/admin/assessments', data);
    return res.data;
  },

  async getAssessment(id: string): Promise<Assessment> {
    const res = await apiClient.get(`/admin/assessments/${id}`);
    return res.data;
  },

  async updateAssessment(id: string, data: any): Promise<Assessment> {
    const res = await apiClient.patch(`/admin/assessments/${id}`, data);
    return res.data;
  },

  async publishAssessment(id: string) {
    const res = await apiClient.post(`/admin/assessments/${id}/publish`);
    return res.data;
  },

  async archiveAssessment(id: string) {
    const res = await apiClient.post(`/admin/assessments/${id}/archive`);
    return res.data;
  },

  async listAssignments(): Promise<AssessmentAssignment[]> {
    const res = await apiClient.get('/admin/assignments');
    return res.data;
  },

  async createAssignments(data: { assessment_id: string; patient_ids: string[]; due_date?: string; instructions?: string }) {
    const res = await apiClient.post('/admin/assignments', data);
    return res.data;
  },

  async revokeAssignment(id: string) {
    const res = await apiClient.delete(`/admin/assignments/${id}`);
    return res.data;
  },

  async listSubmissions(statusFilter?: string) {
    const res = await apiClient.get('/admin/submissions', {
      params: { status_filter: statusFilter }
    });
    return res.data;
  },

  async getSubmission(attemptId: string) {
    const res = await apiClient.get(`/admin/submissions/${attemptId}`);
    return res.data;
  },

  async triggerAIAnalysis(attemptId: string) {
    const res = await apiClient.post(`/admin/submissions/${attemptId}/analyze`);
    return res.data;
  },

  async reviewSubmission(attemptId: string, data: { reviewer_feedback: string; practice_recommendations?: string; ai_summary?: string }) {
    const res = await apiClient.post(`/admin/submissions/${attemptId}/review`, data);
    return res.data;
  },

  async approveSubmission(attemptId: string) {
    const res = await apiClient.post(`/admin/submissions/${attemptId}/approve`);
    return res.data;
  },

  async releaseSubmission(attemptId: string) {
    const res = await apiClient.post(`/admin/submissions/${attemptId}/release`);
    return res.data;
  },

  async listScenarios(): Promise<Scenario[]> {
    const res = await apiClient.get('/admin/scenarios');
    return res.data;
  },

  async assignScenario(scenarioId: string, patientIds: string[]) {
    const res = await apiClient.post(`/admin/scenarios/${scenarioId}/assign`, {
      scenario_id: scenarioId,
      patient_ids: patientIds
    });
    return res.data;
  },

  async listScenarioAssignments(): Promise<any[]> {
    const res = await apiClient.get('/admin/scenario-assignments');
    return res.data;
  },

  async revokeScenarioAssignment(assignmentId: string) {
    const res = await apiClient.delete(`/admin/scenario-assignments/${assignmentId}`);
    return res.data;
  },

  async listVideos(): Promise<ScenarioVideo[]> {
    const res = await apiClient.get('/admin/videos');
    return res.data;
  },

  async uploadVideo(videoId: string, file: File) {
    const formData = new FormData();
    formData.append('video_id', videoId);
    formData.append('file', file);
    const res = await apiClient.post('/admin/videos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  async listReports(statusFilter?: string): Promise<ReportItem[]> {
    const res = await apiClient.get('/admin/reports', {
      params: { status_filter: statusFilter }
    });
    return res.data;
  },

  async getReports(statusFilter?: string): Promise<ReportItem[]> {
    return this.listReports(statusFilter);
  },

  async updateReport(reportId: string, data: any): Promise<ReportItem> {
    const res = await apiClient.patch(`/admin/reports/${reportId}`, data);
    return res.data;
  },

  async approveReport(reportId: string) {
    const res = await apiClient.post(`/admin/reports/${reportId}/approve`);
    return res.data;
  },

  async releaseReport(reportId: string) {
    const res = await apiClient.post(`/admin/reports/${reportId}/release`);
    return res.data;
  },
};
