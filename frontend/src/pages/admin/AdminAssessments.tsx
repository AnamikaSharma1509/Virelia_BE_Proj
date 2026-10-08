import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { Assessment, Question } from '../../types';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  CheckCircle2,
  Archive,
  AlertCircle,
  Eye,
  X,
  HelpCircle,
  Edit,
  Save
} from 'lucide-react';

export const AdminAssessments: React.FC = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Assessment Builder Modal State (Create New)
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Interview Confidence');
  const [duration, setDuration] = useState(15);
  const [isPublished, setIsPublished] = useState(true);
  const [questions, setQuestions] = useState<any[]>([
    {
      question_text: '',
      question_type: 'mcq',
      options: ['', ''],
      correct_option: '',
      points: 5.0,
      is_required: true,
    },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [builderError, setBuilderError] = useState('');

  // Assessment Inspector / Editor Modal State (Edit Existing)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('Interview Confidence');
  const [editDuration, setEditDuration] = useState(15);
  const [editPublished, setEditPublished] = useState(true);
  const [editQuestions, setEditQuestions] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const fetchAssessments = async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.listAssessments();
      setAssessments(data);
    } catch (err) {
      setError('Failed to fetch assessments.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  // --- Handlers for Create Modal ---
  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        question_type: 'mcq',
        options: ['', ''],
        correct_option: '',
        points: 5.0,
        is_required: true,
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleAddOption = (qIdx: number) => {
    const updated = [...questions];
    updated[qIdx].options.push('');
    setQuestions(updated);
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBuilderError('');

    if (questions.length === 0) {
      setBuilderError('Please add at least one question.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        setBuilderError(`Question #${i + 1} text cannot be blank.`);
        return;
      }
      if (q.question_type === 'mcq') {
        const validOpts = q.options.filter((o: string) => o.trim().length > 0);
        if (validOpts.length < 2) {
          setBuilderError(`Question #${i + 1} requires at least 2 options.`);
          return;
        }
        if (!q.correct_option) {
          setBuilderError(`Question #${i + 1} must have a designated correct answer.`);
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      await adminApi.createAssessment({
        title,
        description,
        category,
        estimated_duration: duration,
        is_published: isPublished,
        questions: questions.map((q, idx) => ({
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.question_type === 'mcq' ? q.options.filter((o: string) => o.trim().length > 0) : null,
          correct_option: q.question_type === 'mcq' ? q.correct_option : null,
          points: Number(q.points),
          is_required: true,
          order_index: idx,
        })),
      });

      setShowBuilderModal(false);
      setTitle('');
      setDescription('');
      setQuestions([
        {
          question_text: '',
          question_type: 'mcq',
          options: ['', ''],
          correct_option: '',
          points: 5.0,
          is_required: true,
        },
      ]);
      fetchAssessments();
    } catch (err: any) {
      setBuilderError(err.response?.data?.detail || 'Failed to create assessment.');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Handlers for Edit / Inspect Modal ---
  const handleOpenEdit = async (ass: Assessment) => {
    try {
      setIsLoading(true);
      const fullAss = await adminApi.getAssessment(ass.id);
      setEditingAssessment(fullAss);
      setEditTitle(fullAss.title);
      setEditDescription(fullAss.description || '');
      setEditCategory(fullAss.category || 'Interview Confidence');
      setEditDuration(fullAss.estimated_duration || 15);
      setEditPublished(fullAss.is_published);
      setEditQuestions(
        (fullAss.questions || []).map((q: any) => ({
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options || ['', ''],
          correct_option: q.correct_option || '',
          points: q.points || 5.0,
          is_required: q.is_required ?? true,
        }))
      );
      setEditError('');
      setEditSuccess('');
      setShowEditModal(true);
    } catch (err) {
      setError('Could not load assessment details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEditQuestion = () => {
    setEditQuestions([
      ...editQuestions,
      {
        question_text: '',
        question_type: 'mcq',
        options: ['', ''],
        correct_option: '',
        points: 5.0,
        is_required: true,
      },
    ]);
  };

  const handleRemoveEditQuestion = (idx: number) => {
    setEditQuestions(editQuestions.filter((_, i) => i !== idx));
  };

  const handleAddEditOption = (qIdx: number) => {
    const updated = [...editQuestions];
    updated[qIdx].options.push('');
    setEditQuestions(updated);
  };

  const handleSaveAssessmentEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssessment) return;
    setEditError('');

    if (editQuestions.length === 0) {
      setEditError('Please keep at least one question.');
      return;
    }

    for (let i = 0; i < editQuestions.length; i++) {
      const q = editQuestions[i];
      if (!q.question_text.trim()) {
        setEditError(`Question #${i + 1} text cannot be blank.`);
        return;
      }
      if (q.question_type === 'mcq') {
        const validOpts = q.options.filter((o: string) => o.trim().length > 0);
        if (validOpts.length < 2) {
          setEditError(`Question #${i + 1} requires at least 2 options.`);
          return;
        }
        if (!q.correct_option) {
          setEditError(`Question #${i + 1} must have a designated correct answer.`);
          return;
        }
      }
    }

    setIsUpdating(true);
    try {
      await adminApi.updateAssessment(editingAssessment.id, {
        title: editTitle,
        description: editDescription,
        category: editCategory,
        estimated_duration: editDuration,
        is_published: editPublished,
        questions: editQuestions.map((q, idx) => ({
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.question_type === 'mcq' ? q.options.filter((o: string) => o.trim().length > 0) : null,
          correct_option: q.question_type === 'mcq' ? q.correct_option : null,
          points: Number(q.points),
          is_required: true,
          order_index: idx,
        })),
      });

      setEditSuccess('Assessment and questions updated successfully!');
      fetchAssessments();
      setTimeout(() => {
        setShowEditModal(false);
        setEditSuccess('');
      }, 1200);
    } catch (err: any) {
      setEditError(err.response?.data?.detail || 'Failed to update assessment.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await adminApi.archiveAssessment(id);
      } else {
        await adminApi.publishAssessment(id);
      }
      fetchAssessments();
    } catch (err) {
      setError('Could not change publication status.');
    }
  };

  if (isLoading && assessments.length === 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-4 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Assessment Templates & Questions
          </h1>
          <p className="text-sm text-slate-500">
            View, modify, and build structured assessments with deterministic MCQs and qualitative written questions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowBuilderModal(true)}
          className="px-4 py-2.5 bg-indigo-950 hover:bg-indigo-900 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-teal-300" />
          <span>Create New Assessment</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Assessment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assessments.map((ass) => (
          <div
            key={ass.id}
            className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                  {ass.category}
                </span>
                <span
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                    ass.is_published
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {ass.is_published ? 'Published' : 'Draft / Archived'}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 leading-snug">{ass.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2">{ass.description}</p>

              <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                <span>{ass.questions?.length || 0} Questions</span>
                <span>Est: {ass.estimated_duration} mins</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleOpenEdit(ass)}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 text-indigo-700" />
                <span>View & Edit Questions</span>
              </button>

              <button
                type="button"
                onClick={() => handleTogglePublish(ass.id, ass.is_published)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  ass.is_published
                    ? 'text-slate-600 hover:bg-slate-100'
                    : 'text-teal-700 hover:bg-teal-50'
                }`}
              >
                {ass.is_published ? 'Archive' : 'Publish'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL 1: VIEW & EDIT ASSESSMENT QUESTIONS */}
      {showEditModal && editingAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                  Inspect & Modify Assessment
                </span>
                <h2 className="text-lg font-bold text-slate-900">{editingAssessment.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editSuccess && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>{editSuccess}</span>
              </div>
            )}

            {editError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveAssessmentEdits} className="space-y-6 text-xs">
              {/* Metadata Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Assessment Title
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                  >
                    <option value="Interview Confidence">Interview Confidence</option>
                    <option value="Stage & Presentation">Stage & Presentation</option>
                    <option value="Heights">Heights</option>
                    <option value="Congested Spaces">Congested Spaces</option>
                    <option value="General Confidence">General Confidence</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Estimated Duration (Mins)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editDuration}
                    onChange={(e) => setEditDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Description & Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>

              {/* Questions Section */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Questions & Rubric Items ({editQuestions.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddEditQuestion}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </button>
                </div>

                <div className="space-y-5 max-h-96 overflow-y-auto pr-1">
                  {editQuestions.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700">Question #{qIdx + 1}</span>
                        {editQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEditQuestion(qIdx)}
                            className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            required
                            placeholder="Enter question text..."
                            value={q.question_text}
                            onChange={(e) => {
                              const updated = [...editQuestions];
                              updated[qIdx].question_text = e.target.value;
                              setEditQuestions(updated);
                            }}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <select
                            value={q.question_type}
                            onChange={(e) => {
                              const updated = [...editQuestions];
                              updated[qIdx].question_type = e.target.value;
                              setEditQuestions(updated);
                            }}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                          >
                            <option value="mcq">Single-Choice MCQ</option>
                            <option value="written">Written Reflection</option>
                          </select>
                        </div>
                      </div>

                      {q.question_type === 'mcq' && (
                        <div className="space-y-2 pt-2 border-t border-slate-200/60">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                            Answer Options (Select the correct answer):
                          </label>
                          {q.options.map((opt: string, oIdx: number) => (
                            <div key={oIdx} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`edit_correct_${qIdx}`}
                                checked={q.correct_option === opt && opt.length > 0}
                                onChange={() => {
                                  const updated = [...editQuestions];
                                  updated[qIdx].correct_option = opt;
                                  setEditQuestions(updated);
                                }}
                                title="Mark as correct answer"
                                className="text-teal-600 focus:ring-teal-500 cursor-pointer"
                              />
                              <input
                                type="text"
                                placeholder={`Option ${oIdx + 1}`}
                                value={opt}
                                onChange={(e) => {
                                  const updated = [...editQuestions];
                                  const oldVal = updated[qIdx].options[oIdx];
                                  updated[qIdx].options[oIdx] = e.target.value;
                                  if (updated[qIdx].correct_option === oldVal) {
                                    updated[qIdx].correct_option = e.target.value;
                                  }
                                  setEditQuestions(updated);
                                }}
                                className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                              />
                              {q.correct_option === opt && opt.length > 0 && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                  Correct
                                </span>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleAddEditOption(qIdx)}
                            className="text-[11px] text-teal-800 font-semibold hover:underline cursor-pointer pt-1"
                          >
                            + Add Option
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-slate-500 pt-1">
                        <div className="flex items-center gap-2">
                          <span>Awarded Points:</span>
                          <input
                            type="number"
                            min={1}
                            value={q.points}
                            onChange={(e) => {
                              const updated = [...editQuestions];
                              updated[qIdx].points = Number(e.target.value);
                              setEditQuestions(updated);
                            }}
                            className="w-16 px-2 py-0.5 border border-slate-300 rounded text-center bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Edits */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 font-semibold text-white bg-indigo-950 hover:bg-indigo-900 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5 text-teal-300" />
                  <span>{isUpdating ? 'Saving...' : 'Save Assessment Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSESSMENT BUILDER MODAL (CREATE NEW) */}
      {showBuilderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Build Practice Assessment</h2>
              <button
                type="button"
                onClick={() => setShowBuilderModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {builderError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                {builderError}
              </div>
            )}

            <form onSubmit={handleCreateAssessment} className="space-y-6 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Assessment Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Behavioral Interview Readiness Assessment"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                  >
                    <option value="Interview Confidence">Interview Confidence</option>
                    <option value="Stage & Presentation">Stage & Presentation</option>
                    <option value="Heights">Heights</option>
                    <option value="Congested Spaces">Congested Spaces</option>
                    <option value="General Confidence">General Confidence</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Estimated Duration (Mins)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Description & Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide guidance on what the student will practice in this assessment..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>

              {/* Dynamic Questions Builder */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Questions & Rubric Items ({questions.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </button>
                </div>

                <div className="space-y-6 max-h-96 overflow-y-auto pr-1">
                  {questions.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700">Question #{qIdx + 1}</span>
                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(qIdx)}
                            className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            required
                            placeholder="Enter question text..."
                            value={q.question_text}
                            onChange={(e) => {
                              const updated = [...questions];
                              updated[qIdx].question_text = e.target.value;
                              setQuestions(updated);
                            }}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <select
                            value={q.question_type}
                            onChange={(e) => {
                              const updated = [...questions];
                              updated[qIdx].question_type = e.target.value;
                              setQuestions(updated);
                            }}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                          >
                            <option value="mcq">Single-Choice MCQ</option>
                            <option value="written">Written Reflection</option>
                          </select>
                        </div>
                      </div>

                      {q.question_type === 'mcq' && (
                        <div className="space-y-2 pt-2 border-t border-slate-200/60">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                            Answer Options (Select the correct answer):
                          </label>
                          {q.options.map((opt: string, oIdx: number) => (
                            <div key={oIdx} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct_${qIdx}`}
                                checked={q.correct_option === opt && opt.length > 0}
                                onChange={() => {
                                  const updated = [...questions];
                                  updated[qIdx].correct_option = opt;
                                  setQuestions(updated);
                                }}
                                title="Mark as correct answer"
                                className="text-teal-600 focus:ring-teal-500 cursor-pointer"
                              />
                              <input
                                type="text"
                                placeholder={`Option ${oIdx + 1}`}
                                value={opt}
                                onChange={(e) => {
                                  const updated = [...questions];
                                  const oldVal = updated[qIdx].options[oIdx];
                                  updated[qIdx].options[oIdx] = e.target.value;
                                  if (updated[qIdx].correct_option === oldVal) {
                                    updated[qIdx].correct_option = e.target.value;
                                  }
                                  setQuestions(updated);
                                }}
                                className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                              />
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleAddOption(qIdx)}
                            className="text-[11px] text-teal-800 font-semibold hover:underline cursor-pointer pt-1"
                          >
                            + Add Option
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-slate-500 pt-1">
                        <div className="flex items-center gap-2">
                          <span>Awarded Points:</span>
                          <input
                            type="number"
                            min={1}
                            value={q.points}
                            onChange={(e) => {
                              const updated = [...questions];
                              updated[qIdx].points = Number(e.target.value);
                              setQuestions(updated);
                            }}
                            className="w-16 px-2 py-0.5 border border-slate-300 rounded text-center bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBuilderModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 font-semibold text-white bg-indigo-950 hover:bg-indigo-900 rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Publishing...' : 'Publish Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
