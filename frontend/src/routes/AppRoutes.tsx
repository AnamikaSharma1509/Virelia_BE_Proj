import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Public pages
import { LandingPage } from '../pages/public/LandingPage';
import { AboutPage } from '../pages/public/AboutPage';
import { SafetyPage } from '../pages/public/SafetyPage';
import { PrivacyPage } from '../pages/public/PrivacyPage';
import { TermsPage } from '../pages/public/TermsPage';

// Auth pages
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';

// Layouts
import { PatientLayout } from '../components/layout/PatientLayout';
import { AdminLayout } from '../components/layout/AdminLayout';

// Patient pages
import { PatientDashboard } from '../pages/patient/PatientDashboard';
import { PatientProfile } from '../pages/patient/PatientProfile';
import { PatientAssessments } from '../pages/patient/PatientAssessments';
import { AssessmentTakingPage } from '../pages/patient/AssessmentTakingPage';
import { GuidedPracticePage } from '../pages/patient/GuidedPracticePage';
import { ScenarioSessionPlayer } from '../pages/patient/ScenarioSessionPlayer';
import { PatientSessions } from '../pages/patient/PatientSessions';
import { PatientReports } from '../pages/patient/PatientReports';

// Admin pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminPatients } from '../pages/admin/AdminPatients';
import { AdminPatientDetail } from '../pages/admin/AdminPatientDetail';
import { AdminAssessments } from '../pages/admin/AdminAssessments';
import { AdminAssignments } from '../pages/admin/AdminAssignments';
import { AdminSubmissions } from '../pages/admin/AdminSubmissions';
import { AdminScenarios } from '../pages/admin/AdminScenarios';
import { AdminVideos } from '../pages/admin/AdminVideos';
import { AdminReports } from '../pages/admin/AdminReports';
import { AdminSettings } from '../pages/admin/AdminSettings';

// Route guards
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRole?: 'patient' | 'admin';
}> = ({ children, allowedRole }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Verifying session credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // Redirect to their respective authorized dashboard
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/patient/dashboard'} replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/safety" element={<SafetyPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      
      {/* Authentication */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Patient Portal (Protected, role: patient) */}
      <Route
        path="/patient"
        element={
          <ProtectedRoute allowedRole="patient">
            <PatientLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PatientDashboard />} />
        <Route path="profile" element={<PatientProfile />} />
        <Route path="assessments" element={<PatientAssessments />} />
        <Route path="assessments/:assignmentId" element={<AssessmentTakingPage />} />
        <Route path="scenarios" element={<GuidedPracticePage />} />
        <Route path="scenarios/:scenarioId" element={<ScenarioSessionPlayer />} />
        <Route path="sessions" element={<PatientSessions />} />
        <Route path="sessions/:sessionId" element={<ScenarioSessionPlayer />} />
        <Route path="reports" element={<PatientReports />} />
      </Route>

      {/* Admin Portal (Protected, role: admin) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="patients" element={<AdminPatients />} />
        <Route path="patients/:patientId" element={<AdminPatientDetail />} />
        <Route path="assessments" element={<AdminAssessments />} />
        <Route path="assignments" element={<AdminAssignments />} />
        <Route path="submissions" element={<AdminSubmissions />} />
        <Route path="scenarios" element={<AdminScenarios />} />
        <Route path="videos" element={<AdminVideos />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Wildcard 404 Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
