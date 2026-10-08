import React from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Compass, Sparkles, UserCheck, ShieldCheck } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <span className="text-xs font-bold tracking-widest text-teal-700 uppercase">
            About Virelia
          </span>
          <h1 className="text-4xl font-extrabold text-slate-900">
            Practice Before You Face The Real World
          </h1>
          <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Virelia is a modern digital platform engineered to bridge the gap between abstract preparation and real-world performance for students facing high-stakes situations.
          </p>
        </div>

        {/* Core Principles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-900 flex items-center justify-center">
              <Compass className="w-5 h-5 text-indigo-700" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">The Guided Practice Workflow</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              We structure self-development into four sequential, repeatable steps: Assess your current baseline, Practice inside gradual scenario environments, Reflect honestly on comfort, and Grow through objective progress history.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-900 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-teal-700" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Non-Clinical & Educational</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Virelia is fundamentally an educational confidence platform. It does not diagnose anxiety disorders, phobias, or medical ailments. Our comfort ratings (1–10) are subjective self-reflections, not clinical severity scores.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-900 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-700" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">AI as an Assistant, Not Decision Maker</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Artificial Intelligence assists by summarizing written responses and suggesting practical communication tips. It is strictly constrained from psychological profiling and can never automatically release a report.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-amber-700" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Human Professional Review</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every draft analysis must undergo thorough review by an authorized administrator or educator before a report is approved and released to the student's portal.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
