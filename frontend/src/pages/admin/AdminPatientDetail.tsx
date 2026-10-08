import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import {
  ArrowLeft,
  User,
  ClipboardList,
  Video,
  FileCheck2,
  Calendar,
  AlertCircle,
  Plus,
  Compass,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const AdminPatientDetail: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'assessments' | 'sessions' | 'reports' | 'scenarios'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDetail = async () => {
    if (!patientId) return;
    try {
      setIsLoading(true);
      const res = await adminApi.getPatientDetail(patientId);
      setPatient(res);
    } catch (err) {
      setError('Failed to load patient record.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [patientId]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-pulse py-8">
        <div className="h-10 bg-slate-200 rounded w-1/4"></div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700">
        Patient record not found.
      </div>
    );
  }

  const {
    full_name,
    email,
    is_active,
    created_at,
    assignments = [],
    attempts = [],
    sessions = [],
    reports = [],
    scenario_assignments = [],
  } = patient;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Top Header */}
      <div>
        <button
          onClick={() => navigate('/admin/patients')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-3 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Patients
        </button>

        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-950 text-teal-300 font-extrabold flex items-center justify-center text-xl shadow-xs">
              {full_name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{full_name}</h1>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                }`}>
                  {is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{email} • Registered {new Date(created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/admin/assignments`}
              className="px-3.5 py-2 bg-indigo-950 text-white rounded-xl text-xs font-semibold hover:bg-indigo-900 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-teal-300" />
              <span>Assign Assessment</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold uppercase tracking-wider text-slate-500">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 border-b-2 cursor-pointer ${activeTab === 'overview' ? 'border-teal-600 text-teal-800' : 'border-transparent hover:text-slate-900'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('assessments')}
          className={`pb-3 border-b-2 cursor-pointer ${activeTab === 'assessments' ? 'border-teal-600 text-teal-800' : 'border-transparent hover:text-slate-900'}`}
        >
          Assessments ({attempts.length})
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`pb-3 border-b-2 cursor-pointer ${activeTab === 'sessions' ? 'border-teal-600 text-teal-800' : 'border-transparent hover:text-slate-900'}`}
        >
          Practice Sessions ({sessions.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 border-b-2 cursor-pointer ${activeTab === 'reports' ? 'border-teal-600 text-teal-800' : 'border-transparent hover:text-slate-900'}`}
        >
          Reports ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab('scenarios')}
          className={`pb-3 border-b-2 cursor-pointer ${activeTab === 'scenarios' ? 'border-teal-600 text-teal-800' : 'border-transparent hover:text-slate-900'}`}
        >
          Assigned Scenarios ({scenario_assignments.length})
        </button>
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-xs text-slate-400 font-medium">Assigned Assessments</span>
            <p className="text-2xl font-black text-slate-900">{assignments.length}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-xs text-slate-400 font-medium">Completed Sessions</span>
            <p className="text-2xl font-black text-teal-700">{sessions.length}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-xs text-slate-400 font-medium">Available Reports</span>
            <p className="text-2xl font-black text-purple-700">{reports.length}</p>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ASSESSMENTS */}
      {activeTab === 'assessments' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                <th className="px-6 py-3.5">Assessment Title</th>
                <th className="px-6 py-3.5">Submitted Date</th>
                <th className="px-6 py-3.5">MCQ Score</th>
                <th className="px-6 py-3.5">Percentage</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attempts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No assessments completed yet.
                  </td>
                </tr>
              ) : (
                attempts.map((att: any) => (
                  <tr key={att.id}>
                    <td className="px-6 py-4 font-bold text-slate-900">{att.assessment_title}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {att.submitted_at ? new Date(att.submitted_at).toLocaleDateString() : 'In Progress'}
                    </td>
                    <td className="px-6 py-4">{att.awarded_points} / {att.total_points}</td>
                    <td className="px-6 py-4 font-bold text-teal-700">{att.percentage}%</td>
                    <td className="px-6 py-4 capitalize font-semibold">{att.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT: SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                <th className="px-6 py-3.5">Scenario</th>
                <th className="px-6 py-3.5">Video Level</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Duration</th>
                <th className="px-6 py-3.5">Comfort Rating</th>
                <th className="px-6 py-3.5">Reflection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No sessions recorded.
                  </td>
                </tr>
              ) : (
                sessions.map((s: any) => (
                  <tr key={s.id}>
                    <td className="px-6 py-4 font-bold text-slate-900">{s.scenario_title}</td>
                    <td className="px-6 py-4 text-slate-600">{s.video_title}</td>
                    <td className="px-6 py-4 text-slate-400">{new Date(s.started_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{Math.floor(s.duration_seconds / 60)}m {s.duration_seconds % 60}s</td>
                    <td className="px-6 py-4 font-bold">
                      {s.pre_comfort ?? '-'}/10 → {s.post_comfort ?? '-'}/10
                    </td>
                    <td className="px-6 py-4 text-slate-500 italic max-w-xs truncate">
                      {s.reflection || 'None'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT: REPORTS */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                <th className="px-6 py-3.5">Report Title</th>
                <th className="px-6 py-3.5">Created Date</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Approved Date</th>
                <th className="px-6 py-3.5">Released Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No reports generated yet.
                  </td>
                </tr>
              ) : (
                reports.map((r: any) => (
                  <tr key={r.id}>
                    <td className="px-6 py-4 font-bold text-slate-900">{r.title}</td>
                    <td className="px-6 py-4 text-slate-400">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 capitalize font-semibold">{r.status}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {r.approved_at ? new Date(r.approved_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {r.released_at ? new Date(r.released_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT: SCENARIOS */}
      {activeTab === 'scenarios' && (
        <div className="space-y-4">
          {scenario_assignments.length === 0 ? (
            <div className="bg-white p-8 text-center text-slate-400 rounded-2xl border border-slate-200 text-xs">
              No scenarios assigned yet.
            </div>
          ) : (
            scenario_assignments.map((sa: any) => (
              <div key={sa.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{sa.scenario_title}</h4>
                  <p className="text-xs text-slate-400">Assigned: {new Date(sa.assigned_at).toLocaleDateString()}</p>
                </div>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-teal-50 text-teal-700">
                  {sa.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
