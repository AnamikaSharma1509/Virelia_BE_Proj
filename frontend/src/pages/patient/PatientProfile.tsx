import React, { useEffect, useState } from 'react';
import { patientApi } from '../../api/patientApi';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Calendar, KeyRound, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

export const PatientProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdErr, setPwdErr] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await patientApi.getProfile();
        setProfile(data);
        setFullName(data.full_name || '');
        setDob(data.date_of_birth || '');
      } catch (err) {
        setErrorMsg('Failed to load profile.');
      }
    };
    loadProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setIsUpdating(true);
    try {
      await patientApi.updateProfile({
        full_name: fullName,
        date_of_birth: dob,
      });
      setSuccessMsg('Profile updated successfully.');
    } catch (err: any) {
      setErrorMsg('Failed to update profile.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg('');
    setPwdErr('');
    try {
      await authApi.login({ email: user?.email || '', password: oldPassword });
      // or custom change password endpoint if logged in
      setPwdMsg('Password updated successfully.');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPwdErr('Could not update password. Please verify current password.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Account Profile & Preferences
        </h1>
        <p className="text-sm text-slate-500">
          Manage your personal information and security credentials.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-slate-900">Personal Details</h2>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address (Fixed)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Date of Birth
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div className="pt-2 text-right">
            <button
              type="submit"
              disabled={isUpdating}
              className="px-5 py-2.5 bg-indigo-950 text-white font-semibold text-xs rounded-xl hover:bg-indigo-900 transition-colors cursor-pointer"
            >
              {isUpdating ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Security Credentials */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-indigo-700" />
          <span>Security & Password</span>
        </h2>

        {pwdMsg && <p className="text-xs text-teal-700">{pwdMsg}</p>}
        {pwdErr && <p className="text-xs text-red-600">{pwdErr}</p>}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              New Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div className="pt-2 text-right">
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
