'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);

    try {
      const res = await fetch('/api/student/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, new_password: password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSuccess('Password reset successfully! Redirecting...');
      setTimeout(() => router.push('/student/login'), 2000);
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="absolute top-1/4 right-[15%] w-52 h-52 rounded-full" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)', filter: 'blur(50px)' }} />

      <div className="auth-card animate-scale-in">
        <div className="text-center mb-8">
          <div className="auth-icon-wrap mb-4 mx-auto" style={{ background: 'rgba(16,185,129,0.1)' }}>🔒</div>
          <h1 className="text-2xl font-bold text-text-1">Reset Password</h1>
          <p className="text-text-3 text-sm mt-2">Set your new password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="password" className="label-text">New Password</label>
            <input id="password" type="password" className="input-field"
              placeholder="Min 6 characters" value={password}
              onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <div>
            <label htmlFor="confirm" className="label-text">Confirm New Password</label>
            <input id="confirm" type="password" className="input-field"
              placeholder="Re-enter new password" value={confirm}
              onChange={(e) => setConfirm(e.target.value)} required />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--danger-light)' }}>
              <span>⚠️</span> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', color: 'var(--success-light)' }}>
              <span>✅</span> {success}
            </div>
          )}

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}
            style={{ background: 'linear-gradient(135deg, var(--success), var(--success-light))' }}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : null}
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="page-container"><span className="spinner" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
