import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, ReportItem } from '../../api/adminApi';
import { 
  FileText, CheckCircle2, Send, Clock, 
  Search, ShieldAlert, AlertCircle, Edit3
} from 'lucide-react';

export const AdminReports: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedFeedback, setEditedFeedback] = useState('');
  const [editedRecommendations, setEditedRecommendations] = useState('');

  const { data: reports = [], isLoading, error } = useQuery({
    queryKey: ['admin-reports', statusFilter],
    queryFn: () => adminApi.getReports(statusFilter || undefined)
  });

  const approveMutation = useMutation({
    mutationFn: (reportId: string) => adminApi.approveReport(reportId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      setSelectedReport(updated);
    }
  });

  const releaseMutation = useMutation({
    mutationFn: (reportId: string) => adminApi.releaseReport(reportId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      setSelectedReport(updated);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ReportItem> }) => 
      adminApi.updateReport(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      setSelectedReport(updated);
      setIsEditing(false);
    }
  });

  const handleSelectReport = (r: ReportItem) => {
    setSelectedReport(r);
    setEditedFeedback(r.reviewer_feedback || '');
    setEditedRecommendations(r.practice_recommendations || '');
    setIsEditing(false);
  };

  const handleSaveEdits = () => {
    if (!selectedReport) return;
    updateMutation.mutate({
      id: selectedReport.id,
      data: {
        reviewer_feedback: editedFeedback,
        practice_recommendations: editedRecommendations
      }
    });
  };

  const filteredReports = reports.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.patient_name && r.patient_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clinical & Practice Reports</h1>
          <p className="text-slate-600 text-sm mt-1">
            Review AI summaries, edit doctor feedback, approve, and securely release reports to patients.
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-sm text-amber-900">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Safety & Release Protocol</p>
          <p className="mt-0.5 text-xs text-amber-800">
            AI summaries cannot be released directly without licensed administrator review. A report must be verified, reviewed, and approved before release to the patient portal.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Reports list */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input 
                type="text"
                placeholder="Search report or patient..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="awaiting_review">Awaiting Review</option>
              <option value="approved">Approved</option>
              <option value="released">Released</option>
            </select>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
              Loading reports...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-rose-600 bg-rose-50 rounded-xl border border-rose-200 text-sm">
              Failed to load reports.
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200 text-sm">
              No reports found.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => handleSelectReport(report)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    selectedReport?.id === report.id
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">{report.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Patient: <span className="text-slate-700 font-medium">{report.patient_name || report.patient_id.slice(0, 8)}</span>
                      </p>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      report.status === 'released'
                        ? 'bg-emerald-100 text-emerald-800'
                        : report.status === 'approved'
                        ? 'bg-blue-100 text-blue-800'
                        : report.status === 'awaiting_review'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {report.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                    {report.released_at && (
                      <span className="text-emerald-600 font-medium">
                        Released {new Date(report.released_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Report Preview & Review details */}
        <div className="lg:col-span-7">
          {selectedReport ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">{selectedReport.title}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      selectedReport.status === 'released'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedReport.status === 'approved'
                        ? 'bg-blue-100 text-blue-800'
                        : selectedReport.status === 'awaiting_review'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {selectedReport.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Patient ID: {selectedReport.patient_id} • Created {new Date(selectedReport.created_at).toLocaleString()}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  {selectedReport.status !== 'released' && (
                    <>
                      {selectedReport.status !== 'approved' && (
                        <button
                          onClick={() => approveMutation.mutate(selectedReport.id)}
                          disabled={approveMutation.isPending}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => releaseMutation.mutate(selectedReport.id)}
                        disabled={releaseMutation.isPending}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Release to Patient
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* AI Draft Summary section */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    AI-Assisted Preliminary Analysis
                  </span>
                  <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-medium">
                    Automated Summarizer
                  </span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {selectedReport.ai_summary || "No automated AI summary available for this submission."}
                </p>
                <p className="text-xs text-slate-400 italic">
                  * Generated with ethical non-diagnostic boundaries.
                </p>
              </div>

              {/* Reviewer Feedback / Doctor commentary */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-800">
                    Administrator / Doctor Feedback
                  </label>
                  {!isEditing && selectedReport.status !== 'released' && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Notes
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs text-slate-500 mb-1 block">Feedback & Clinical Observations:</span>
                      <textarea
                        rows={4}
                        value={editedFeedback}
                        onChange={e => setEditedFeedback(e.target.value)}
                        className="w-full text-sm border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter tailored feedback for the patient..."
                      />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 mb-1 block">Actionable Practice Recommendations:</span>
                      <textarea
                        rows={3}
                        value={editedRecommendations}
                        onChange={e => setEditedRecommendations(e.target.value)}
                        className="w-full text-sm border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="E.g., Complete Scenario 2 (Stage Practice) Level 1 before Friday..."
                      />
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdits}
                        disabled={updateMutation.isPending}
                        className="px-4 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                      >
                        {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-white border border-slate-200 rounded-lg p-3.5 text-sm text-slate-700">
                      {selectedReport.reviewer_feedback ? (
                        <p className="whitespace-pre-wrap">{selectedReport.reviewer_feedback}</p>
                      ) : (
                        <p className="text-slate-400 italic">No custom feedback entered yet.</p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                        Practice Recommendations
                      </h4>
                      <div className="bg-white border border-slate-200 rounded-lg p-3.5 text-sm text-slate-700">
                        {selectedReport.practice_recommendations ? (
                          <p className="whitespace-pre-wrap">{selectedReport.practice_recommendations}</p>
                        ) : (
                          <p className="text-slate-400 italic">No specific recommendations assigned.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Release status banner */}
              {selectedReport.status === 'released' ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    This report has been released and is directly visible in the patient's portal under <strong>My Reports</strong>.
                  </span>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-slate-400" />
                  <span>
                    This report is confidential to administrators until approved and explicitly released.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-sm">Select a report from the list to review, edit, approve, or release.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
