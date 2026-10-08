import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { patientApi } from '../../api/patientApi';
import {
  ClipboardList,
  CheckCircle2,
  Compass,
  Video,
  FileCheck2,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export const PatientDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await patientApi.getDashboard();
        setDashboardData(data);
      } catch (err) {
        setError('Failed to load dashboard metrics. Ensure backend service is running.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-200 rounded-2xl w-full"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const {
    first_name,
    pending_assessments_count = 0,
    completed_assessments_count = 0,
    assigned_scenarios_count = 0,
    completed_sessions_count = 0,
    released_reports_count = 0,
    recent_activities = [],
    comfort_trends = [],
  } = dashboardData || {};

  const metrics = [
    { label: 'Pending Assessments', value: pending_assessments_count, icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-50', link: '/patient/assessments' },
    { label: 'Completed Assessments', value: completed_assessments_count, icon: CheckCircle2, color: 'text-teal-600', bg: 'bg-teal-50', link: '/patient/assessments' },
    { label: 'Assigned Scenarios', value: assigned_scenarios_count, icon: Compass, color: 'text-indigo-600', bg: 'bg-indigo-50', link: '/patient/scenarios' },
    { label: 'Completed Sessions', value: completed_sessions_count, icon: Video, color: 'text-blue-600', bg: 'bg-blue-50', link: '/patient/sessions' },
    { label: 'Reports Available', value: released_reports_count, icon: FileCheck2, color: 'text-purple-600', bg: 'bg-purple-50', link: '/patient/reports' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-teal-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Practice Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {first_name}!
          </h1>
          <p className="text-sm text-indigo-200 max-w-xl">
            "Your progress starts with one step at a time." Check your pending assessments or continue your guided scenario practice.
          </p>
        </div>
        <div className="shrink-0 flex gap-3">
          <Link
            to="/patient/assessments"
            className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold rounded-xl text-xs sm:text-sm shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>My Assessments</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/patient/scenarios"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors"
          >
            Guided Practice
          </Link>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.label}
              to={m.link}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 leading-tight">{m.label}</span>
                <div className={`w-8 h-8 rounded-lg ${m.bg} ${m.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-extrabold text-slate-900">{m.value}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Grid: Comfort Trends Chart & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Progress Overview Chart */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-700" />
                <span>Patient-Reported Comfort Ratings</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Self-reported comfort levels (scale 1–10) across completed practice sessions.
              </p>
            </div>
            <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded">
              Subjective Reflection Only
            </span>
          </div>

          {comfort_trends && comfort_trends.length > 0 ? (
            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={comfort_trends} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="session_num" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[1, 10]} ticks={[1, 3, 5, 7, 10]} stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="pre_comfort"
                    name="Pre-Session Comfort"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="post_comfort"
                    name="Post-Session Comfort"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <Compass className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No session comfort data yet</p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Complete your first guided practice scenario session to visualize your pre- and post-session self-reported comfort levels.
              </p>
              <Link
                to="/patient/scenarios"
                className="mt-4 px-4 py-2 bg-indigo-950 text-white text-xs font-semibold rounded-lg hover:bg-indigo-900 transition-colors"
              >
                Go to Guided Practice
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity List */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-700" />
              <span>Recent Activity</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Your latest assessment submissions and sessions.
            </p>
          </div>

          <div className="flex-1 space-y-3">
            {recent_activities && recent_activities.length > 0 ? (
              recent_activities.map((act: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span className="truncate max-w-[180px]">{act.title}</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-slate-200/70 text-slate-700 rounded">
                      {act.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {new Date(act.date).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs">
                No recent activity recorded.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <Link
              to="/patient/reports"
              className="text-xs font-semibold text-indigo-950 hover:text-teal-700 inline-flex items-center gap-1"
            >
              <span>View Approved Reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
