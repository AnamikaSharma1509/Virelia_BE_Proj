import React, { useEffect, useState } from 'react';
import { patientApi } from '../../api/patientApi';
import { Report } from '../../types';
import {
  FileCheck2,
  Calendar,
  Sparkles,
  UserCheck,
  Compass,
  AlertCircle,
  Eye,
  X,
  ShieldAlert
} from 'lucide-react';

export const PatientReports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await patientApi.getReports();
        setReports(data);
      } catch (err) {
        setError('Failed to fetch practice reports.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  const openReport = async (reportId: string) => {
    try {
      const detail = await patientApi.getReportDetail(reportId);
      setSelectedReport(detail);
    } catch (err) {
      setError('Could not open report details.');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-36 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          My Practice Reports
        </h1>
        <p className="text-sm text-slate-500">
          Official reviewed feedback and recommendations released by your administrator.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Released Reports Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Once you submit an assessment and your mentor reviews and approves the report, it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-900 flex items-center justify-center">
                    <FileCheck2 className="w-5 h-5 text-purple-700" />
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Released
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">{r.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {r.ai_summary || 'Practice report ready for review.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Released: {r.released_at ? new Date(r.released_at).toLocaleDateString() : 'Recent'}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => openReport(r.id)}
                  className="w-full py-2.5 px-4 bg-indigo-950 hover:bg-indigo-900 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-teal-300" />
                  <span>View Full Report</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Modal Viewer */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                  Official Practice Report
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  {selectedReport.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Assessment Score Section */}
            {selectedReport.assessment_data && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Assessment</span>
                  <span className="font-bold text-slate-900 truncate block">{selectedReport.assessment_data.assessment_title}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">MCQ Points</span>
                  <span className="font-bold text-slate-900">{selectedReport.assessment_data.awarded_points} / {selectedReport.assessment_data.total_points}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Percentage</span>
                  <span className="font-extrabold text-teal-700">{selectedReport.assessment_data.percentage}%</span>
                </div>
              </div>
            )}

            {/* AI-Assisted Summary (Clearly Labeled) */}
            <div className="bg-purple-50/60 border border-purple-200/80 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-900 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>AI-Assisted Analysis Draft</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {selectedReport.ai_summary || 'No qualitative summary provided.'}
              </p>
            </div>

            {/* Human-Reviewed Feedback from Doctor/Admin */}
            <div className="bg-teal-50/60 border border-teal-200/80 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-900 uppercase tracking-wider">
                <UserCheck className="w-4 h-4 text-teal-700" />
                <span>Mentor / Professional Feedback</span>
              </div>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {selectedReport.reviewer_feedback || 'No specific comments added.'}
              </p>
              {selectedReport.reviewer_name && (
                <span className="text-[10px] text-teal-800 block pt-1">
                  Reviewed by: {selectedReport.reviewer_name}
                </span>
              )}
            </div>

            {/* Practice Recommendations */}
            {selectedReport.practice_recommendations && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  <Compass className="w-4 h-4 text-indigo-700" />
                  <span>Recommended Practice Steps</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {selectedReport.practice_recommendations}
                </p>
              </div>
            )}

            {/* Non-Diagnostic Disclaimer */}
            <div className="p-3 bg-amber-50 border border-amber-200/70 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
              <span>
                <strong>Non-Diagnostic Notice:</strong> This feedback is designed exclusively for personal skill practice and self-reflection. It does not constitute a psychological or clinical evaluation.
              </span>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="px-5 py-2.5 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
