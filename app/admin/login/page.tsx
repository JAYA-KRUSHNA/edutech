'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push('/admin/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="absolute top-1/3 right-[12%] w-60 h-60 rounded-full" style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)', filter: 'blur(50px)' }} />

      <div className="auth-card animate-scale-in">
        <div className="text-center mb-8">
          <div className="auth-icon-wrap mb-4 mx-auto" style={{ background: 'rgba(239,68,68,0.1)' }}>🛡️</div>
          <h1 className="text-2xl font-bold text-text-1">Admin Portal</h1>
          <p className="text-text-3 text-sm mt-2">Authorized personnel only</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="label-text">Email</label>
            <input id="email" type="email" className="input-field"
              placeholder="admin@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div>
            <label htmlFor="password" className="label-text">Password</label>
            <div className="relative">
              <input id="password" type={showPassword ? 'text' : 'password'} className="input-field"
                style={{ paddingRight: 48 }}
                placeholder="Enter your password" value={password}
                onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-2 text-sm"
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

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}
            style={{ background: 'linear-gradient(135deg, #ef4444, #f87171)' }}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : null}
            {loading ? 'Signing in...' : 'Sign In as Admin'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-glass-border flex items-center justify-between">
          <Link href="/" className="text-xs text-text-3 hover:text-text-2 transition-colors">← Back to Home</Link>
          <span className="badge badge-danger" style={{ fontSize: 9 }}>Admin Access</span>
        </div>
      </div>
    </div>
  );
}
