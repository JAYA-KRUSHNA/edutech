'use client';

import { useEffect, useState } from 'react';

interface User { id: string; reg_no: string; email: string; full_name: string; created_at: string; }
interface ClassifyData { level: string; confidence: number; probabilities: Record<string, number>; features: { avgScore: number; quizCount: number; timeEfficiency: number; consistency: number }; totalAttempts: number; model: string; }
interface WeakArea { subject: string; score: number; error: number; isWeak: boolean; }
interface PredictData { predictions: number[]; trend: string; history: number[]; confidence: number; model: string; }
interface RecommendData { quizzes: Array<{ quiz_id: string; title: string; subject: string; predicted_score: number; reason: string }>; references: Array<{ ref_id: string; title: string; subject: string; relevance: number; reason: string }>; model: string; }

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

  const SkeletonCard = () => (
    <div className="glass-card p-6 space-y-3">
      <div className="skeleton" style={{ width: '40%', height: 14 }} />
      <div className="skeleton" style={{ width: '60%', height: 28 }} />
      <div className="skeleton" style={{ width: '50%', height: 12 }} />
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="page-header animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold text-text-1">
          {greeting()}, <span className="gradient-text">{user?.full_name || 'Student'}</span> <span className="animate-wave">👋</span>
        </h1>
        <p className="text-text-3 mt-2 text-sm">Here&apos;s your AI-powered learning overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in animate-fade-in-delay-1">
        {/* Student Level */}
        <div className="glass-card-hover p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)' }}>
              {levelEmoji[classify?.level || 'Beginner'] || '🧠'}
            </div>
            <span className="text-xs text-text-3 font-medium uppercase tracking-wider">Student Level</span>
          </div>
          {loadingAI ? <div className="skeleton" style={{ width: '70%', height: 24 }} /> : (
            <>
              <span className="text-xl font-bold" style={{ color: levelColor[classify?.level || 'Beginner'] }}>{classify?.level || 'Beginner'}</span>
              <div className="mt-2 flex items-center gap-2">
                <span className="badge badge-primary" style={{ fontSize: 9 }}>ANN</span>
                {classify?.confidence != null && <span className="text-xs text-text-3">{Math.round(classify.confidence * 100)}% conf</span>}
              </div>
            </>
          )}
        </div>

        {/* Learning Trend */}
        <div className="glass-card-hover p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.15)' }}>
              {trendInfo[predict?.trend || 'stable'].icon}
            </div>
            <span className="text-xs text-text-3 font-medium uppercase tracking-wider">Learning Trend</span>
          </div>
          {loadingAI ? <div className="skeleton" style={{ width: '65%', height: 24 }} /> : (
            <>
              <span className="text-xl font-bold" style={{ color: trendInfo[predict?.trend || 'stable'].color }}>
                {trendInfo[predict?.trend || 'stable'].label}
              </span>
              <div className="mt-2 flex items-center gap-2">
                <span className="badge badge-success" style={{ fontSize: 9 }}>LSTM</span>
                {predict?.confidence != null && <span className="text-xs text-text-3">{Math.round(predict.confidence * 100)}% conf</span>}
              </div>
            </>
          )}
        </div>

        {/* Quizzes */}
        <div className="glass-card-hover p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.15)' }}>🏆</div>
            <span className="text-xs text-text-3 font-medium uppercase tracking-wider">Quizzes Taken</span>
          </div>
          <span className="text-xl font-bold text-primary-light">{classify?.totalAttempts ?? 0}</span>
        </div>

        {/* Avg Score */}
        <div className="glass-card-hover p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="stat-icon" style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.15)' }}>⭐</div>
            <span className="text-xs text-text-3 font-medium uppercase tracking-wider">Avg Score</span>
          </div>
          <span className="text-xl font-bold" style={{ color: 'var(--accent)' }}>
            {classify?.features?.avgScore != null ? `${Math.round(classify.features.avgScore * 100)}%` : '--'}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-in animate-fade-in-delay-2">
        {/* Weak Areas */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-text-1 mb-4 flex items-center gap-2">
            🔍 Weak Areas <span className="badge badge-danger" style={{ fontSize: 9 }}>Autoencoder</span>
          </h3>
          {loadingAI ? <SkeletonCard /> : weakAreas.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <div className="empty-state-icon mx-auto">🔍</div>
              <p className="text-text-3 text-sm">Take quizzes across subjects to unlock weak area detection</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {weakAreas.slice(0, 5).map((area) => (
                <div key={area.subject} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--glass)' }}>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-text-2">{area.subject}</span>
                    {area.isWeak && <span className="text-xs ml-2" style={{ color: 'var(--danger)' }}>⚠️ Weak</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-3 font-mono">{area.score}%</span>
                    <div className="progress-bar" style={{ width: 64 }}>
                      <div className="progress-fill" style={{
                        width: `${area.score}%`,
                        background: area.score >= 70 ? 'var(--success)' : area.score >= 50 ? 'linear-gradient(90deg, var(--warning), var(--success))' : 'linear-gradient(90deg, var(--danger), var(--warning))',
                      }} />
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-xs text-text-3 mt-2 pt-2 border-t border-glass-border">Reconstruction error detects anomalous performance</p>
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-text-1 mb-4 flex items-center gap-2">
            🎯 Recommendations <span className="badge badge-primary" style={{ fontSize: 9 }}>NCF</span>
          </h3>
          {loadingAI ? <SkeletonCard /> : (
            <div className="space-y-2.5">
              {(recommend?.quizzes || []).slice(0, 3).map((rec) => (
                <a key={rec.quiz_id} href={`/student/dashboard/quiz/${rec.quiz_id}`}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all hover:translate-x-1" style={{ background: 'var(--glass)', border: '1px solid transparent' }}>
                  <div className="stat-icon" style={{ width: 36, height: 36, background: 'rgba(99,102,241,0.1)', fontSize: 16 }}>📝</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-1 truncate font-medium">{rec.title}</p>
                    <p className="text-xs text-text-3">{rec.subject} · {rec.predicted_score}%</p>
                  </div>
                </a>
              ))}
              {(recommend?.references || []).slice(0, 2).map((rec) => (
                <div key={rec.ref_id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--glass)' }}>
                  <div className="stat-icon" style={{ width: 36, height: 36, background: 'rgba(34,211,238,0.1)', fontSize: 16 }}>📚</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-1 truncate font-medium">{rec.title}</p>
                    <p className="text-xs text-text-3">{rec.reason}</p>
                  </div>
                </div>
              ))}
              {(!recommend?.quizzes?.length && !recommend?.references?.length) && (
                <div className="empty-state" style={{ padding: '32px 16px' }}>
                  <div className="empty-state-icon mx-auto">🎯</div>
                  <p className="text-text-3 text-sm">Complete more quizzes for personalized recommendations</p>
                </div>
              )}
              <p className="text-xs text-text-3 mt-2 pt-2 border-t border-glass-border">Neural Collaborative Filtering + Embeddings</p>
            </div>
          )}
        </div>

        {/* LSTM Predictions */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-text-1 mb-4 flex items-center gap-2">
            📈 Score Predictions <span className="badge badge-warning" style={{ fontSize: 9 }}>LSTM</span>
          </h3>
          {loadingAI ? <SkeletonCard /> : predict?.predictions && predict.predictions.length > 0 ? (
            <div className="space-y-4">
              {predict.history.length > 0 && (
                <div>
                  <p className="text-xs text-text-3 mb-2 uppercase tracking-wider">Past Scores</p>
                  <div className="flex items-end gap-1" style={{ height: 52 }}>
                    {predict.history.slice(-8).map((score, i) => (
                      <div key={i} className="flex-1 rounded-t transition-all" title={`${score}%`}
                        style={{
                          height: `${Math.max(12, score * 0.9)}%`,
                          background: `linear-gradient(180deg, var(--primary-light), var(--primary-dark))`,
                          opacity: 0.4 + (i / predict.history.slice(-8).length) * 0.6,
                          borderRadius: '4px 4px 0 0',
                        }} />
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-text-3 mb-2 uppercase tracking-wider">Predicted Next</p>
                <div className="flex gap-2">
                  {predict.predictions.map((score, i) => (
                    <div key={i} className="flex-1 text-center p-3 rounded-xl" style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)' }}>
                      <span className="text-lg font-bold font-mono" style={{
                        color: score >= 70 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)'
                      }}>{score}%</span>
                      <p className="text-xs text-text-3 mt-0.5">Quiz {i + 1}</p>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-text-3 pt-2 border-t border-glass-border">Autoregressive LSTM prediction</p>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <div className="flex items-center gap-3 p-3 rounded-xl mb-3" style={{ background: 'var(--glass)' }}>
                <div className="stat-icon" style={{ width: 36, height: 36, background: 'rgba(16,185,129,0.1)', fontSize: 16 }}>✓</div>
                <div>
                  <p className="text-sm text-text-1 font-medium">Account Created</p>
                  <p className="text-xs text-text-3">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Just now'}</p>
                </div>
              </div>
              <p className="text-text-3 text-sm">Take quizzes to unlock LSTM predictions</p>
            </div>
          )}
        </div>
      </div>

      {/* Learning Path */}
      <div className="mt-6 glass-card p-6 animate-fade-in animate-fade-in-delay-3">
        <h3 className="text-base font-semibold text-text-1 mb-5 flex items-center gap-2">
          🗺️ Your Learning Path <span className="badge badge-accent" style={{ fontSize: 9 }}>AI-Generated</span>
        </h3>
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
      <div className="mt-5 glass-card p-5 animate-fade-in animate-fade-in-delay-4">
        <h3 className="text-sm font-semibold text-text-1 mb-3 flex items-center gap-2">🧠 Active AI Models</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { name: 'ANN', desc: 'Classifier', icon: '🧠' },
            { name: 'Autoencoder', desc: 'Weak Areas', icon: '🔍' },
            { name: 'LSTM', desc: 'Predictions', icon: '📈' },
            { name: 'NCF', desc: 'Recommender', icon: '🎯' },
            { name: 'NLP', desc: 'Analyzer', icon: '💬' },
          ].map((m) => (
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
