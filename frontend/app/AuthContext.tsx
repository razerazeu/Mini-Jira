'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  teamId: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isManager: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user was logged in (from localStorage)
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
    console.debug('[AuthContext] login url', url);
    console.debug('[AuthContext] login payload', { email, password: password ? '***' : '' });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      let errorMessage = 'Login failed';
      try {
        const error = await response.json();
        errorMessage = error.message || errorMessage;
      } catch (err) {
        console.warn('[AuthContext] login error parsing response', err);
        errorMessage = `Login failed: ${response.status} ${response.statusText}`;
      }
      console.error('[AuthContext] login failed', {
        status: response.status,
        statusText: response.statusText,
        url,
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Store token and user info
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    setToken(data.accessToken);
    setUser(data.user);
  };

  const signup = async (userData: any) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/auth/signup`;
    console.debug('[AuthContext] signup url', url);
    console.debug('[AuthContext] signup payload', userData);
    console.debug('[AuthContext] env NEXT_PUBLIC_API_URL', process.env.NEXT_PUBLIC_API_URL);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      let errorMessage = 'Signup failed';
      try {
        const error = await response.json();
        errorMessage = error.message || errorMessage;
      } catch (err) {
        console.warn('[AuthContext] signup error parsing response', err);
        errorMessage = `Signup failed: ${response.status} ${response.statusText}`;
      }
      console.error('[AuthContext] signup failed', {
        status: response.status,
        statusText: response.statusText,
        url,
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.debug('[AuthContext] signup response', data);

    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const isManager = user?.role === 'Manager';

  return (
    <AuthContext.Provider value={{ user, token, isManager, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};