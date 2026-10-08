import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { ShieldAlert, Heart, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white/10 px-3 py-1.5 rounded-xl inline-block">
              <Logo size="md" className="brightness-125" />
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Virelia is a guided confidence-building platform that helps students practice challenging real-world situations through structured assessments, immersive scenario videos, personal reflections, and progress tracking.
            </p>
            <div className="flex items-center gap-2 text-xs text-teal-400 bg-teal-950/60 border border-teal-800/60 p-2.5 rounded-lg max-w-md">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Practice platform for self-reflection. Non-diagnostic and non-clinical.</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-slate-400 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <a href="/#how-it-works" className="text-slate-400 hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="/#scenarios" className="text-slate-400 hover:text-white transition-colors">
                  Scenarios
                </a>
              </li>
              <li>
                <Link to="/about" className="text-slate-400 hover:text-white transition-colors">
                  About Virelia
                </Link>
              </li>
              <li>
                <Link to="/safety" className="text-slate-400 hover:text-white transition-colors">
                  Safety & Ethics
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal and Safety */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
              Trust & Transparency
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/privacy" className="text-slate-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-slate-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/safety" className="text-slate-400 hover:text-white transition-colors">
                  Non-Clinical Disclaimer
                </Link>
              </li>
              <li className="text-xs text-slate-500 pt-2">
                Support: <span className="text-slate-400">support@virelia.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} Virelia. Practice. Perform. Grow. All rights reserved.</p>
          <p className="text-slate-400 text-center md:text-right">
            Designed for educational and confidence building practice. Not a medical treatment or diagnosis system.
          </p>
        </div>
      </div>
    </footer>
  );
};
