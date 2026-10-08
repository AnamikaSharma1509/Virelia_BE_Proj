import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Key, Bell, Server, CheckCircle2, AlertCircle } from 'lucide-react';
import { authApi } from '../../api/authApi';

export const AdminSettings: React.FC = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    try {
      setIsChangingPassword(true);
      await authApi.changePassword(currentPassword, newPassword);
      setPasswordMsg({ type: 'success', text: 'Password successfully updated.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setPasswordMsg({ type: 'error', text: errorMsg || 'Failed to update password.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform & Administrator Settings</h1>
        <p className="text-slate-600 text-sm mt-1">
          Manage system configuration, administrative security, and doctor profiles.
        </p>
      </div>

      {/* Admin Profile Overview */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" />
          Administrator Identity & MFA
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="text-xs text-slate-500 font-medium block">Full Name</label>
            <p className="font-medium text-slate-800 mt-0.5">{user?.full_name}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium block">Admin Email</label>
            <p className="font-medium text-slate-800 mt-0.5">{user?.email}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium block">Assigned Role</label>
            <span className="inline-block mt-0.5 px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-full">
              {user?.role.toUpperCase()}
            </span>
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium block">Multi-Factor Authentication</label>
            <span className="inline-flex items-center gap-1 mt-0.5 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> Enforced (6-digit Email OTP)
            </span>
          </div>
        </div>
      </div>

      {/* Security: Change Password */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-indigo-600" />
          Security Credentials
        </h2>

        {passwordMsg && (
          <div className={`p-3 rounded-lg text-xs flex items-center gap-2 mb-4 ${
            passwordMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {passwordMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{passwordMsg.text}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">New Password (min 8 chars)</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={isChangingPassword}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition"
          >
            {isChangingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* System & Architecture Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Server className="w-5 h-5 text-indigo-600" />
          Environment & System Architecture
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block">AI Integration Provider</span>
            <span className="font-semibold text-slate-800 mt-1 block">Local Fallback (Rule-Based Non-Diagnostic)</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block">Database Storage</span>
            <span className="font-semibold text-slate-800 mt-1 block">PostgreSQL (virelia_db via port 5433)</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block">Media Streaming Architecture</span>
            <span className="font-semibold text-slate-800 mt-1 block">Protected HTTP Range Streaming (RFC 7233)</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block">Unity XR Engine Bridge</span>
            <span className="font-semibold text-slate-800 mt-1 block">Offline Rendered MP4 Pipeline (OpenXR Roadmap)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
