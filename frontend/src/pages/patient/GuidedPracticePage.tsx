import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientApi } from '../../api/patientApi';
import { Scenario } from '../../types';
import {
  Compass,
  Briefcase,
  Mic,
  Building2,
  Users2,
  Lock,
  Play,
  ShieldCheck,
  AlertCircle,
  Video
} from 'lucide-react';

export const GuidedPracticePage: React.FC = () => {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const data = await patientApi.getScenarios();
        setScenarios(data);
      } catch (err) {
        setError('Failed to load guided practice scenarios.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchScenarios();
  }, []);

  const getScenarioIcon = (slug: string) => {
    switch (slug) {
      case 'interview-confidence':
        return Briefcase;
      case 'stage-presentation-practice':
        return Mic;
      case 'heights-elevated-environments':
        return Building2;
      case 'crowded-congested-spaces':
        return Users2;
      default:
        return Compass;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
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
      {/* Page Title */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Guided Practice Scenarios
        </h1>
        <p className="text-sm text-slate-500">
          Immersive, self-paced 3D scenario videos designed for gradual exposure and confidence building.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {scenarios.map((sc) => {
          const Icon = getScenarioIcon(sc.slug);
          const isAssigned = sc.is_assigned;

          return (
            <div
              key={sc.id}
              className={`bg-white rounded-2xl border p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-6 transition-all ${
                isAssigned
                  ? 'border-slate-200 hover:shadow-md'
                  : 'border-slate-200/60 opacity-80 bg-slate-50/50'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-xs ${
                      isAssigned ? 'bg-indigo-950 text-teal-300' : 'bg-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  {isAssigned ? (
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Assigned
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Unassigned
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">{sc.title}</h3>
                  <span className="text-[11px] font-medium text-teal-800 uppercase tracking-wide">
                    {sc.category}
                  </span>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {sc.description}
                  </p>
                </div>

                {/* Video Levels breakdown */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Video Levels:
                  </span>
                  <div className="space-y-2">
                    {sc.videos.map((vid) => (
                      <div key={vid.id} className="flex items-start justify-between text-xs gap-2">
                        <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                          <Video className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                          <span>{vid.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {Math.round(vid.duration_seconds / 60)} min
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-100">
                {isAssigned ? (
                  <button
                    onClick={() => navigate(`/patient/sessions/${sc.id}`)}
                    className="w-full py-2.5 px-4 bg-indigo-950 hover:bg-indigo-900 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 text-teal-300 fill-teal-300" />
                    <span>Begin Guided Session</span>
                  </button>
                ) : (
                  <div className="text-center py-2 text-xs text-slate-400">
                    This scenario has not been assigned to your account.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
