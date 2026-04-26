'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

interface User { id: string; reg_no: string; email: string; full_name: string; created_at: string; }
interface ClassifyData { level: string; confidence: number; probabilities: Record<string, number>; features: { avgScore: number; quizCount: number; timeEfficiency: number; consistency: number; improvementRate: number; peakPerformance: number }; totalAttempts: number; model: string; }
interface WeakArea { subject: string; score: number; error: number; isWeak: boolean; severity?: string; }
interface PredictData { predictions: number[]; trend: string; history: number[]; confidence: number; model: string; }
interface RecommendData { quizzes: Array<{ quiz_id: string; title: string; subject: string; predicted_score: number; reason: string }>; references: Array<{ ref_id: string; title: string; subject: string; relevance: number; reason: string }>; model: string; }

function AnimCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
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

function MiniBarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 56 }}>
      {data.map((v, i) => (
        <div key={i} title={`${v}%`} style={{
          flex: 1, borderRadius: '4px 4px 0 0', minWidth: 6,
          height: `${Math.max(8, (v / max) * 100)}%`,
          background: `linear-gradient(180deg, ${color}, ${color}88)`,
          opacity: 0.4 + (i / data.length) * 0.6,
          animation: `fillBar 0.8s ease-out ${i * 0.05}s both`,
        }} />
      ))}
    </div>
  );
}

