export type UserRole = 'patient' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  mfa_enabled: boolean;
  created_at: string;
  last_login_at?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface MFAChallenge {
  mfa_required: boolean;
  challenge_id: string;
  message: string;
}

export interface Question {
  id: string;
  assessment_id: string;
  question_text: string;
  question_type: 'mcq' | 'written';
  options?: string[];
  correct_option?: string;
  points: number;
  is_required: boolean;
  order_index: number;
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  category: string;
  estimated_duration: number;
  is_published: boolean;
  questions?: Question[];
  created_at: string;
  updated_at?: string;
}

export interface AssessmentAssignment {
  id: string;
  assessment_id: string;
  patient_id: string;
  patient_name?: string;
  patient_email?: string;
  assessment_title?: string;
  assigned_at: string;
  due_date?: string;
  status: 'assigned' | 'in_progress' | 'submitted' | 'under_review' | 'approved' | 'released';
  instructions?: string;
}

export interface AnswerItem {
  question_id: string;
  selected_option?: string;
  written_answer?: string;
}

export interface AssessmentAttempt {
  id: string;
  assignment_id: string;
  patient_id: string;
  started_at: string;
  submitted_at?: string;
  status: string;
  total_points: number;
  awarded_points: number;
  percentage: number;
  answers: {
    id: string;
    question_id: string;
    selected_option?: string;
    written_answer?: string;
    awarded_points: number;
    is_correct?: boolean;
  }[];
}

export interface ScenarioVideo {
  id: string;
  scenario_id: string;
  title: string;
  description?: string;
  level: number;
  mime_type: string;
  file_size: number;
  duration_seconds: number;
  is_active: boolean;
  has_video_file: boolean;
}

export interface Scenario {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  instructions?: string;
  safety_notice?: string;
  is_active: boolean;
  is_assigned: boolean;
  videos: ScenarioVideo[];
}

export interface ExposureSession {
  id: string;
  patient_id: string;
  patient_name?: string;
  scenario_id: string;
  scenario_title?: string;
  video_id?: string;
  video_title?: string;
  started_at: string;
  completed_at?: string;
  duration_seconds: number;
  pre_comfort_rating?: number;
  post_comfort_rating?: number;
  reflection?: string;
  status: 'created' | 'in_progress' | 'completed' | 'interrupted' | 'stopped';
  created_at: string;
}

export interface Report {
  id: string;
  patient_id: string;
  patient_name?: string;
  assessment_attempt_id?: string;
  session_id?: string;
  title: string;
  ai_summary?: string;
  reviewer_feedback?: string;
  practice_recommendations?: string;
  status: 'draft' | 'awaiting_review' | 'approved' | 'released';
  reviewed_by?: string;
  reviewer_name?: string;
  approved_at?: string;
  released_at?: string;
  created_at: string;
  updated_at: string;
  assessment_data?: {
    assessment_title: string;
    percentage: number;
    awarded_points: number;
    total_points: number;
    submitted_at: string;
  };
  ai_analysis?: {
    analysis_json: {
      summary?: string;
      observed_themes?: string[];
      strengths?: string[];
      practice_suggestions?: string[];
      limitations?: string[];
    };
  };
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  related_entity_type?: string;
  related_entity_id?: string;
  created_at: string;
}
