import React from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { ShieldCheck, PauseCircle, HeartPulse, UserX } from 'lucide-react';

export const SafetyPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="text-center space-y-4">
          <span className="text-xs font-bold tracking-widest text-teal-700 uppercase">
            Ethics & Transparency
          </span>
          <h1 className="text-4xl font-extrabold text-slate-900">
            Safety Disclaimer & Session Guidelines
          </h1>
          <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Please review our fundamental safety principles before engaging in guided exposure scenarios.
          </p>
        </div>

        {/* Prominent Disclaimer Card */}
        <div className="p-6 sm:p-8 bg-amber-50/80 border border-amber-200/90 rounded-2xl space-y-4 text-amber-950">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-amber-700" />
            Important Healthcare & Medical Limitation
          </h2>
          <p className="text-sm leading-relaxed">
            Virelia is a guided practice and self-reflection platform designed for student confidence building. It is <strong>NOT</strong> a medical diagnosis or psychiatric treatment system. Virelia does not cure, diagnose, treat, or prevent panic disorders, anxiety disorders, acrophobia, agoraphobia, or any mental health condition.
          </p>
          <p className="text-sm leading-relaxed">
            If you are experiencing severe or debilitating psychological distress, please seek consultation with a licensed clinical psychologist or healthcare professional.
          </p>
        </div>

        {/* Safety Principles List */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-900">Core Participant Rights in Every Session</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
              <PauseCircle className="w-8 h-8 text-teal-700" />
              <h4 className="text-base font-bold text-slate-900">Unconditional Pause & Exit</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                You may pause, stop, or close any scenario video at any second. There are zero penalties or required completion scores to access your account.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
              <ShieldCheck className="w-8 h-8 text-indigo-700" />
              <h4 className="text-base font-bold text-slate-900">Gradual Exposure Only</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Scenarios feature distinct level progression (Level 1 familiarization before Level 2 simulation). There are no jump-scares or rapid erratic movements.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
              <UserX className="w-8 h-8 text-purple-700" />
              <h4 className="text-base font-bold text-slate-900">Subjective Comfort Scale</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pre- and post-session ratings from 1 to 10 are completely subjective reflections of your present comfort. They are never converted into artificial clinical metrics.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
