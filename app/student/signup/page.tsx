'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function StudentSignup() {
  const router = useRouter();
  const [form, setForm] = useState({ reg_no: '', full_name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return { level: 0, label: '', color: '' };
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { level: 1, label: 'Weak', color: 'var(--danger)' };
    if (score <= 3) return { level: 2, label: 'Fair', color: 'var(--warning)' };
    return { level: 3, label: 'Strong', color: 'var(--success)' };
  };

  const strength = passwordStrength();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.email.endsWith('@rgmcet.edu.in')) {
      setError('Email must end with @rgmcet.edu.in');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/student/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reg_no: form.reg_no, full_name: form.full_name,
          email: form.email, password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push(`/student/verify-otp?email=${encodeURIComponent(form.email)}&type=verify`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="absolute top-[20%] right-[8%] w-56 h-56 rounded-full" style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 70%)', filter: 'blur(50px)' }} />

      <div className="auth-card animate-scale-in" style={{ maxWidth: 460 }}>
        <div className="text-center mb-8">
          <div className="auth-icon-wrap mb-4 mx-auto" style={{ background: 'rgba(34,211,238,0.1)' }}>✨</div>
          <h1 className="text-2xl font-bold text-text-1">Create Account</h1>
          <p className="text-text-3 text-sm mt-2">Join the AI-powered learning platform</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="reg_no" className="label-text">Reg. Number</label>
              <input id="reg_no" name="reg_no" type="text" className="input-field"
                placeholder="22B01A0501" value={form.reg_no} onChange={handleChange} required />
            </div>
            <div>
              <label htmlFor="full_name" className="label-text">Full Name</label>
              <input id="full_name" name="full_name" type="text" className="input-field"
                placeholder="Your name" value={form.full_name} onChange={handleChange} required />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="label-text">College Email</label>
            <input id="email" name="email" type="email" className="input-field"
              placeholder="yourname@rgmcet.edu.in" value={form.email} onChange={handleChange} required />
            <p className="text-xs text-text-3 mt-1.5 flex items-center gap-1">
              <span style={{ color: 'var(--accent)', fontSize: 10 }}>●</span> Must end with @rgmcet.edu.in
            </p>
          </div>

          <div>
            <label htmlFor="password" className="label-text">Password</label>
            <div className="relative">
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} className="input-field"
                style={{ paddingRight: 48 }}
                placeholder="Min 6 characters" value={form.password} onChange={handleChange} required />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-2 text-sm"
                onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {form.password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--glass)' }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{
                    width: `${(strength.level / 3) * 100}%`, background: strength.color,
                  }} />
                </div>
                <span className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</span>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirm" className="label-text">Confirm Password</label>
            <input id="confirm" name="confirm" type="password" className="input-field"
              placeholder="Re-enter password" value={form.confirm} onChange={handleChange} required />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--danger-light)' }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : null}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-text-3 text-sm">
            Already have an account?{' '}
            <Link href="/student/login" className="text-primary-light hover:text-accent transition-colors font-medium">Sign In</Link>
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-glass-border flex items-center justify-between">
          <Link href="/" className="text-xs text-text-3 hover:text-text-2 transition-colors">← Back to Home</Link>
          <span className="badge badge-accent" style={{ fontSize: 9 }}>AI Platform</span>
        </div>
      </div>
    </div>
  );
}
