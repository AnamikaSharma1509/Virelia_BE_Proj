import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import {
  Briefcase,
  Mic,
  Building2,
  Users2,
  CheckCircle,
  ShieldCheck,
  BrainCircuit,
  ArrowRight,
  Eye,
  Sliders,
  TrendingUp,
  HeartHandshake
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const scenarios = [
    {
      title: 'Interview Confidence',
      category: 'Professional Communication',
      icon: Briefcase,
      color: 'from-blue-600 to-indigo-700',
      description:
        'Practice job interviews and professional dialogues in a calm, simulated room setting. Build familiarity with interview panel dynamics and structured answer delivery.',
    },
    {
      title: 'Stage & Presentation Practice',
      category: 'Public Speaking',
      icon: Mic,
      color: 'from-indigo-600 to-purple-700',
      description:
        'Step onto the stage starting from a small 8-person seminar room before progressing to an auditorium podium. Develop steady eye contact and vocal projection.',
    },
    {
      title: 'Heights & Elevated Environments',
      category: 'Height Acclimatization',
      icon: Building2,
      color: 'from-teal-600 to-cyan-700',
      description:
        'Controlled, safe exploration of elevated vantage points with clear protective glass barriers. Notice stable grounding while observing expansive views.',
    },
    {
      title: 'Crowded & Congested Spaces',
      category: 'Spatial Confidence',
      icon: Users2,
      color: 'from-amber-600 to-orange-700',
      description:
        'Familiarize yourself with bustling student concourses and active transit halls. Learn to maintain relaxed, centered focus amid surrounding activity.',
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Assess',
      desc: 'Complete structured self-reflection questionnaires to identify communication habits and personal practice goals.',
    },
    {
      num: '02',
      title: 'Practice',
      desc: 'Watch Unity-rendered 3D scenario videos at your own comfortable pace with full pause and stop controls.',
    },
    {
      num: '03',
      title: 'Reflect',
      desc: 'Record self-reported comfort levels (1-10) before and after sessions along with your personal reflections.',
    },
    {
      num: '04',
      title: 'Grow',
      desc: 'Receive AI-assisted drafts reviewed and released by your administrator with tailored feedback and progress charts.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-200/60 bg-gradient-to-b from-white via-slate-50 to-indigo-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Tagline Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 border border-indigo-200/60 text-indigo-900 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              <span>Practice. Perform. Grow.</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Build confidence before you face the{' '}
              <span className="bg-gradient-to-r from-indigo-900 via-indigo-700 to-teal-700 bg-clip-text text-transparent">
                real world.
              </span>
            </h1>

            {/* Supporting Description */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Virelia is a guided confidence-building platform that helps students practice challenging real-world situations through structured assessments, immersive scenario videos, personal reflections, and progress tracking.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                to="/register"
                className="w-full sm:w-auto px-7 py-3.5 text-base font-semibold text-white bg-indigo-950 hover:bg-indigo-900 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5 text-teal-300" />
              </Link>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto px-7 py-3.5 text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors flex items-center justify-center"
              >
                Explore How It Works
              </a>
            </div>

            {/* Disclaimer reassurance pill */}
            <p className="text-xs text-slate-500 pt-3">
              Self-paced educational practice tool. Pause or stop anytime without pressure.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 lg:py-24 bg-white border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold tracking-widest text-teal-700 uppercase">
              Methodology
            </span>
            <h2 className="text-3xl font-bold text-slate-900">
              Four Steps to Steady Growth
            </h2>
            <p className="text-sm text-slate-600">
              A thoughtful, supportive cycle of assessment, gradual video immersion, and personal reflection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((st) => (
              <div
                key={st.num}
                className="relative p-6 bg-slate-50 rounded-2xl border border-slate-200/80 hover:shadow-md transition-all group"
              >
                <span className="text-3xl font-black text-indigo-950/20 group-hover:text-teal-700/40 transition-colors">
                  {st.num}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2 mb-2">{st.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guided Scenarios Section */}
      <section id="scenarios" className="py-16 lg:py-24 bg-slate-50 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold tracking-widest text-teal-700 uppercase">
              Guided Content
            </span>
            <h2 className="text-3xl font-bold text-slate-900">
              Explore Practice Scenarios
            </h2>
            <p className="text-sm text-slate-600">
              Four core situation categories built with gradual exposure levels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {scenarios.map((sc) => {
              const Icon = sc.icon;
              return (
                <div
                  key={sc.title}
                  className="bg-white rounded-2xl border border-slate-200/90 p-8 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${sc.color} flex items-center justify-center text-white shadow-sm`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                        {sc.category}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900">{sc.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{sc.description}</p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">2 Practice Video Levels</span>
                    <Link
                      to="/login"
                      className="text-sm font-semibold text-indigo-900 hover:text-teal-700 flex items-center gap-1 transition-colors"
                    >
                      <span>Explore Scenario</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Safety & Non-Diagnostic Transparency Section */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Committed to Safety, Control, and Transparency
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Virelia is designed exclusively for self-reflection and guided practice. It does not diagnose, cure, treat, or clinically measure anxiety, phobias, or psychological disorders. All sessions feature visible pause and exit buttons, and all AI-generated suggestions must be reviewed and approved by an administrator before report release.
          </p>
          <div className="flex justify-center gap-6 pt-2 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-teal-600" /> Never forces video completion
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-teal-600" /> Human review before release
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-teal-600" /> Subjective self-comfort tracking
            </span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
