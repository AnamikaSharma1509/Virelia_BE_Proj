import React from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Privacy Policy (MVP)</h1>
        <p className="text-sm text-slate-500">
          Last revised: October 2026. This MVP policy outlines data handling practices for local and development deployments.
        </p>

        <section className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 text-sm text-slate-600 leading-relaxed">
          <h2 className="text-base font-bold text-slate-900">1. Data We Collect</h2>
          <p>
            Virelia collects only the minimum necessary information required to facilitate guided confidence practice:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>User account credentials (name, email address, and argon2id-hashed passwords).</li>
            <li>Self-reported assessment answers and written reflections.</li>
            <li>Session interaction events (start time, pause/resume counts, subjective comfort ratings 1-10).</li>
          </ul>

          <h2 className="text-base font-bold text-slate-900 pt-2">2. How Data is Stored & Processed</h2>
          <p>
            Assessment records and sessions are stored in an authoritative PostgreSQL database. Data is isolated strictly by patient account ID and accessible solely by the authorized patient and their assigned supervising administrator.
          </p>

          <h2 className="text-base font-bold text-slate-900 pt-2">3. Artificial Intelligence Processing</h2>
          <p>
            Written responses are passed only to authorized local summarization routines or configurable OpenAI-compatible models for drafted feedback assistance. No passwords, session tokens, or external identifiers are transmitted.
          </p>

          <h2 className="text-base font-bold text-slate-900 pt-2">4. Account & Data Deletion</h2>
          <p>
            Participants may request account deactivation and data removal through the platform administrator at any time.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
};
