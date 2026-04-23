'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/student/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push(`/student/verify-otp?email=${encodeURIComponent(email)}&type=reset`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="absolute top-1/3 left-[12%] w-56 h-56 rounded-full" style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)', filter: 'blur(50px)' }} />

      <div className="auth-card animate-scale-in">
        <div className="text-center mb-8">
          <div className="auth-icon-wrap mb-4 mx-auto" style={{ background: 'rgba(245,158,11,0.1)' }}>🔑</div>
          <h1 className="text-2xl font-bold text-text-1">Forgot Password</h1>
          <p className="text-text-3 text-sm mt-2">Enter your email to receive a reset OTP</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="label-text">Email Address</label>
            <input id="email" type="email" className="input-field"
              placeholder="yourname@rgmcet.edu.in" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--danger-light)' }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}
            style={{ background: 'linear-gradient(135deg, var(--warning), var(--warning-light))' }}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : null}
            {loading ? 'Sending OTP...' : 'Send Reset OTP'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/student/login" className="text-sm text-text-3 hover:text-text-2 transition-colors">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
