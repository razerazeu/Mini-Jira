'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  teamId: string | null;  // ← Allow null
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isManager: boolean;
  isEmployee: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: any) => Promise<any>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const normalizeRole = (role?: string | null) => role?.toUpperCase() || null;

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch (err) {
        // Invalid JSON in localStorage, clear it
        console.warn('[AuthContext] Failed to parse stored user', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/auth/signin`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    
    let role = 'EMPLOYEE';
    let name = email.split('@')[0];
    let userId = email;

    if (data.idToken) {
      try {
        const tokenParts = data.idToken.split('.');
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('Decoded token payload:', payload);

        role = payload['custom:role'] || 'EMPLOYEE';
        name = payload.name || email.split('@')[0];
        userId = payload.sub || email;
      } catch (e) {
        console.error('Failed to decode token:', e);
      }
    }

    const backendUser = data.user || {};
    const userData: User = {
      id: backendUser.userId || backendUser.id || userId,
      email: backendUser.email || email,
      name: backendUser.name || name,
      role: backendUser.role || role,
      teamId: backendUser.teamId ?? null,
    };
    
    console.log('User data being stored:', userData);
    
    const tokenData = data.accessToken || data.idToken;
    
    localStorage.setItem('token', tokenData);
    localStorage.setItem('user', JSON.stringify(userData));
    
    setToken(tokenData);
    setUser(userData);
  };

  const signup = async (userData: any) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/auth/signup`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Signup failed');
    }

    const data = await response.json();
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const normalizedRole = normalizeRole(user?.role);
  const isManager = normalizedRole === 'MANAGER' || normalizedRole === 'ADMIN';
  const isEmployee = normalizedRole === 'EMPLOYEE';

  return (
    <AuthContext.Provider value={{ user, token, isManager, isEmployee, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};