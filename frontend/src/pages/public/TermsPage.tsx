import React from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Terms of Service (MVP)</h1>
        <p className="text-sm text-slate-500">
          Last revised: October 2026.
        </p>

        <section className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 text-sm text-slate-600 leading-relaxed">
          <h2 className="text-base font-bold text-slate-900">1. Acceptance of Terms</h2>
          <p>
            By creating an account on Virelia, you acknowledge that you are using this software as an educational guided confidence-building tool.
          </p>

          <h2 className="text-base font-bold text-slate-900 pt-2">2. Non-Medical Nature of Service</h2>
          <p>
            Virelia does not provide medical, diagnostic, or clinical psychiatric advice. Assessments and scenarios are self-paced exercises for personal communication and situational familiarization.
          </p>

          <h2 className="text-base font-bold text-slate-900 pt-2">3. User Responsibilities</h2>
          <p>
            Users agree to keep their authentication credentials secure and to participate in scenario sessions respectfully and at their own pace.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
};
