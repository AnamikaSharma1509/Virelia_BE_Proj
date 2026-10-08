import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, MFAChallenge } from '../types';
import { authApi } from '../api/authApi';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: 'patient' | 'admin' | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ mfaRequired?: boolean; challengeId?: string }>;
  verifyMFA: (challengeId: string, otp: string) => Promise<void>;
  register: (data: { full_name: string; email: string; password: string; consent_agreed: boolean }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('virelia_access_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('virelia_access_token');
      if (storedToken) {
        try {
          const me = await authApi.getMe();
          setUser(me);
          setToken(storedToken);
        } catch (err) {
          localStorage.removeItem('virelia_access_token');
          localStorage.removeItem('virelia_refresh_token');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    if (res.mfa_required) {
      return { mfaRequired: true, challengeId: res.challenge_id };
    }

    localStorage.setItem('virelia_access_token', res.access_token);
    localStorage.setItem('virelia_refresh_token', res.refresh_token);
    setToken(res.access_token);

    const me = await authApi.getMe();
    setUser(me);
    return { mfaRequired: false };
  };

  const verifyMFA = async (challengeId: string, otp: string) => {
    const res = await authApi.verifyMFA({ challenge_id: challengeId, otp });
    localStorage.setItem('virelia_access_token', res.access_token);
    localStorage.setItem('virelia_refresh_token', res.refresh_token);
    setToken(res.access_token);

    const me = await authApi.getMe();
    setUser(me);
  };

  const register = async (data: { full_name: string; email: string; password: string; consent_agreed: boolean }) => {
    const res = await authApi.register(data);
    localStorage.setItem('virelia_access_token', res.access_token);
    localStorage.setItem('virelia_refresh_token', res.refresh_token);
    setToken(res.access_token);

    const me = await authApi.getMe();
    setUser(me);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user ? user.role : null,
        isAuthenticated: !!user,
        isLoading,
        login,
        verifyMFA,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
