import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { patientApi } from '../../api/patientApi';
import { ExposureSession } from '../../types';
import { Video, Clock, Heart, AlertCircle, ArrowRight, Compass } from 'lucide-react';

export const PatientSessions: React.FC = () => {
  const [sessions, setSessions] = useState<ExposureSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await patientApi.getSessions();
        setSessions(data);
      } catch (err) {
        setError('Failed to fetch session history.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSessions();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-1/4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          My Practice Sessions
        </h1>
        <p className="text-sm text-slate-500">
          History of your completed and recorded guided scenario practice sessions.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <Video className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Practice Sessions Recorded Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You haven't participated in any scenario sessions yet. Visit Guided Practice to begin your first session.
          </p>
          <Link
            to="/patient/scenarios"
            className="inline-block px-5 py-2.5 bg-indigo-950 text-white font-semibold text-xs rounded-xl shadow-xs hover:bg-indigo-900 transition-colors"
          >
            Explore Guided Scenarios
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-950 flex items-center justify-center shrink-0">
                    <Video className="w-4 h-4 text-indigo-700" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {s.scenario_title || 'Guided Scenario'}
                    </h3>
                    {s.video_title && (
                      <p className="text-xs text-slate-500 font-medium">{s.video_title}</p>
                    )}
                  </div>
                </div>

                {s.reflection && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                    "{s.reflection}"
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {new Date(s.started_at).toLocaleDateString()} at {new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>Duration: {Math.floor(s.duration_seconds / 60)}m {s.duration_seconds % 60}s</span>
                  <span className="capitalize font-semibold text-slate-700">Status: {s.status}</span>
                </div>
              </div>

              {/* Comfort Transition Badge */}
              <div className="sm:text-right shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Self-Comfort
                </span>
                <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800">
                  <span className="text-indigo-900">{s.pre_comfort_rating ?? '-'}/10</span>
                  <span className="text-slate-300">→</span>
                  <span className="text-teal-700">{s.post_comfort_rating ?? '-'}/10</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
