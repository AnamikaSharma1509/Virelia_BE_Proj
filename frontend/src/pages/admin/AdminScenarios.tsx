import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { Scenario } from '../../types';
import {
  Compass,
  Users,
  Video,
  ShieldCheck,
  Plus,
  AlertCircle,
  X,
  CheckCircle2,
  Trash2,
  Calendar,
  UserCheck
} from 'lucide-react';

export const AdminScenarios: React.FC = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [scenarioAssignments, setScenarioAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Assign Scenario Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [targetScenario, setTargetScenario] = useState<Scenario | null>(null);
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  const [assignSuccess, setAssignSuccess] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [scList, patList, scAssigns] = await Promise.all([
        adminApi.listScenarios(),
        adminApi.listPatients(),
        adminApi.listScenarioAssignments(),
      ]);
      setScenarios(scList);
      setPatients(patList.filter((p: any) => p.is_active));
      setScenarioAssignments(scAssigns);
    } catch (err) {
      setError('Failed to fetch scenarios data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAssign = (sc: Scenario) => {
    setTargetScenario(sc);
    // Pre-populate with currently assigned patients
    const currentAssignedPatientIds = scenarioAssignments
      .filter((sa) => sa.scenario_id === sc.id)
      .map((sa) => sa.patient_id);
    setSelectedPatientIds(currentAssignedPatientIds);
    setAssignSuccess('');
    setShowAssignModal(true);
  };

  const handlePatientToggle = (id: string) => {
    if (selectedPatientIds.includes(id)) {
      setSelectedPatientIds(selectedPatientIds.filter(pid => pid !== id));
    } else {
      setSelectedPatientIds([...selectedPatientIds, id]);
    }
  };

  const handleAssignScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetScenario || selectedPatientIds.length === 0) return;
    setIsAssigning(true);
    try {
      await adminApi.assignScenario(targetScenario.id, selectedPatientIds);
      setAssignSuccess(`Assigned to ${selectedPatientIds.length} patient(s) successfully.`);
      loadData();
      setTimeout(() => setShowAssignModal(false), 1200);
    } catch (err: any) {
      setError('Assignment failed.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRevokeAssignment = async (assignmentId: string) => {
    if (!window.confirm('Are you sure you want to revoke this patient\'s access to this scenario?')) return;
    try {
      await adminApi.revokeScenarioAssignment(assignmentId);
      loadData();
    } catch (err) {
      setError('Failed to revoke scenario assignment.');
    }
  };

  if (isLoading && scenarios.length === 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-4 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Guided Practice Scenarios & Video Assignments
        </h1>
        <p className="text-sm text-slate-500">
          Supervise the 4 core practice environments and manage which students have access to each scenario.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Core Scenarios Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {scenarios.map((sc) => {
          const assignedToThis = scenarioAssignments.filter((sa) => sa.scenario_id === sc.id);

          return (
            <div
              key={sc.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                    {sc.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">{sc.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{sc.description}</p>

                {/* Video Levels breakdown */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-700">
                  <span className="font-semibold text-slate-500 block uppercase text-[10px]">
                    Configured Video Levels ({sc.videos?.length || 0}):
                  </span>
                  {sc.videos?.map((v) => (
                    <div key={v.id} className="flex justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>{v.title}</span>
                      </div>
                      <span className="text-slate-400">{Math.round(v.duration_seconds / 60)}m</span>
                    </div>
                  ))}
                </div>

                {/* Assigned Patients Section */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-700" />
                      <span>Assigned Patients ({assignedToThis.length})</span>
                    </span>
                  </div>

                  {assignedToThis.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No patients assigned yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {assignedToThis.map((sa) => (
                        <span
                          key={sa.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-900 border border-teal-200 rounded-full text-[11px] font-medium"
                        >
                          <UserCheck className="w-3 h-3 text-teal-600" />
                          <span>{sa.patient_name}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleOpenAssign(sc)}
                  className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-600 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Assign / Manage Patients ({assignedToThis.length})</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assigned Scenarios Master Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mt-8">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">Current Patient Video Assignments</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of all active scenario assignments across registered students.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                <th className="px-6 py-4">Patient Name</th>
                <th className="px-6 py-4">Assigned Scenario</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Assigned Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scenarioAssignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                    No scenario assignments currently active.
                  </td>
                </tr>
              ) : (
                scenarioAssignments.map((sa) => (
                  <tr key={sa.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      <div>{sa.patient_name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{sa.patient_email}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-teal-600" />
                        <span>{sa.scenario_title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[11px]">
                        {sa.scenario_category}
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
                        onClick={() => handleRevokeAssignment(sa.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="Revoke Assignment"
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

      {/* Assign Scenario Modal */}
      {showAssignModal && targetScenario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">Assign Scenario</span>
                <h3 className="text-base font-bold text-slate-900">{targetScenario.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {assignSuccess && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>{assignSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAssignScenario} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Select Patients ({selectedPatientIds.length} of {patients.length})
                </label>
                <div className="border border-slate-200 rounded-xl p-2.5 max-h-48 overflow-y-auto space-y-1.5 bg-slate-50">
                  {patients.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 p-1 hover:bg-white rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPatientIds.includes(p.id)}
                        onChange={() => handlePatientToggle(p.id)}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="font-medium text-slate-800">{p.full_name}</span>
                      <span className="text-[10px] text-slate-400">({p.email})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning || selectedPatientIds.length === 0}
                  className="px-5 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-600 rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
