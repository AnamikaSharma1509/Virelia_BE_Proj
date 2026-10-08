import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../../components/common/Logo';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, KeyRound, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, verifyMFA } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // MFA Challenge State
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);
  const [mfaOtp, setMfaOtp] = useState('');
  const [mfaMessage, setMfaMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      if (mfaChallengeId) {
        // Step 2: Verify MFA
        await verifyMFA(mfaChallengeId, mfaOtp);
        navigate('/admin/dashboard');
      } else {
        // Step 1: Login
        const res = await login(email, password);
        if (res.mfaRequired && res.challengeId) {
          setMfaChallengeId(res.challengeId);
          setMfaMessage('Administrator MFA challenge active. Enter the 6-digit code logged to development console or email.');
        } else {
          // Direct login redirect based on role in localStorage or state
          // Retrieve user from localStorage or auth state
          navigate('/patient/dashboard');
        }
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setErrorMessage(detail);
      } else if (Array.isArray(detail)) {
        setErrorMessage(detail.map(d => d.msg).join(', '));
      } else {
        setErrorMessage('Unable to log in. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Logo size="lg" className="justify-center mb-2" showTagline />
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          {mfaChallengeId ? 'Administrator Verification' : 'Welcome to Virelia'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {mfaChallengeId ? 'Enter one-time code to proceed' : 'Sign in to access your guided practice portal'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10">
          {errorMessage && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {mfaChallengeId && (
            <div className="mb-6 p-3.5 bg-teal-50 border border-teal-200 rounded-xl flex items-start gap-2.5 text-xs text-teal-800">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-teal-600" />
              <span>{mfaMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!mfaChallengeId ? (
              <>
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative rounded-lg shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Password
                    </label>
                  </div>
                  <div className="relative rounded-lg shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* MFA OTP Field */
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  6-Digit MFA Verification Code
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={mfaOtp}
                    onChange={(e) => setMfaOtp(e.target.value)}
                    placeholder="123456"
                    className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-lg text-center tracking-widest text-lg font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-950 hover:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition-colors disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>{mfaChallengeId ? 'Verify Code' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4 text-teal-300" />
                </>
              )}
            </button>
          </form>

          {/* Quick Helper Credentials in Development */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">Demo Accounts (Development):</p>
            <p>Admin: <code className="text-indigo-900">anamika.admin@gmail.com</code> / <code className="text-slate-700">Admin@Virelia2026!</code> (MFA Code logged in terminal)</p>
            <p>Patient: <code className="text-indigo-900">demo.patient@virelia.com</code> / <code className="text-slate-700">Patient@Virelia2026!</code></p>
          </div>

          {!mfaChallengeId && (
            <div className="mt-4 text-center">
              <p className="text-xs text-slate-600">
                Don't have an account yet?{' '}
                <Link to="/register" className="font-semibold text-indigo-950 hover:text-teal-700 underline">
                  Create a student account
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
