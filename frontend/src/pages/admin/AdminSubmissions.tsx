import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  UserCheck,
  AlertCircle,
  Eye,
  X,
  FileCheck2,
  RefreshCw,
  Send
} from 'lucide-react';

export const AdminSubmissions: React.FC = () => {
  const [searchParams] = useSearchParams();
  const attemptParam = searchParams.get('attempt');

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Review Drawer / Modal State
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(attemptParam || null);
  const [submissionDetail, setSubmissionDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Review Edit Fields
  const [reviewerFeedback, setReviewerFeedback] = useState('');
  const [practiceRecs, setPracticeRecs] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.listSubmissions(statusFilter);
      setSubmissions(data);
    } catch (err) {
      setError('Failed to fetch submissions review queue.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);

  useEffect(() => {
    if (activeAttemptId) {
      openDetail(activeAttemptId);
    }
  }, [activeAttemptId]);

  const openDetail = async (attemptId: string) => {
    try {
      setDetailLoading(true);
      setActionSuccess('');
      setActionError('');
      const detail = await adminApi.getSubmission(attemptId);
      setSubmissionDetail(detail);
      setReviewerFeedback(detail.report?.reviewer_feedback || '');
      setPracticeRecs(detail.report?.practice_recommendations || '');
      setAiSummary(detail.report?.ai_summary || detail.ai_analysis?.analysis_json?.summary || '');
    } catch (err) {
      setActionError('Could not load submission details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSaveReview = async () => {
    if (!submissionDetail) return;
    try {
      setActionSuccess('');
      setActionError('');
      await adminApi.reviewSubmission(submissionDetail.attempt_id, {
        reviewer_feedback: reviewerFeedback,
        practice_recommendations: practiceRecs,
        ai_summary: aiSummary,
      });
      setActionSuccess('Review feedback saved successfully.');
      openDetail(submissionDetail.attempt_id);
      fetchSubmissions();
    } catch (err: any) {
      setActionError('Failed to save review.');
    }
  };

  const handleApprove = async () => {
    if (!submissionDetail) return;
    try {
      setActionSuccess('');
      setActionError('');
      await adminApi.reviewSubmission(submissionDetail.attempt_id, {
        reviewer_feedback: reviewerFeedback,
        practice_recommendations: practiceRecs,
        ai_summary: aiSummary,
      });
      await adminApi.approveSubmission(submissionDetail.attempt_id);
      setActionSuccess('Report approved! Ready for patient release.');
      openDetail(submissionDetail.attempt_id);
      fetchSubmissions();
    } catch (err: any) {
      setActionError('Approval failed.');
    }
  };

  const handleRelease = async () => {
    if (!submissionDetail) return;
    try {
      setActionSuccess('');
      setActionError('');
      await adminApi.releaseSubmission(submissionDetail.attempt_id);
      setActionSuccess('Report released! Patient notified.');
      openDetail(submissionDetail.attempt_id);
      fetchSubmissions();
    } catch (err: any) {
      setActionError('Release failed.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Submission Review Queue
          </h1>
          <p className="text-sm text-slate-500">
            Review objective MCQ scores, edit AI qualitative feedback drafts, and approve official reports.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 self-start sm:self-auto"
        >
          <option value="">All Review Statuses</option>
          <option value="under_review">Under Review Only</option>
          <option value="approved">Approved (Unreleased)</option>
          <option value="released">Released to Patient</option>
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Submissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                <th className="px-6 py-3.5">Patient</th>
                <th className="px-6 py-3.5">Assessment</th>
                <th className="px-6 py-3.5">Submission Date</th>
                <th className="px-6 py-3.5">MCQ Score</th>
                <th className="px-6 py-3.5">Review Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                    No submissions matching filter.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub.attempt_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {sub.patient_name} <span className="text-slate-400 font-normal">({sub.patient_email})</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{sub.assessment_title}</td>
                    <td className="px-6 py-4 text-slate-400">
                      {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-teal-700">{sub.percentage}%</span>{' '}
                      <span className="text-slate-400">({sub.awarded_points}/{sub.total_points})</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                          sub.status === 'released'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : sub.status === 'approved'
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {sub.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setActiveAttemptId(sub.attempt_id)}
                        className="px-3 py-1.5 bg-indigo-950 text-white rounded-lg text-xs font-semibold hover:bg-indigo-900 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-teal-300" />
                        <span>Open Review</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Approval Modal */}
      {submissionDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                  Assessment Submission Review
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  {submissionDetail.patient?.full_name} - {submissionDetail.assessment?.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSubmissionDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionSuccess && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {actionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                {actionError}
              </div>
            )}

            {/* Answers & Correctness */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Submitted Answers & Scoring
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {submissionDetail.answers?.map((ans: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>Q{idx + 1}: {ans.question_text}</span>
                      <span className={ans.is_correct ? 'text-teal-700' : 'text-slate-500'}>
                        {ans.question_type === 'mcq'
                          ? ans.is_correct ? `✓ Correct (+${ans.awarded_points} pts)` : '✗ Incorrect (0 pts)'
                          : 'Written Reflection'}
                      </span>
                    </div>

                    {ans.question_type === 'mcq' && (
                      <p className="text-slate-600">
                        Selected: <span className="font-semibold">{ans.selected_option || 'None'}</span>
                        {!ans.is_correct && (
                          <span className="text-slate-400 ml-2">(Correct: {ans.correct_option})</span>
                        )}
                      </p>
                    )}

                    {ans.question_type === 'written' && (
                      <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 italic mt-1">
                        "{ans.written_answer || 'No response provided.'}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* AI Qualitative Draft */}
            <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-purple-900 uppercase">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>AI-Assisted Analysis Draft</span>
              </div>
              <textarea
                rows={2}
                value={aiSummary}
                onChange={(e) => setAiSummary(e.target.value)}
                className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs text-slate-800"
              />
            </div>

            {/* Doctor / Mentor Feedback & Recommendations */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mentor / Administrator Feedback:
                </label>
                <textarea
                  rows={3}
                  value={reviewerFeedback}
                  onChange={(e) => setReviewerFeedback(e.target.value)}
                  placeholder="Add personalized encouraging comments and coaching observations..."
                  className="w-full p-3 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assigned Practice Recommendations:
                </label>
                <textarea
                  rows={2}
                  value={practiceRecs}
                  onChange={(e) => setPracticeRecs(e.target.value)}
                  placeholder="e.g. Complete Level 1 Interview Practice twice before progressing to Level 2."
                  className="w-full p-3 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={handleSaveReview}
                className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Save Draft Feedback
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleApprove}
                  className="px-4 py-2 font-semibold text-teal-800 bg-teal-50 border border-teal-300 hover:bg-teal-100 rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Approve Report</span>
                </button>
                <button
                  type="button"
                  onClick={handleRelease}
                  className="px-5 py-2 font-semibold text-white bg-indigo-950 hover:bg-indigo-900 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-teal-300" />
                  <span>Release to Patient</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
