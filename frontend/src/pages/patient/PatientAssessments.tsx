import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { patientApi } from '../../api/patientApi';
import { AssessmentAssignment } from '../../types';
import { ClipboardList, Clock, ArrowRight, CheckCircle2, AlertCircle, FileCheck2 } from 'lucide-react';

export const PatientAssessments: React.FC = () => {
  const [assignments, setAssignments] = useState<AssessmentAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const data = await patientApi.getAssignments();
        setAssignments(data);
      } catch (err) {
        setError('Failed to fetch assigned assessments.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'assigned':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">Assigned</span>;
      case 'in_progress':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">In Progress</span>;
      case 'submitted':
      case 'under_review':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200">Under Review</span>;
      case 'approved':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-50 text-teal-700 border border-teal-200">Approved</span>;
      case 'released':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Report Released</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-44 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page Title */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          My Practice Assessments
        </h1>
        <p className="text-sm text-slate-500">
          Complete self-reflection assessments assigned by your administrator to track your confidence baseline.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Assessments Assigned Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Your administrator has not assigned an assessment to your account yet. Check back soon or contact your mentor.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments.map((a) => {
            const canTake = a.status === 'assigned' || a.status === 'in_progress';
            return (
              <div
                key={a.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-900 flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-indigo-700" />
                    </div>
                    {getStatusBadge(a.status)}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      {a.assessment_title || 'Practice Assessment'}
                    </h3>
                    {a.instructions && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {a.instructions}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Assigned: {new Date(a.assigned_at).toLocaleDateString()}
                    </span>
                    {a.due_date && (
                      <span>Due: {new Date(a.due_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  {canTake ? (
                    <Link
                      to={`/patient/assessments/${a.id}`}
                      className="w-full py-2.5 px-4 bg-indigo-950 hover:bg-indigo-900 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <span>{a.status === 'in_progress' ? 'Continue Assessment' : 'Start Assessment'}</span>
                      <ArrowRight className="w-4 h-4 text-teal-300" />
                    </Link>
                  ) : (
                    <div className="w-full flex items-center justify-between text-xs text-slate-500">
                      <span>Submitted & Under Review</span>
                      {a.status === 'released' && (
                        <Link
                          to="/patient/reports"
                          className="font-semibold text-teal-700 hover:underline flex items-center gap-1"
                        >
                          <FileCheck2 className="w-3.5 h-3.5" /> View Report
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
