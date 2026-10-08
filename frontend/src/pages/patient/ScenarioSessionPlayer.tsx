import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { patientApi } from '../../api/patientApi';
import { sessionApi } from '../../api/sessionApi';
import { Scenario, ScenarioVideo, ExposureSession } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  Play,
  Pause,
  StopCircle,
  RotateCcw,
  ShieldCheck,
  Heart,
  CheckCircle2,
  AlertCircle,
  Video,
  Sparkles
} from 'lucide-react';

export const ScenarioSessionPlayer: React.FC = () => {
  const { scenarioId, sessionId } = useParams<{ scenarioId?: string; sessionId?: string }>();
  const currentScenarioId = scenarioId || sessionId;
  const navigate = useNavigate();
  const { token } = useAuth();

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<ScenarioVideo | null>(null);
  const [session, setSession] = useState<ExposureSession | null>(null);

  // Flow Phases: 'pre_session' | 'playing' | 'post_session' | 'completed'
  const [phase, setPhase] = useState<'pre_session' | 'playing' | 'post_session' | 'completed'>('pre_session');

  // Comfort Ratings (1 to 10)
  const [preRating, setPreRating] = useState<number>(5);
  const [postRating, setPostRating] = useState<number>(5);
  const [reflectionText, setReflectionText] = useState<string>('');
  const [safetyAcknowledged, setSafetyAcknowledged] = useState<boolean>(false);

  // Playback & Timing
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!currentScenarioId) return;

    const loadScenario = async () => {
      try {
        setIsLoading(true);
        const scenarios = await patientApi.getScenarios();
        const found = scenarios.find(s => s.id === currentScenarioId || s.slug === currentScenarioId);
        if (found) {
          setScenario(found);
          if (found.videos && found.videos.length > 0) {
            setSelectedVideo(found.videos[0]);
          }
        } else {
          setErrorMessage('Scenario not found or not assigned to your account.');
        }
      } catch (err: any) {
        setErrorMessage(err.response?.data?.detail || 'Failed to load scenario details.');
      } finally {
        setIsLoading(false);
      }
    };

    loadScenario();
  }, [currentScenarioId]);

  // Session duration timer while in 'playing' phase
  useEffect(() => {
    if (phase === 'playing') {
      timerRef.current = setInterval(() => {
        setDurationSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const handleStartSession = async () => {
    if (!scenario) return;
    if (!safetyAcknowledged) {
      setErrorMessage('Please confirm your acknowledgment of the safety guidelines.');
      return;
    }

    try {
      setErrorMessage('');
      const started = await sessionApi.startSession({
        scenario_id: scenario.id,
        video_id: selectedVideo?.id,
        pre_comfort_rating: preRating,
      });
      setSession(started);
      setPhase('playing');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || 'Could not start session.');
    }
  };

  const handleVideoEvent = async (eventType: string, data = {}) => {
    if (!session) return;
    try {
      await sessionApi.recordEvent(session.id, eventType, data);
    } catch (e) {
      // Telemetry error - keep video playing smoothly
    }
  };

  const handleStopEarly = async () => {
    if (!session) return;
    if (videoRef.current) videoRef.current.pause();
    try {
      await sessionApi.stopSession(session.id, {
        duration_seconds: durationSeconds,
        post_comfort_rating: postRating,
      });
      setPhase('post_session');
    } catch (err) {
      setPhase('post_session');
    }
  };

  const handleVideoEnded = async () => {
    await handleVideoEvent('video_completed', { duration_seconds: durationSeconds });
    setPhase('post_session');
  };

  const handleFinalSubmit = async () => {
    if (!session) return;
    try {
      await sessionApi.completeSession(session.id, {
        post_comfort_rating: postRating,
        reflection: reflectionText,
        duration_seconds: durationSeconds,
      });
      setPhase('completed');
    } catch (err: any) {
      setErrorMessage('Failed to finalize session reflection.');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse py-8">
        <div className="h-10 bg-slate-200 rounded w-1/3"></div>
        <div className="h-80 bg-slate-200 rounded-3xl"></div>
      </div>
    );
  }

  if (errorMessage && phase === 'pre_session') {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 space-y-4">
        <div className="flex items-center gap-2 font-bold text-base">
          <AlertCircle className="w-5 h-5" />
          <span>Error Loading Scenario</span>
        </div>
        <p className="text-sm">{errorMessage}</p>
        <Link to="/patient/scenarios" className="inline-block text-xs font-semibold underline">
          Return to Guided Practice
        </Link>
      </div>
    );
  }

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  const streamUrl = selectedVideo && token
    ? `${apiBase}/videos/${selectedVideo.id}/stream?token=${encodeURIComponent(token)}`
    : '';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/patient/scenarios')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Scenarios
        </button>
        <span className="text-xs font-medium text-slate-400">
          Guided Practice Session
        </span>
      </div>

      {/* PHASE 1: PRE-SESSION CHECK-IN */}
      {phase === 'pre_session' && scenario && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-xs space-y-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
              {scenario.category}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {scenario.title}
            </h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {scenario.description}
            </p>
          </div>

          {/* Level Selection */}
          {scenario.videos && scenario.videos.length > 1 && (
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Choose Practice Video Level:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scenario.videos.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVideo(v)}
                    className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                      selectedVideo?.id === v.id
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-1 ring-indigo-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{v.title}</span>
                      <span className="text-[11px] text-slate-400">{Math.round(v.duration_seconds / 60)} min</span>
                    </div>
                    {v.description && <p className="text-xs text-slate-500 mt-1">{v.description}</p>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Instructions & Safety Reminder */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>Safety & Pacing Reminder</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {scenario.instructions || 'Sit in a comfortable posture. Remember to breathe steadily.'}
            </p>
            <p className="text-xs text-slate-500">
              You are in complete control. An unconditional <strong>Stop Session</strong> button will be visible throughout the entire video.
            </p>
          </div>

          {/* Pre-Session Comfort Rating (1 to 10) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>How comfortable do you feel right now? (1 = Hesitant, 10 = Fully Comfortable)</span>
              </label>
              <span className="text-xl font-extrabold text-indigo-950 px-3 py-1 bg-indigo-50 rounded-xl">
                {preRating} / 10
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="10"
              value={preRating}
              onChange={(e) => setPreRating(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-950"
            />
            <div className="flex justify-between text-[11px] text-slate-400 px-1">
              <span>1 - Very hesitant</span>
              <span>5 - Neutral</span>
              <span>10 - Completely calm</span>
            </div>
          </div>

          {/* Acknowledgment Checkbox */}
          <div>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={safetyAcknowledged}
                onChange={(e) => setSafetyAcknowledged(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-950 focus:ring-indigo-600"
              />
              <span className="text-xs text-slate-600">
                I understand that I can pause or stop this guided practice scenario at any time.
              </span>
            </label>
          </div>

          <button
            type="button"
            onClick={handleStartSession}
            className="w-full py-3.5 px-6 bg-indigo-950 hover:bg-indigo-900 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 text-teal-300 fill-teal-300" />
            <span>Start Practice Session</span>
          </button>
        </div>
      )}

      {/* PHASE 2: IN-SESSION VIDEO PLAYER */}
      {phase === 'playing' && (
        <div className="bg-slate-950 rounded-3xl overflow-hidden shadow-xl border border-slate-800 space-y-4 p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold text-white">{selectedVideo?.title}</span>
            <span>Duration: {Math.floor(durationSeconds / 60)}m {durationSeconds % 60}s</span>
          </div>

          {/* Video Container */}
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800">
            {streamUrl ? (
              <video
                ref={videoRef}
                src={streamUrl}
                controls
                autoPlay
                playsInline
                onPlay={() => handleVideoEvent('video_started')}
                onPause={() => handleVideoEvent('video_paused')}
                onEnded={handleVideoEnded}
                onError={() => {
                  setPlaybackError('Unity video asset file is not yet uploaded for this slot.');
                  handleVideoEvent('video_playback_error');
                }}
                className="w-full h-full object-cover"
              />
            ) : null}

            {/* Missing Asset Fallback State */}
            {playbackError && (
              <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <Video className="w-10 h-10 text-amber-400" />
                <h4 className="text-base font-bold text-white">Unity Video Asset Not Configured</h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  The 3D Unity video render for <strong>{selectedVideo?.title}</strong> is awaiting administrator upload in the admin portal.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleStopEarly}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-white"
                  >
                    Simulate Completion & Record Reflection
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Unconditional Pause & Stop Controls */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (videoRef.current) {
                    if (videoRef.current.paused) videoRef.current.play();
                    else videoRef.current.pause();
                  }
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" /> Pause
              </button>
            </div>

            <button
              type="button"
              onClick={handleStopEarly}
              className="px-5 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <StopCircle className="w-4 h-4" /> Stop & Exit Session
            </button>
          </div>
        </div>
      )}

      {/* PHASE 3: POST-SESSION RATING & REFLECTION */}
      {phase === 'post_session' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-xs space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
              Session Concluded
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Post-Session Reflection
            </h2>
            <p className="text-xs text-slate-500">
              Session Duration: {Math.floor(durationSeconds / 60)}m {durationSeconds % 60}s
            </p>
          </div>

          {/* Post Comfort Rating */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Heart className="w-4 h-4 text-teal-600" />
                <span>Rate your comfort level now:</span>
              </label>
              <span className="text-xl font-extrabold text-teal-900 px-3 py-1 bg-teal-50 rounded-xl">
                {postRating} / 10
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="10"
              value={postRating}
              onChange={(e) => setPostRating(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-700"
            />
            <div className="flex justify-between text-[11px] text-slate-400 px-1">
              <span>1 - Still hesitant</span>
              <span>5 - Moderate</span>
              <span>10 - Very comfortable</span>
            </div>
          </div>

          {/* Optional Reflection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Personal Reflection Notes (Optional):
            </label>
            <textarea
              rows={4}
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="What thoughts or sensations did you notice? Did any specific pacing technique feel helpful?"
              className="w-full p-4 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleFinalSubmit}
              className="w-full sm:w-auto px-7 py-3 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Save Session & Ratings</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* PHASE 4: COMPLETED SUMMARY */}
      {phase === 'completed' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-6 shadow-sm my-6">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900">
              Session Recorded & Saved!
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Your session details, comfort rating transition ({preRating} → {postRating}), and reflections are now safely saved in PostgreSQL.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/patient/dashboard"
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-950 text-white font-semibold rounded-xl text-sm hover:bg-indigo-900 transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              to="/patient/sessions"
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-200 transition-colors"
            >
              View Session History
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
