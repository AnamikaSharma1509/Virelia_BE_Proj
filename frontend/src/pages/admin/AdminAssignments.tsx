import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { AssessmentAssignment, Assessment, Scenario } from '../../types';
import {
  UserCheck,
  Plus,
  Trash2,
  AlertCircle,
  X,
  CheckCircle2,
  Calendar,
  Clock,
  Video,
  FileSpreadsheet,
  Compass
} from 'lucide-react';

export const AdminAssignments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'assessments' | 'scenarios'>('assessments');

  // Assessments State
  const [assignments, setAssignments] = useState<AssessmentAssignment[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [patients, setPatients] = useState<any[]>([]);

  // Scenarios State
  const [scenarioAssignments, setScenarioAssignments] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Assessment Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  const [instructions, setInstructions] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');

  // Scenario Modal State
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState('');
  const [selectedScenarioPatientIds, setSelectedScenarioPatientIds] = useState<string[]>([]);
  const [isAssigningScenario, setIsAssigningScenario] = useState(false);
  const [scenarioAssignError, setScenarioAssignError] = useState('');
  const [scenarioSuccess, setScenarioSuccess] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [assigns, assessList, patList, scAssigns, scList] = await Promise.all([
        adminApi.listAssignments(),
        adminApi.listAssessments(),
        adminApi.listPatients(),
        adminApi.listScenarioAssignments(),
        adminApi.listScenarios(),
      ]);
      setAssignments(assigns);
      setAssessments(assessList.filter(a => a.is_published));
      setPatients(patList.filter((p: any) => p.is_active));
      setScenarioAssignments(scAssigns);
      setScenarios(scList.filter(s => s.is_active));

      if (assessList.length > 0) setSelectedAssessmentId(assessList[0].id);
      if (scList.length > 0) setSelectedScenarioId(scList[0].id);
    } catch (err) {
      setError('Failed to fetch assignments data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePatientToggle = (id: string) => {
    if (selectedPatientIds.includes(id)) {
      setSelectedPatientIds(selectedPatientIds.filter(pid => pid !== id));
    } else {
      setSelectedPatientIds([...selectedPatientIds, id]);
    }
  };

  const handleScenarioPatientToggle = (id: string) => {
    if (selectedScenarioPatientIds.includes(id)) {
      setSelectedScenarioPatientIds(selectedScenarioPatientIds.filter(pid => pid !== id));
    } else {
      setSelectedScenarioPatientIds([...selectedScenarioPatientIds, id]);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError('');

    if (!selectedAssessmentId) {
      setAssignError('Please choose an assessment.');
      return;
    }

    if (selectedPatientIds.length === 0) {
      setAssignError('Please select at least one patient.');
      return;
    }

    setIsAssigning(true);
    try {
      await adminApi.createAssignments({
        assessment_id: selectedAssessmentId,
        patient_ids: selectedPatientIds,
        instructions: instructions || undefined,
      });
      setShowModal(false);
      setSelectedPatientIds([]);
      setInstructions('');
      loadData();
    } catch (err: any) {
      setAssignError(err.response?.data?.detail || 'Assignment failed.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCreateScenarioAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setScenarioAssignError('');

    if (!selectedScenarioId) {
      setScenarioAssignError('Please choose a scenario.');
      return;
    }

    if (selectedScenarioPatientIds.length === 0) {
      setScenarioAssignError('Please select at least one patient.');
      return;
    }

    setIsAssigningScenario(true);
    try {
      await adminApi.assignScenario(selectedScenarioId, selectedScenarioPatientIds);
      setScenarioSuccess(`Successfully assigned to ${selectedScenarioPatientIds.length} patient(s).`);
      setTimeout(() => {
        setShowScenarioModal(false);
        setScenarioSuccess('');
        setSelectedScenarioPatientIds([]);
        loadData();
      }, 1200);
    } catch (err: any) {
      setScenarioAssignError(err.response?.data?.detail || 'Scenario assignment failed.');
    } finally {
      setIsAssigningScenario(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke this assessment assignment?')) return;
    try {
      await adminApi.revokeAssignment(id);
      loadData();
    } catch (err) {
      setError('Could not revoke assignment.');
    }
  };

  const handleRevokeScenario = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke this scenario assignment?')) return;
    try {
      await adminApi.revokeScenarioAssignment(id);
      loadData();
    } catch (err) {
      setError('Could not revoke scenario assignment.');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-4 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-1/4"></div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Patient Assignments
          </h1>
          <p className="text-sm text-slate-500">
            Dispatch assessments and guided video practice scenarios to registered students.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'assessments' ? (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="px-4 py-2.5 bg-indigo-950 hover:bg-indigo-900 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-teal-300" />
              <span>Assign Assessment</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowScenarioModal(true)}
              className="px-4 py-2.5 bg-teal-700 hover:bg-teal-600 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-teal-200" />
              <span>Assign Scenario to Patients</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold uppercase tracking-wider text-slate-500">
        <button
          onClick={() => setActiveTab('assessments')}
          className={`pb-3 border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'assessments' ? 'border-teal-600 text-teal-800' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Assessment Assignments ({assignments.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('scenarios')}
          className={`pb-3 border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'scenarios' ? 'border-teal-600 text-teal-800' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Assigned Scenarios & Videos ({scenarioAssignments.length})</span>
        </button>
      </div>

      {/* TAB 1: ASSESSMENT ASSIGNMENTS */}
      {activeTab === 'assessments' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="px-6 py-4">Patient Name</th>
                  <th className="px-6 py-4">Assessment Title</th>
                  <th className="px-6 py-4">Assigned Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      No assessment assignments active. Click &quot;Assign Assessment&quot; to begin.
                    </td>
                  </tr>
                ) : (
                  assignments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{a.patient_name}</div>
                        <div className="text-[11px] text-slate-400">{a.patient_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-800">{a.assessment_title}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(a.assigned_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            a.status === 'submitted' || a.status === 'approved' || a.status === 'released'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : a.status === 'in_progress'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {a.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {a.status === 'assigned' && (
                          <button
                            type="button"
                            onClick={() => handleRevoke(a.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="Revoke Assignment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SCENARIO & VIDEO ASSIGNMENTS */}
      {activeTab === 'scenarios' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="px-6 py-4">Patient Name</th>
                  <th className="px-6 py-4">Scenario Environment</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Assigned Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scenarioAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      No scenario video assignments recorded. Click &quot;Assign Scenario to Patients&quot; to assign.
                    </td>
                  </tr>
                ) : (
                  scenarioAssignments.map((sa) => (
                    <tr key={sa.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{sa.patient_name}</div>
                        <div className="text-[11px] text-slate-400">{sa.patient_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Video className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span className="font-semibold text-slate-800">{sa.scenario_title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          {sa.scenario_category || 'Scenario'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(sa.assigned_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
                          {sa.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleRevokeScenario(sa.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Revoke Scenario Assignment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ASSIGN ASSESSMENT */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Assign Assessment to Patients</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {assignError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                {assignError}
              </div>
            )}

            <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Select In-Built Assessment
                </label>
                <select
                  value={selectedAssessmentId}
                  onChange={(e) => setSelectedAssessmentId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-950 bg-white"
                >
                  {assessments.map((ass) => (
                    <option key={ass.id} value={ass.id}>
                      {ass.title} ({ass.category} • {ass.questions?.length || 0} Questions)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700 uppercase tracking-wider">
                    Select Patients ({selectedPatientIds.length} selected)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedPatientIds.length === patients.length) setSelectedPatientIds([]);
                      else setSelectedPatientIds(patients.map(p => p.id));
                    }}
                    className="text-[11px] text-teal-800 font-semibold hover:underline"
                  >
                    {selectedPatientIds.length === patients.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl p-2.5 max-h-48 overflow-y-auto space-y-1.5 bg-slate-50">
                  {patients.length === 0 ? (
                    <div className="text-slate-400 text-center py-4">No active patients available.</div>
                  ) : (
                    patients.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 p-1.5 hover:bg-white rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedPatientIds.includes(p.id)}
                          onChange={() => handlePatientToggle(p.id)}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="font-medium text-slate-800">{p.full_name}</span>
                        <span className="text-[10px] text-slate-400">({p.email})</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Instructions for Patient (Optional)
                </label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Please take this before your session next Tuesday."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-950"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning || selectedPatientIds.length === 0}
                  className="px-5 py-2 font-semibold text-white bg-indigo-950 hover:bg-indigo-900 rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN SCENARIO */}
      {showScenarioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Assign Guided Scenario Video</h2>
              <button
                type="button"
                onClick={() => setShowScenarioModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {scenarioSuccess && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>{scenarioSuccess}</span>
              </div>
            )}

            {scenarioAssignError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                {scenarioAssignError}
              </div>
            )}

            <form onSubmit={handleCreateScenarioAssignment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Select Practice Scenario
                </label>
                <select
                  value={selectedScenarioId}
                  onChange={(e) => setSelectedScenarioId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                >
                  {scenarios.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.title} ({sc.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700 uppercase tracking-wider">
                    Select Patients ({selectedScenarioPatientIds.length} selected)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedScenarioPatientIds.length === patients.length) setSelectedScenarioPatientIds([]);
                      else setSelectedScenarioPatientIds(patients.map(p => p.id));
                    }}
                    className="text-[11px] text-teal-800 font-semibold hover:underline"
                  >
                    {selectedScenarioPatientIds.length === patients.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl p-2.5 max-h-48 overflow-y-auto space-y-1.5 bg-slate-50">
                  {patients.length === 0 ? (
                    <div className="text-slate-400 text-center py-4">No active patients available.</div>
                  ) : (
                    patients.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 p-1.5 hover:bg-white rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedScenarioPatientIds.includes(p.id)}
                          onChange={() => handleScenarioPatientToggle(p.id)}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="font-medium text-slate-800">{p.full_name}</span>
                        <span className="text-[10px] text-slate-400">({p.email})</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowScenarioModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigningScenario || selectedScenarioPatientIds.length === 0}
                  className="px-5 py-2 font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isAssigningScenario ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
