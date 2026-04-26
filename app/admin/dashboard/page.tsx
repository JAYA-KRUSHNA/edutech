'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

interface AdminUser { id: string; email: string; full_name: string; is_super: boolean; }
interface Analytics {
  overview: { totalStudents: number; verifiedStudents: number; totalQuizzes: number; totalReferences: number; totalAttempts: number; platformAvgScore: number; recentAttempts: number; recentStudents: number; };
  levelDistribution: Record<string, number>;
  subjectPerformance: Array<{ subject: string; avgScore: number; totalAttempts: number }>;
  topStudents: Array<{ id: string; name: string; reg_no: string; level: string; avgScore: number; quizCount: number }>;
}

function AnimNum({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!value) return;
    let start = 0;
    const step = (ts: number) => { if (!start) start = ts; const p = Math.min((ts - start) / 800, 1); setDisplay(Math.round((1 - Math.pow(1 - p, 3)) * value)); if (p < 1) requestAnimationFrame(step); };
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { requestAnimationFrame(step); obs.disconnect(); } }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [value]);
  return <span ref={ref}>{display}{suffix}</span>;
}

function DonutChart({ data }: { data: Record<string, number> }) {
  const colors: Record<string, string> = { Beginner: '#ef4444', Intermediate: '#f59e0b', Advanced: '#3b82f6', Expert: '#10b981' };
  const total = Object.values(data).reduce((s, v) => s + v, 0);
  if (total === 0) return <p className="text-text-3 text-sm text-center py-6">No data yet</p>;

  const entries = Object.entries(data);
  let cumulative = 0;
  const size = 120, cx = size / 2, cy = size / 2, r = 44, strokeWidth = 16;
  const circumference = 2 * Math.PI * r;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        {entries.map(([level, count]) => {
          const pct = count / total;
          const offset = cumulative * circumference;
          cumulative += pct;
          return (
            <circle key={level} cx={cx} cy={cy} r={r} fill="none"
              stroke={colors[level] || 'var(--text-3)'} strokeWidth={strokeWidth}
              strokeDasharray={`${pct * circumference} ${circumference}`}
              strokeDashoffset={-offset} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }}>
              <animate attributeName="stroke-dasharray" from={`0 ${circumference}`} to={`${pct * circumference} ${circumference}`} dur="1s" fill="freeze" />
            </circle>
          );
        })}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="var(--text-1)" fontSize="18" fontWeight="800" style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>{total}</text>
      </svg>
      <div className="space-y-2">
        {entries.map(([level, count]) => (
          <div key={level} className="flex items-center gap-2">
            <div style={{ width: 10, height: 10, borderRadius: 3, background: colors[level] }} />
            <span className="text-xs text-text-2">{level}</span>
            <span className="text-xs font-bold font-mono text-text-1">{count}</span>
            <span className="text-xs text-text-3">({total > 0 ? Math.round((count / total) * 100) : 0}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loadingAI, setLoadingAI] = useState(true);

  useEffect(() => {
    fetch('/api/admin/me').then(r => r.json()).then(d => { if (d.user) setUser(d.user); });
    fetch('/api/dl/admin-analytics').then(r => r.json()).then(data => { if (!data.error) setAnalytics(data); }).finally(() => setLoadingAI(false));
  }, []);

  const levelColors: Record<string, string> = { Beginner: '#ef4444', Intermediate: '#f59e0b', Advanced: '#3b82f6', Expert: '#10b981' };
  const o = analytics?.overview;

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      <div className="page-header animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold text-text-1">
          Welcome, <span className="gradient-text">{user?.full_name || 'Admin'}</span>{user?.is_super ? ' ⚡' : ' 🛡️'}
        </h1>
        <p className="text-text-3 mt-2 text-sm">AI-Powered Platform Analytics</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 animate-fade-in-delay-1" style={{ opacity: 0 }}>
        {[
          { label: 'Students', value: o?.totalStudents ?? 0, icon: '🎓', sub: `${o?.verifiedStudents ?? 0} verified`, color: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.15)', trend: o?.recentStudents ? `+${o.recentStudents} this week` : undefined },
          { label: 'Quizzes', value: o?.totalQuizzes ?? 0, icon: '📝', sub: `${o?.totalAttempts ?? 0} attempts`, color: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.15)' },
          { label: 'References', value: o?.totalReferences ?? 0, icon: '📚', sub: 'shared resources', color: 'rgba(34,211,238,0.1)', border: 'rgba(34,211,238,0.15)' },
          { label: 'Platform Avg', value: o?.platformAvgScore ?? 0, icon: '⭐', sub: `${o?.recentAttempts ?? 0} this week`, color: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.15)', suffix: '%' },
        ].map(card => (
          <div key={card.label} className="glass-card-hover p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="stat-icon" style={{ width: 38, height: 38, background: card.color, border: `1px solid ${card.border}`, fontSize: 18 }}>{card.icon}</div>
              <span className="text-xs text-text-3 font-medium uppercase tracking-wider">{card.label}</span>
            </div>
            {loadingAI ? <div className="skeleton" style={{ width: '60%', height: 24 }} /> : (
              <>
                <span className="text-2xl font-bold text-text-1 block"><AnimNum value={card.value} suffix={card.suffix} /></span>
                <span className="text-xs text-text-3">{card.sub}</span>
                {card.trend && <span className="text-xs block mt-1" style={{ color: 'var(--success)' }}>↑ {card.trend}</span>}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8 animate-fade-in-delay-2" style={{ opacity: 0 }}>
        {/* Donut Chart */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-text-1 mb-4 flex items-center gap-2">🧠 Level Distribution <span className="badge badge-primary" style={{ fontSize: 9 }}>ANN</span></h3>
          {loadingAI ? <div className="space-y-4">{[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 32 }} />)}</div> :
            analytics?.levelDistribution ? <DonutChart data={analytics.levelDistribution} /> : <p className="text-text-3 text-sm text-center py-6">No data yet</p>}
        </div>

        {/* Subject Performance */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-text-1 mb-4">📊 Subject Performance</h3>
          {loadingAI ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 48 }} />)}</div> : (analytics?.subjectPerformance?.length || 0) > 0 ? (
            <div className="space-y-2.5">
              {analytics!.subjectPerformance.slice(0, 6).map(sp => (
                <div key={sp.subject} className="p-3 rounded-xl" style={{ background: 'var(--glass)' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-text-2 truncate">{sp.subject}</span>
                    <span className="text-sm font-bold font-mono" style={{ color: sp.avgScore >= 70 ? 'var(--success)' : sp.avgScore >= 50 ? 'var(--warning)' : 'var(--danger)' }}>{sp.avgScore}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="progress-bar flex-1"><div className="progress-fill" style={{ width: `${sp.avgScore}%`, background: sp.avgScore >= 70 ? 'var(--success)' : sp.avgScore >= 50 ? 'linear-gradient(90deg, var(--warning), var(--success))' : 'linear-gradient(90deg, var(--danger), var(--warning))' }} /></div>
                    <span className="text-xs text-text-3 flex-shrink-0 font-mono">{sp.totalAttempts} att</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-text-3 text-sm text-center py-6">No quiz data yet</p>}
        </div>

        {/* Top Students */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-text-1 mb-4">🏆 Top Students</h3>
          {loadingAI ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 52 }} />)}</div> : (analytics?.topStudents?.length || 0) > 0 ? (
            <div className="space-y-2">
              {analytics!.topStudents.slice(0, 6).map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--glass)' }}>
                  <span className="text-base font-bold w-7 text-center" style={{ color: i < 3 ? 'var(--warning)' : 'var(--text-3)' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-1 font-medium truncate">{s.name}</p>
                    <p className="text-xs text-text-3 font-mono">{s.reg_no} · {s.quizCount} quizzes</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-bold font-mono" style={{ color: s.avgScore >= 70 ? 'var(--success)' : s.avgScore >= 50 ? 'var(--warning)' : 'var(--danger)' }}>{s.avgScore}%</span>
                    <p className="text-xs" style={{ color: levelColors[s.level] }}>{s.level}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-text-3 text-sm text-center py-6">No students have taken quizzes yet</p>}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="animate-fade-in-delay-3" style={{ opacity: 0 }}>
        <h3 className="text-base font-semibold text-text-1 mb-4">⚡ Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Manage Students', href: '/admin/dashboard/students', icon: '🎓', color: 'var(--primary)' },
            { label: 'Manage Quizzes', href: '/admin/dashboard/quiz', icon: '📝', color: 'var(--success)' },
            { label: 'References', href: '/admin/dashboard/references', icon: '📚', color: 'var(--accent)' },
            { label: 'Manage Admins', href: '/admin/dashboard/admins', icon: '🛡️', color: 'var(--warning)' },
          ].map(action => (
            <Link key={action.label} href={action.href} className="glass-card-hover p-5 flex flex-col items-center gap-3 text-center">
              <div className="stat-icon" style={{ background: `${action.color}15`, border: `1px solid ${action.color}20` }}>{action.icon}</div>
              <span className="text-sm font-medium text-text-2">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-5 glass-card p-4 animate-fade-in-delay-4" style={{ opacity: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs text-text-3">🧠 Analytics powered by</span>
          <div className="flex gap-2 flex-wrap">
            {['ANN Classifier', 'Autoencoder', 'LSTM', 'NCF', 'NLP'].map(m => <span key={m} className="badge badge-primary" style={{ fontSize: 9 }}>{m}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}
