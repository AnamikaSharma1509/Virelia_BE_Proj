import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  to?: string;
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  to = '/',
  showTagline = false,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const textSizes = {
    sm: 'text-lg font-bold',
    md: 'text-xl font-bold',
    lg: 'text-2xl font-bold',
  };

  const content = (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Abstract stylized V representing progress and balance */}
      <div
        className={`${iconSizes[size]} rounded-xl bg-gradient-to-tr from-indigo-950 via-indigo-900 to-teal-700 flex items-center justify-center text-white shadow-sm ring-1 ring-white/20 shrink-0`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 text-teal-300"
        >
          <path d="M4 4l8 16 8-16" />
          <path d="M12 12l4-8" className="opacity-60" />
        </svg>
      </div>
      <div>
        <span className={`${textSizes[size]} tracking-tight text-slate-900 flex items-center gap-1`}>
          Virelia
          <span className="w-1.5 h-1.5 rounded-full bg-teal-600 inline-block"></span>
        </span>
        {showTagline && (
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
            Practice. Perform. Grow.
          </p>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center hover:opacity-95 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
};
