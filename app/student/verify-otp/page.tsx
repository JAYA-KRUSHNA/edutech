'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const type = searchParams.get('type') || 'verify';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(600);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pasteData.length; i++) {
      if (/\d/.test(pasteData[i])) newOtp[i] = pasteData[i];
    }
    setOtp(newOtp);
    inputRefs.current[Math.min(pasteData.length, 5)]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpStr = otp.join('');
    if (otpStr.length !== 6) { setError('Please enter the complete 6-digit OTP'); return; }
    setError(''); setLoading(true);

    try {
      const res = await fetch('/api/student/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpStr, type }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }

      if (type === 'reset') {
        setSuccess('OTP verified! Redirecting...');
        setTimeout(() => router.push(`/student/reset-password?email=${encodeURIComponent(email)}`), 1500);
      } else {
        setSuccess('Email verified! Redirecting...');
        setTimeout(() => router.push('/student/dashboard'), 1500);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="page-container">
      <div className="absolute bottom-1/3 left-[10%] w-60 h-60 rounded-full" style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 70%)', filter: 'blur(50px)' }} />

      <div className="auth-card animate-scale-in">
        <div className="text-center mb-8">
          <div className="auth-icon-wrap mb-4 mx-auto" style={{ background: 'rgba(34,211,238,0.1)' }}>🔐</div>
          <h1 className="text-2xl font-bold text-text-1">Verify OTP</h1>
          <p className="text-text-3 text-sm mt-2">
            We sent a 6-digit code to<br />
            <span className="text-primary-light font-medium">{email}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text" inputMode="numeric" maxLength={1}
                className="otp-input"
                value={digit}
                onChange={(e) => handleChange(i, e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => handleKeyDown(i, e)} />
            ))}
          </div>

          {countdown > 0 ? (
            <p className="text-center text-sm text-text-3">
              Code expires in <span className="font-mono font-semibold" style={{ color: 'var(--warning)' }}>{formatTime(countdown)}</span>
            </p>
          ) : (
            <p className="text-center text-sm" style={{ color: 'var(--danger)' }}>OTP has expired</p>
          )}

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

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2"
            disabled={loading || countdown <= 0}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : null}
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={<div className="page-container"><span className="spinner" /></div>}>
      <VerifyOTPContent />
    </Suspense>
  );
}
