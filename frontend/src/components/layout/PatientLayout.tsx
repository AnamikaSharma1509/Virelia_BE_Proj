import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  Compass,
  Video,
  FileCheck2,
  TrendingUp,
  User,
  ShieldCheck,
  LogOut,
  Bell,
  Menu,
  X
} from 'lucide-react';

export const PatientLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/patient/dashboard', icon: LayoutDashboard },
    { label: 'My Assessments', path: '/patient/assessments', icon: ClipboardList },
    { label: 'Guided Practice', path: '/patient/scenarios', icon: Compass },
    { label: 'My Sessions', path: '/patient/sessions', icon: Video },
    { label: 'My Reports', path: '/patient/reports', icon: FileCheck2 },
    { label: 'Profile', path: '/patient/profile', icon: User },
    { label: 'Help & Safety', path: '/safety', icon: ShieldCheck },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'ST';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0 select-none">
        {/* Sidebar Header */}
        <div className="h-16 px-6 flex items-center border-b border-slate-100">
          <Logo size="sm" to="/patient/dashboard" />
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-900 text-teal-200 font-bold flex items-center justify-center text-sm shadow-sm">
            {getInitials(user?.full_name)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-slate-800 truncate">{user?.full_name}</p>
            <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide bg-teal-100 text-teal-800 rounded">
              Student / Patient
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-950 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-300' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / Sign Out */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 h-16 flex items-center justify-between sticky top-0 z-30">
        <Logo size="sm" to="/patient/dashboard" />
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 text-slate-600 hover:text-slate-900 rounded-lg"
        >
          {mobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileSidebarOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-indigo-950 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Safety Disclaimer Banner */}
        <div className="bg-indigo-50/70 border-b border-indigo-100/80 px-4 py-2 text-xs text-indigo-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
            <span className="font-medium">Self-Paced Guided Practice:</span>
            <span className="hidden sm:inline">Virelia is not a medical diagnostic tool. You are always in control to pause or exit any practice scenario.</span>
          </div>
          <Link to="/safety" className="underline font-semibold hover:text-indigo-950 shrink-0">
            Learn More
          </Link>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
