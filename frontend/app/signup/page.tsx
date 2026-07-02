'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../AuthContext';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    teamId: undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.debug('[SignupPage] submitting', formData);

    try {
      await signup(formData);
      router.push('/login?registered=true');
    } catch (err: any) {
      console.error('[SignupPage] signup error', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA] py-12 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-xl border border-[#E4E7EB]">

        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#172B4D]">Create Account</h2>
          <p className="mt-2 text-[#6B778C]">Join your team on Mini-Jira</p>
        </div>

        <p className="text-sm text-[#6B778C] text-center">
          Create an account!
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-[#172B4D] mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              placeholder="John Doe"
              className="w-full px-4 py-2 bg-white border border-[#E4E7EB] rounded-lg focus:ring-2 focus:ring-[#0052CC] focus:border-[#0052CC] outline-none transition text-[#172B4D] placeholder-[#6B778C]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#172B4D] mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              placeholder="you@example.com"
              className="w-full px-4 py-2 bg-white border border-[#E4E7EB] rounded-lg focus:ring-2 focus:ring-[#0052CC] focus:border-[#0052CC] outline-none transition text-[#172B4D] placeholder-[#6B778C]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#172B4D] mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                placeholder="Create a password"
                className="w-full px-4 py-2 bg-white border border-[#E4E7EB] rounded-lg focus:ring-2 focus:ring-[#0052CC] focus:border-[#0052CC] outline-none transition text-[#172B4D] placeholder-[#6B778C] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B778C] hover:text-[#172B4D]"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <p className="text-xs text-[#6B778C] mt-1">
              At least 8 characters (including uppercase, lowercase, and numbers)
            </p>
          </div>


          <input type="hidden" name="role" value="EMPLOYEE" />

          <button
            type="submit"
            disabled={loading || !formData.name || !formData.email || !formData.password}
            className="w-full bg-[#0052CC] hover:bg-[#0747A6] text-white py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium mt-6"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </span>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-[#6B778C]">
          Already have an account?{' '}
          <a href="/login" className="text-[#0052CC] hover:text-[#0747A6] font-medium">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}