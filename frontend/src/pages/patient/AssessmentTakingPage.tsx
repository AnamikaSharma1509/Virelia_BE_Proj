import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { patientApi } from '../../api/patientApi';
import { assessmentApi } from '../../api/assessmentApi';
import { Assessment, AssessmentAttempt, Question, AnswerItem } from '../../types';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Save,
  HelpCircle,
  FileCheck2,
  Clock,
  Sparkles
} from 'lucide-react';

export const AssessmentTakingPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<any>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [qId: string]: { selected_option?: string; written_answer?: string } }>({});
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!assignmentId) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        // Start or resume attempt
        const attemptData = await assessmentApi.startOrResumeAttempt(assignmentId);
        setAttempt(attemptData);

        // Load assessment questions
        const allAssignments = await patientApi.getAssignments();
        const currentAssign = allAssignments.find(a => a.id === assignmentId);
        setAssignment(currentAssign);

        if (currentAssign?.assessment_id) {
          const assData = await assessmentApi.getAssessment(currentAssign.assessment_id);
          setAssessment(assData);
        }

        // Prepopulate existing answers if resumed
        if (attemptData.answers && attemptData.answers.length > 0) {
          const loaded: any = {};
          attemptData.answers.forEach(ans => {
            loaded[ans.question_id] = {
              selected_option: ans.selected_option || undefined,
              written_answer: ans.written_answer || undefined,
            };
          });
          setAnswers(loaded);
        }

        if (attemptData.status !== 'in_progress') {
          setIsSubmitted(true);
          setSubmissionResult(attemptData);
        }
      } catch (err: any) {
        setErrorMessage(err.response?.data?.detail || 'Failed to load assessment attempt.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [assignmentId]);

  const questions: Question[] = assessment?.questions || [];
  const currentQuestion = questions[currentIndex];

  const handleSelectOption = (opt: string) => {
    if (!currentQuestion) return;
    const updated = {
      ...answers,
      [currentQuestion.id]: {
        ...answers[currentQuestion.id],
        selected_option: opt,
      },
    };
    setAnswers(updated);
    autosaveAnswers(updated);
  };

  const handleWrittenChange = (text: string) => {
    if (!currentQuestion) return;
    const updated = {
      ...answers,
      [currentQuestion.id]: {
        ...answers[currentQuestion.id],
        written_answer: text,
      },
    };
    setAnswers(updated);
  };

  const autosaveAnswers = async (currentAns = answers) => {
    if (!attempt || attempt.status !== 'in_progress') return;
    try {
      setIsAutosaving(true);
      const payload: AnswerItem[] = Object.entries(currentAns).map(([qId, val]) => ({
        question_id: qId,
        selected_option: val.selected_option,
        written_answer: val.written_answer,
      }));
      await assessmentApi.saveDraftAnswers(attempt.id, payload);
    } catch (e) {
      // Background autosave failure - non-blocking
    } finally {
      setIsAutosaving(false);
    }
  };

  const handleSubmitAssessment = async () => {
    if (!attempt) return;
    try {
      setIsSubmitting(true);
      const payload: AnswerItem[] = Object.entries(answers).map(([qId, val]) => ({
        question_id: qId,
        selected_option: val.selected_option,
        written_answer: val.written_answer,
      }));

      const res = await assessmentApi.submitAttempt(attempt.id, payload);
      setSubmissionResult(res);
      setIsSubmitted(true);
      setShowConfirmModal(false);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse py-8">
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  if (errorMessage && !isSubmitted) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 space-y-4">
        <div className="flex items-center gap-2 font-bold text-base">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Error</span>
        </div>
        <p className="text-sm">{errorMessage}</p>
        <Link to="/patient/assessments" className="inline-block text-xs font-semibold underline">
          Return to Assessments
        </Link>
      </div>
    );
  }

  // Submission Completed Screen
  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 text-center space-y-6 shadow-sm my-6">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Assessment Submitted Successfully!
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Your objective answers have been scored and submitted for AI-assisted qualitative draft summarization.
          </p>
        </div>

        {submissionResult && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 max-w-sm mx-auto text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Objective MCQ Points:</span>
              <span className="font-bold text-slate-900">{submissionResult.awarded_points} / {submissionResult.total_points}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Objective Percentage:</span>
              <span className="font-bold text-teal-700">{submissionResult.percentage}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Review Status:</span>
              <span className="font-semibold text-purple-700 uppercase">{submissionResult.status}</span>
            </div>
          </div>
        )}

        <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 text-left space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-700" />
            <span>Human Review Required:</span>
          </p>
          <p className="text-slate-600 leading-relaxed">
            Your written reflections are now awaiting clinical/administrative review. Once approved and released by your supervisor, your official practice report will be available in <strong>My Reports</strong>.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/patient/dashboard"
            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-950 text-white font-semibold rounded-xl text-sm hover:bg-indigo-900 transition-colors"
          >
            Return to Dashboard
          </Link>
          <Link
            to="/patient/assessments"
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-200 transition-colors"
          >
            My Assessments
          </Link>
        </div>
      </div>
    );
  }

  const answeredCount = questions.filter(q => {
    const val = answers[q.id];
    return val?.selected_option || (val?.written_answer && val.written_answer.trim().length > 0);
  }).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header & Navigation Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <button
            onClick={() => navigate('/patient/assessments')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Assessments
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {assessment?.title || 'Practice Assessment'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Category: <span className="font-medium text-slate-700">{assessment?.category}</span> • Estimated: {assessment?.estimated_duration} mins
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-700">
              {answeredCount} of {questions.length} Answered
            </span>
            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-teal-600 transition-all duration-300"
                style={{ width: `${(answeredCount / Math.max(questions.length, 1)) * 100}%` }}
              ></div>
            </div>
          </div>
          {isAutosaving && (
            <span className="text-[10px] text-slate-400 italic flex items-center gap-1">
              <Save className="w-3 h-3 animate-pulse" /> Autosaving...
            </span>
          )}
        </div>
      </div>

      {/* Main Question Card & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Area */}
        <div className="lg:col-span-3 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6 flex flex-col justify-between min-h-[420px]">
          {currentQuestion ? (
            <div className="space-y-6">
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <span className="px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-900 rounded-md">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {currentQuestion.points} Point{currentQuestion.points > 1 ? 's' : ''}
                </span>
              </div>

              {/* Question Text */}
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed">
                {currentQuestion.question_text}
              </h2>

              {/* MCQ Options */}
              {currentQuestion.question_type === 'mcq' && currentQuestion.options && (
                <div className="space-y-3 pt-2">
                  {currentQuestion.options.map((opt, oIdx) => {
                    const isSelected = answers[currentQuestion.id]?.selected_option === opt;
                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => handleSelectOption(opt)}
                        className={`w-full p-4 rounded-xl text-left text-sm font-medium border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-indigo-50/70 border-indigo-600 text-indigo-950 ring-1 ring-indigo-600 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span>{opt}</span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Written Response Area */}
              {currentQuestion.question_type === 'written' && (
                <div className="space-y-2 pt-2">
                  <textarea
                    rows={6}
                    value={answers[currentQuestion.id]?.written_answer || ''}
                    onChange={(e) => handleWrittenChange(e.target.value)}
                    onBlur={() => autosaveAnswers()}
                    placeholder="Write your honest thoughts, reflections, and communication preparation here..."
                    className="w-full p-4 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent resize-y"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Self-reported qualitative reflection for mentor review</span>
                    <span>{(answers[currentQuestion.id]?.written_answer || '').length} characters</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>No questions available.</div>
          )}

          {/* Question Controls */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(currentIndex - 1)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex(currentIndex + 1)}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-950 hover:bg-indigo-900 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Next Question</span>
                <ArrowRight className="w-3.5 h-3.5 text-teal-300" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="px-6 py-2.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-600 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <span>Submit Assessment</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Question Navigator Panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Questions Overview
          </h3>

          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const val = answers[q.id];
              const isAnswered = val?.selected_option || (val?.written_answer && val.written_answer.trim().length > 0);
              const isCurrent = idx === currentIndex;

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-9 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center ${
                    isCurrent
                      ? 'bg-indigo-950 text-white shadow-xs ring-2 ring-indigo-950/20'
                      : isAnswered
                      ? 'bg-teal-50 text-teal-800 border border-teal-200'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-teal-100 border border-teal-300"></span>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-indigo-950"></span>
              <span>Current Question</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-slate-50 border border-slate-200"></span>
              <span>Unanswered</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            className="w-full mt-2 py-2.5 text-xs font-bold text-teal-900 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-xl transition-colors cursor-pointer"
          >
            Review & Submit
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              Ready to submit your assessment?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              You have answered <strong>{answeredCount} of {questions.length}</strong> questions.
              Once submitted, your answers will be finalized for backend scoring and administrator feedback.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Keep Reviewing
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitAssessment}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-950 hover:bg-indigo-900 rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
