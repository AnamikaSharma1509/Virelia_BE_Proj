import { apiClient } from './client';
import { Assessment, AssessmentAttempt, AnswerItem } from '../types';

export const assessmentApi = {
  async getAssessment(id: string): Promise<Assessment> {
    const res = await apiClient.get(`/assessments/${id}`);
    return res.data;
  },

  async startOrResumeAttempt(assignmentId: string): Promise<AssessmentAttempt> {
    const res = await apiClient.post(`/assignments/${assignmentId}/start`);
    return res.data;
  },

  async getAttempt(assignmentId: string): Promise<AssessmentAttempt> {
    const res = await apiClient.get(`/assignments/${assignmentId}/attempt`);
    return res.data;
  },

  async saveDraftAnswers(attemptId: string, answers: AnswerItem[]) {
    const res = await apiClient.put(`/attempts/${attemptId}/answers`, { answers });
    return res.data;
  },

  async submitAttempt(attemptId: string, answers: AnswerItem[]): Promise<AssessmentAttempt> {
    const res = await apiClient.post(`/attempts/${attemptId}/submit`, { answers });
    return res.data;
  },

  async getAttemptStatus(attemptId: string) {
    const res = await apiClient.get(`/attempts/${attemptId}/status`);
    return res.data;
  },
};
