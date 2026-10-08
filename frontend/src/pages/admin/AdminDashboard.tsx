import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import {
  Users,
  UserCheck,
  ClipboardList,
  CheckCircle2,
  FileCheck2,
  Video,
  ArrowRight,
  Clock,
  AlertCircle,
  Eye,
  ShieldAlert
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await adminApi.getDashboard();
        setData(res);
      } catch (err) {
        setError('Failed to fetch admin metrics. Please ensure backend is running.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        <span>{error}</span>
      </div>
    );
  }

  const {
    total_patients = 0,
    active_patients = 0,
    pending_assessments = 0,
    submitted_awaiting_review = 0,
    reports_awaiting_approval = 0,
    completed_sessions = 0,
    scenario_overview = [],
    pending_queue = [],
    recent_activity = [],
  } = data || {};

  const stats = [
    { label: 'Total Patients', value: total_patients, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50', link: '/admin/patients' },
    { label: 'Active Patients', value: active_patients, icon: UserCheck, color: 'text-teal-600', bg: 'bg-teal-50', link: '/admin/patients' },
    { label: 'Pending Assessments', value: pending_assessments, icon: ClipboardList, color: 'text-amber-500', bg: 'bg-amber-50', link: '/admin/assignments' },
    { label: 'Awaiting Review', value: submitted_awaiting_review, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50', link: '/admin/submissions' },
    { label: 'Reports for Approval', value: reports_awaiting_approval, icon: FileCheck2, color: 'text-rose-500', bg: 'bg-rose-50', link: '/admin/reports' },
    { label: 'Completed Sessions', value: completed_sessions, icon: Video, color: 'text-indigo-600', bg: 'bg-indigo-50', link: '/admin/scenarios' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Administrator & Doctor Portal
          </h1>
          <p className="text-sm text-slate-500">
            Real-time patient oversight, assessment review queue, and scenario analytics.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/patients"
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors"
          >
            Manage Patients
          </Link>
          <Link
            to="/admin/submissions"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors"
          >
            Review Queue
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              to={s.link}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 leading-tight">{s.label}</span>
                <div className={`w-8 h-8 rounded-lg ${s.bg} ${s.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-extrabold text-slate-900">{s.value}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Two Column Grid: Pending Review Queue & Scenario Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Review Queue (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>Pending Review Queue</span>
              </h2>
              <p className="text-xs text-slate-500">
                Submitted student assessments requiring mentor review and approval before release.
              </p>
            </div>
            <Link
              to="/admin/submissions"
              className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {pending_queue.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No submissions currently waiting in review queue.
              </div>
            ) : (
              pending_queue.map((item: any) => (
                <div
                  key={item.attempt_id}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-4"
                >
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-slate-900">{item.patient_name}</h3>
                    <p className="text-xs text-slate-600">{item.assessment_title}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                      <span>Submitted: {new Date(item.submitted_at).toLocaleDateString()}</span>
                      <span>MCQ Score: <strong>{item.score_percentage}%</strong></span>
                    </div>
                  </div>

                  <Link
                    to={`/admin/submissions?attempt=${item.attempt_id}`}
                    className="px-3.5 py-1.5 bg-indigo-950 text-white rounded-lg text-xs font-semibold hover:bg-indigo-900 transition-colors shrink-0 flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Review</span>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Scenario Overview (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Video className="w-4 h-4 text-teal-600" />
              <span>Scenario Practice Stats</span>
            </h2>
            <p className="text-xs text-slate-500">
              Completed sessions across scenarios.
            </p>
          </div>

          <div className="space-y-3">
            {scenario_overview.map((sc: any) => (
              <div key={sc.scenario_id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                  <span className="truncate">{sc.title}</span>
                  <span className="text-teal-700">{sc.completed_count} done</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>{sc.category}</span>
                  <span>{sc.assigned_count} assigned</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-center border-t border-slate-100">
            <Link
              to="/admin/scenarios"
              className="text-xs font-semibold text-slate-700 hover:text-teal-700 inline-flex items-center gap-1"
            >
              <span>Manage Scenarios</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
