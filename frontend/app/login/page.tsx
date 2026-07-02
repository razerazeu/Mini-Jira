'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const KANBAN_COLUMNS = [
  { title: 'To Do', dot: 'bg-gray-400', accent: 'border-l-gray-400' },
  { title: 'In Progress', dot: 'bg-blue-500', accent: 'border-l-blue-500' },
  { title: 'Done', dot: 'bg-green-500', accent: 'border-l-green-500' },
] as const;

const CARD_REM = 3.1; // approx height (card + gap) used to animate column size
const DRAGGED_CARD = 'Design review';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Decorative kanban demo: drags a card To Do -> In Progress -> Done, then loops.
  const [phase, setPhase] = useState(0);
  const draggedCardRef = useRef<HTMLDivElement | null>(null);
  const prevRectRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (draggedCardRef.current) {
        prevRectRef.current = draggedCardRef.current.getBoundingClientRect();
      }
      setPhase((p) => (p + 1) % 3);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  // FLIP: after the card re-mounts in its new column, animate it from its
  // previous screen position to the new one instead of letting it teleport.
  useLayoutEffect(() => {
    const el = draggedCardRef.current;
    const prevRect = prevRectRef.current;
    if (!el || !prevRect) return;

    const newRect = el.getBoundingClientRect();
    const dx = prevRect.left - newRect.left;
    const dy = prevRect.top - newRect.top;

    if (dx === 0 && dy === 0) return;

    el.style.transition = 'none';
    el.style.transform = `translate(${dx}px, ${dy}px) scale(1.05)`;
    el.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.5)';
    el.style.zIndex = '10';
    // Force a reflow so the browser registers the start position before animating.
    el.getBoundingClientRect();

    requestAnimationFrame(() => {
      el.style.transition = 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.6s ease';
      el.style.transform = '';
      el.style.boxShadow = '';
    });
  }, [phase]);

  const boardColumns: string[][] =
    phase === 0
      ? [[DRAGGED_CARD, 'Fix login bug'], ['API integration'], ['Setup project', 'Write specs']]
      : phase === 1
      ? [['Fix login bug'], ['API integration', DRAGGED_CARD], ['Setup project', 'Write specs']]
      : [['Fix login bug'], ['API integration'], ['Setup project', 'Write specs', DRAGGED_CARD]];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F7F8FA]">
      {/* Left: decorative kanban board animation, hidden on small screens */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 border-r border-[#E4E7EB] overflow-hidden relative">
        <div
          className="absolute -top-40 -left-40 w-[32rem] h-[32rem] rounded-full bg-blue-600/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="max-w-sm w-full relative">
          <img src="/Logo.png" alt="Mini Jira" className="w-96 h-auto -ml-27 -mb-2" />
          <p className="text-[#6B778C] mb-10">Plan, track, and ship work with your team.</p>

          <div className="grid grid-cols-3 gap-4 items-start">
            {KANBAN_COLUMNS.map((col, colIdx) => {
              const cards = boardColumns[colIdx];
              return (
                <div
                  key={col.title}
                  className="bg-white/80 backdrop-blur border border-[#E4E7EB] rounded-lg p-2 shadow-lg transition-all duration-700 ease-in-out"
                  style={{ minHeight: `${cards.length * CARD_REM + 1.75}rem` }}
                >
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <span className="text-xs font-medium text-[#6B778C]">{col.title}</span>
                  </div>
                  <div className="space-y-2">
                    {cards.map((card) => (
                      <div
                        key={card}
                        ref={card === DRAGGED_CARD ? draggedCardRef : undefined}
                        className={`kanban-card border-l-2 ${col.accent} bg-[#F4F5F7] border border-[#E4E7EB] rounded-md p-2 text-xs text-[#172B4D] shadow-sm`}
                      >
                        {card}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-xl border border-[#E4E7EB]">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#172B4D]">Welcome Back</h2>
            <p className="mt-2 text-[#6B778C]">Sign in to your account</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#172B4D] mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full px-4 py-2 bg-white border border-[#E4E7EB] rounded-lg focus:ring-2 focus:ring-[#0052CC] focus:border-[#0052CC] outline-none transition text-[#172B4D] placeholder-[#6B778C] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B778C] hover:text-[#172B4D]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0052CC] hover:bg-[#0747A6] hover:shadow-lg hover:shadow-blue-600/30 text-white py-2 px-4 rounded-lg transition disabled:opacity-50 font-medium"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-[#6B778C]">
            Don't have an account?{' '}
            <a href="/signup" className="text-[#0052CC] hover:text-[#0747A6] font-medium">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}