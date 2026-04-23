'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function StudentLogin() {
  const router = useRouter();
  const [regNo, setRegNo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reg_no: regNo, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      router.push('/student/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Decorative side glow */}
      <div className="absolute top-1/3 left-[10%] w-64 h-64 rounded-full" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="absolute bottom-1/4 right-[10%] w-48 h-48 rounded-full" style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)', filter: 'blur(50px)' }} />

      <div className="auth-card animate-scale-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="auth-icon-wrap mb-4 mx-auto" style={{ background: 'rgba(99,102,241,0.1)' }}>
            🎓
          </div>
          <h1 className="text-2xl font-bold text-text-1">Welcome Back</h1>
          <p className="text-text-3 text-sm mt-2">Sign in to continue your learning journey</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="reg_no" className="label-text">Registration Number</label>
            <input id="reg_no" type="text" className="input-field"
              placeholder="e.g. 22B01A0501" value={regNo}
              onChange={(e) => setRegNo(e.target.value)} required />
          </div>

          <div>
            <label htmlFor="password" className="label-text">Password</label>
            <div className="relative">
              <input id="password" type={showPassword ? 'text' : 'password'} className="input-field"
                style={{ paddingRight: 48 }}
                placeholder="Enter your password" value={password}
                onChange={(e) => setPassword(e.target.value)} required />
              <button type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-2 transition-colors text-sm"
                onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--danger-light)' }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 space-y-3 text-center">
          <Link href="/student/forgot-password" className="text-sm text-primary-light hover:text-accent transition-colors block">
            Forgot password?
          </Link>
          <p className="text-text-3 text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/student/signup" className="text-primary-light hover:text-accent transition-colors font-medium">
              Sign Up
            </Link>
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-glass-border flex items-center justify-between">
          <Link href="/" className="text-xs text-text-3 hover:text-text-2 transition-colors">← Back to Home</Link>
          <span className="badge badge-primary" style={{ fontSize: 9 }}>5 AI Models</span>
        </div>
      </div>
    </div>
  );
}