function SkillRadar({ features }: { features: ClassifyData['features'] }) {
  const labels = ['Avg Score', 'Experience', 'Speed', 'Consistency', 'Growth', 'Peak'];
  const values = [features.avgScore, features.quizCount, features.timeEfficiency, features.consistency, features.improvementRate, features.peakPerformance];
  const cx = 90, cy = 90, r = 65, n = 6;
  const angleStep = (2 * Math.PI) / n;

  const getPoint = (i: number, val: number) => ({
    x: cx + Math.cos(angleStep * i - Math.PI / 2) * r * val,
    y: cy + Math.sin(angleStep * i - Math.PI / 2) * r * val,
  });

  const gridPaths = [0.25, 0.5, 0.75, 1].map(scale =>
    Array.from({ length: n }, (_, i) => getPoint(i, scale)).map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z'
  );

  const dataPath = values.map((v, i) => getPoint(i, v)).map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

  return (
    <svg viewBox="0 0 180 180" style={{ width: '100%', maxWidth: 220, margin: '0 auto', display: 'block' }}>
      {gridPaths.map((d, i) => <path key={i} d={d} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />)}
      {Array.from({ length: n }, (_, i) => {
        const p = getPoint(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />;
      })}
      <path d={dataPath} fill="rgba(99,102,241,0.15)" stroke="var(--primary)" strokeWidth={1.5} strokeLinejoin="round">
        <animate attributeName="opacity" from="0" to="1" dur="0.8s" fill="freeze" />
      </path>
      {values.map((v, i) => {
        const p = getPoint(i, v);
        return <circle key={i} cx={p.x} cy={p.y} r={3} fill="var(--primary-light)" />;
      })}
      {labels.map((label, i) => {
        const p = getPoint(i, 1.22);
        return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill="var(--text-3)" fontSize={7} fontWeight={500}>{label}</text>;
      })}
    </svg>
  );
}

export default function StudentDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [classify, setClassify] = useState<ClassifyData | null>(null);
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const [predict, setPredict] = useState<PredictData | null>(null);
  const [recommend, setRecommend] = useState<RecommendData | null>(null);
  const [loadingAI, setLoadingAI] = useState(true);

  useEffect(() => {
    fetch('/api/student/me').then(res => res.json()).then(data => { if (data.user) setUser(data.user); });
    Promise.all([
      fetch('/api/dl/classify').then(r => r.json()).catch(() => null),
      fetch('/api/dl/weak-areas').then(r => r.json()).catch(() => null),
      fetch('/api/dl/predict').then(r => r.json()).catch(() => null),
      fetch('/api/dl/recommend').then(r => r.json()).catch(() => null),
    ]).then(([c, w, p, r]) => {
      if (c && !c.error) setClassify(c);
      if (w && !w.error) setWeakAreas(w.weakAreas || []);
      if (p && !p.error) setPredict(p);
      if (r && !r.error) setRecommend(r);
    }).finally(() => setLoadingAI(false));
  }, []);

  const greeting = () => { const h = new Date().getHours(); if (h < 12) return 'Good Morning'; if (h < 17) return 'Good Afternoon'; return 'Good Evening'; };
  const levelEmoji: Record<string, string> = { Beginner: '🌱', Intermediate: '📘', Advanced: '🚀', Expert: '🏆' };
  const levelColor: Record<string, string> = { Beginner: 'var(--warning)', Intermediate: 'var(--primary-light)', Advanced: 'var(--accent)', Expert: 'var(--success)' };
  const trendInfo: Record<string, { icon: string; label: string; color: string }> = {
    improving: { icon: '📈', label: '↑ Improving', color: 'var(--success)' },
    declining: { icon: '📉', label: '↓ Declining', color: 'var(--danger)' },
    stable: { icon: '➡️', label: '→ Stable', color: 'var(--warning)' },
  };
  const SkeletonCard = () => <div className="glass-card p-6 space-y-3"><div className="skeleton" style={{ width: '40%', height: 14 }} /><div className="skeleton" style={{ width: '60%', height: 28 }} /><div className="skeleton" style={{ width: '50%', height: 12 }} /></div>;

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="page-header animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold text-text-1">
          {greeting()}, <span className="gradient-text">{user?.full_name || 'Student'}</span> <span className="animate-wave">👋</span>
        </h1>
        <p className="text-text-3 mt-2 text-sm">Here&apos;s your AI-powered learning overview</p>
        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <Link href="/student/dashboard/quiz" className="btn-primary text-xs" style={{ padding: '8px 16px' }}>📝 Take Quiz</Link>
          <Link href="/student/dashboard/references" className="btn-ghost text-xs" style={{ padding: '8px 16px' }}>📚 References</Link>
          <Link href="/student/dashboard/nlp-analyzer" className="btn-ghost text-xs" style={{ padding: '8px 16px' }}>💬 NLP</Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in-delay-1" style={{ opacity: 0 }}>
        <div className="glass-card-hover p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)' }}>{levelEmoji[classify?.level || 'Beginner'] || '🧠'}</div>
            <span className="text-xs text-text-3 font-medium uppercase tracking-wider">Level</span>
          </div>
          {loadingAI ? <div className="skeleton" style={{ width: '70%', height: 24 }} /> : <>
            <span className="text-xl font-bold" style={{ color: levelColor[classify?.level || 'Beginner'] }}>{classify?.level || 'Beginner'}</span>
            <div className="mt-2 flex items-center gap-2">
              <span className="badge badge-primary" style={{ fontSize: 9 }}>ANN</span>
              {classify?.confidence != null && <span className="text-xs text-text-3"><AnimCounter value={Math.round(classify.confidence * 100)} suffix="%" /></span>}
            </div>
          </>}
        </div>

        <div className="glass-card-hover p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.15)' }}>{trendInfo[predict?.trend || 'stable'].icon}</div>
            <span className="text-xs text-text-3 font-medium uppercase tracking-wider">Trend</span>
          </div>
          {loadingAI ? <div className="skeleton" style={{ width: '65%', height: 24 }} /> : <>
            <span className="text-xl font-bold" style={{ color: trendInfo[predict?.trend || 'stable'].color }}>{trendInfo[predict?.trend || 'stable'].label}</span>
            <div className="mt-2 flex items-center gap-2">
              <span className="badge badge-success" style={{ fontSize: 9 }}>LSTM</span>
            </div>
          </>}
        </div>

        <div className="glass-card-hover p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.15)' }}>🏆</div>
            <span className="text-xs text-text-3 font-medium uppercase tracking-wider">Quizzes</span>
          </div>
          <span className="text-xl font-bold text-primary-light"><AnimCounter value={classify?.totalAttempts ?? 0} /></span>
        </div>

        <div className="glass-card-hover p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="stat-icon" style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.15)' }}>⭐</div>
            <span className="text-xs text-text-3 font-medium uppercase tracking-wider">Avg Score</span>
          </div>
          <span className="text-xl font-bold" style={{ color: 'var(--accent)' }}>
            {classify?.features?.avgScore != null ? <AnimCounter value={Math.round(classify.features.avgScore * 100)} suffix="%" /> : '--'}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-in-delay-2" style={{ opacity: 0 }}>
        {/* Weak Areas */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-text-1 mb-4 flex items-center gap-2">🔍 Weak Areas <span className="badge badge-danger" style={{ fontSize: 9 }}>Autoencoder</span></h3>
          {loadingAI ? <SkeletonCard /> : weakAreas.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 16px' }}><div className="empty-state-icon mx-auto">🔍</div><p className="text-text-3 text-sm">Take quizzes across subjects to unlock detection</p></div>
          ) : (
            <div className="space-y-2.5">
              {weakAreas.slice(0, 5).map(area => (
                <div key={area.subject} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--glass)' }}>
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="text-sm text-text-2">{area.subject}</span>
                    {area.isWeak && <span className="badge badge-danger" style={{ fontSize: 8, padding: '1px 6px' }}>{area.severity === 'critical' ? '🔴 Critical' : '⚠️ Weak'}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-3 font-mono">{area.score}%</span>
                    <div className="progress-bar" style={{ width: 64 }}>
                      <div className="progress-fill" style={{ width: `${area.score}%`, background: area.score >= 70 ? 'var(--success)' : area.score >= 50 ? 'linear-gradient(90deg, var(--warning), var(--success))' : 'linear-gradient(90deg, var(--danger), var(--warning))' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-text-1 mb-4 flex items-center gap-2">🎯 Recommendations <span className="badge badge-primary" style={{ fontSize: 9 }}>NCF</span></h3>
          {loadingAI ? <SkeletonCard /> : (
            <div className="space-y-2.5">
              {(recommend?.quizzes || []).slice(0, 3).map(rec => (
                <Link key={rec.quiz_id} href={`/student/dashboard/quiz/${rec.quiz_id}`} className="flex items-center gap-3 p-3 rounded-xl transition-all hover:translate-x-1" style={{ background: 'var(--glass)', border: '1px solid transparent' }}>
                  <div className="stat-icon" style={{ width: 36, height: 36, background: 'rgba(99,102,241,0.1)', fontSize: 16 }}>📝</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-1 truncate font-medium">{rec.title}</p>
                    <p className="text-xs text-text-3">{rec.subject} · {rec.predicted_score}%</p>
                  </div>
                </Link>
              ))}
              {(recommend?.references || []).slice(0, 2).map(rec => (
                <div key={rec.ref_id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--glass)' }}>
                  <div className="stat-icon" style={{ width: 36, height: 36, background: 'rgba(34,211,238,0.1)', fontSize: 16 }}>📚</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-1 truncate font-medium">{rec.title}</p>
                    <p className="text-xs text-text-3">{rec.reason}</p>
                  </div>
                </div>
              ))}
              {(!recommend?.quizzes?.length && !recommend?.references?.length) && (
                <div className="empty-state" style={{ padding: '32px 16px' }}><div className="empty-state-icon mx-auto">🎯</div><p className="text-text-3 text-sm">Complete more quizzes for recommendations</p></div>
              )}
            </div>
          )}
        </div>

        {/* LSTM Predictions */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-text-1 mb-4 flex items-center gap-2">📈 Predictions <span className="badge badge-warning" style={{ fontSize: 9 }}>LSTM</span></h3>
          {loadingAI ? <SkeletonCard /> : predict?.predictions?.length ? (
            <div className="space-y-4">
              {predict.history.length > 0 && (
                <div><p className="text-xs text-text-3 mb-2 uppercase tracking-wider">Score History</p><MiniBarChart data={predict.history.slice(-8)} color="var(--primary-light)" /></div>
              )}
              <div>
                <p className="text-xs text-text-3 mb-2 uppercase tracking-wider">Predicted Next</p>
                <div className="flex gap-2">
                  {predict.predictions.map((score, i) => (
                    <div key={i} className="flex-1 text-center p-3 rounded-xl" style={{ background: 'var(--glass)', border: `1px solid ${score >= 70 ? 'rgba(16,185,129,0.2)' : score >= 50 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                      <span className="text-lg font-bold font-mono" style={{ color: score >= 70 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)' }}>{score}%</span>
                      <p className="text-xs text-text-3 mt-0.5">Quiz {i + 1}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '32px 16px' }}><div className="empty-state-icon mx-auto">📈</div><p className="text-text-3 text-sm">Take quizzes to unlock LSTM predictions</p></div>
          )}
        </div>
      </div>

      {/* Skill Radar + Probability Chart */}
      {classify && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6 animate-fade-in-delay-3" style={{ opacity: 0 }}>
          <div className="glass-card p-6">
            <h3 className="text-base font-semibold text-text-1 mb-4 flex items-center gap-2">🕸️ Skill Profile <span className="badge badge-accent" style={{ fontSize: 9 }}>6 Features</span></h3>
            <SkillRadar features={classify.features} />
          </div>
          <div className="glass-card p-6">
            <h3 className="text-base font-semibold text-text-1 mb-4 flex items-center gap-2">📊 Level Probabilities <span className="badge badge-primary" style={{ fontSize: 9 }}>Softmax</span></h3>
            <div className="space-y-3">
              {Object.entries(classify.probabilities).map(([level, prob]) => (
                <div key={level}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-text-2 flex items-center gap-1.5">{levelEmoji[level]} {level}</span>
                    <span className="text-sm font-bold font-mono" style={{ color: levelColor[level] }}>{Math.round(prob * 100)}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: 8 }}>
                    <div className="progress-fill animate-fill" style={{ width: `${prob * 100}%`, background: levelColor[level] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Learning Path */}
      <div className="mt-6 glass-card p-6 animate-fade-in-delay-4" style={{ opacity: 0 }}>
        <h3 className="text-base font-semibold text-text-1 mb-5 flex items-center gap-2">🗺️ Your Learning Path <span className="badge badge-accent" style={{ fontSize: 9 }}>AI-Generated</span></h3>
        <div className="flex items-center gap-4 overflow-x-auto pb-2">
          {['Foundation', 'Core Concepts', 'Advanced Topics', 'Mastery'].map((stage, i) => {
            const currentLevelIdx = classify ? ['Beginner', 'Intermediate', 'Advanced', 'Expert'].indexOf(classify.level) : 0;
            const isUnlocked = i <= currentLevelIdx;
            const isCurrent = i === currentLevelIdx;
            return (
              <div key={stage} className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center justify-center text-base font-bold transition-all" style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: isCurrent ? 'rgba(99,102,241,0.15)' : isUnlocked ? 'rgba(16,185,129,0.08)' : 'var(--glass)',
                  color: isCurrent ? 'var(--primary-light)' : isUnlocked ? 'var(--success)' : 'var(--text-3)',
                  border: `1px solid ${isCurrent ? 'rgba(99,102,241,0.25)' : isUnlocked ? 'rgba(16,185,129,0.15)' : 'var(--glass-border)'}`,
                  boxShadow: isCurrent ? '0 0 20px rgba(99,102,241,0.15)' : 'none',
                }}>
                  {isUnlocked && !isCurrent ? '✓' : i + 1}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: isCurrent ? 'var(--text-1)' : isUnlocked ? 'var(--success)' : 'var(--text-3)' }}>{stage}</p>
                  <p className="text-xs text-text-3">{isCurrent ? 'Current' : isUnlocked ? 'Completed' : 'Locked'}</p>
                </div>
                {i < 3 && <div style={{ width: 32, height: 1, background: isUnlocked ? 'rgba(16,185,129,0.3)' : 'var(--glass-border)' }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Models */}
      <div className="mt-5 glass-card p-5 animate-fade-in-delay-5" style={{ opacity: 0 }}>
        <h3 className="text-sm font-semibold text-text-1 mb-3 flex items-center gap-2">🧠 Active AI Models</h3>
        <div className="flex flex-wrap gap-2">
          {[{ name: 'ANN', desc: 'Classifier', icon: '🧠' }, { name: 'Autoencoder', desc: 'Weak Areas', icon: '🔍' }, { name: 'LSTM', desc: 'Predictions', icon: '📈' }, { name: 'NCF', desc: 'Recommender', icon: '🎯' }, { name: 'NLP', desc: 'Analyzer', icon: '💬' }].map(m => (
            <div key={m.name} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)' }}>
              <span className="text-sm">{m.icon}</span>
              <span className="text-xs font-medium text-text-2">{m.name}</span>
              <span className="text-xs text-text-3">· {m.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
