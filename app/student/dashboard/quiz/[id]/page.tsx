'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Question {
  id: string;
  question_text: string;
  options: string[];
  question_order: number;
}

interface QuizData {
  id: string;
  title: string;
  description: string;
  subject: string;
  created_by_name: string;
  max_attempts: number;
}

export default function TakeQuiz() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [canAttempt, setCanAttempt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; percentage: number; graded_answers: Record<string, { selected: number; correct: number; is_correct: boolean }> } | null>(null);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    fetch(`/api/quiz/${quizId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load quiz');
        return res.json();
      })
      .then(data => {
        setQuiz(data.quiz);
        setQuestions(data.questions || []);
        setCanAttempt(data.can_attempt);
      })
      .catch(err => setFetchError(err.message))
      .finally(() => setLoading(false));
  }, [quizId]);

  // Timer — persists start time in sessionStorage
  useEffect(() => {
    if (!started || result) return;
    const storageKey = `quiz_start_${quizId}`;
    let startTime = parseInt(sessionStorage.getItem(storageKey) || '0');
    if (!startTime) {
      startTime = Date.now();
      sessionStorage.setItem(storageKey, startTime.toString());
    }
    const updateTimer = () => setTimer(Math.floor((Date.now() - startTime) / 1000));
    updateTimer();
    const t = setInterval(updateTimer, 1000);
    return () => clearInterval(t);
  }, [started, result, quizId]);

  // Warn before leaving during quiz
  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    if (started && !result) {
      e.preventDefault();
      e.returnValue = '';
    }
  }, [started, result]);

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [handleBeforeUnload]);

  const selectAnswer = (questionId: string, optIdx: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optIdx }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      if (!confirm('You have unanswered questions. Submit anyway?')) return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/quiz/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, time_taken_s: timer }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        // Clean up timer
        sessionStorage.removeItem(`quiz_start_${quizId}`);
      } else {
        alert(data.error);
      }
    } catch {
      alert('Failed to submit. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) return <div style={{ padding: 64, textAlign: 'center' }}><span className="spinner" /></div>;
  if (fetchError) return (
    <div style={{ padding: 64, textAlign: 'center' }}>
      <div className="glass-card" style={{ padding: 32, maxWidth: 400, margin: '0 auto' }}>
        <p style={{ color: 'var(--danger)', fontSize: 16, marginBottom: 12 }}>⚠️ {fetchError}</p>
        <button onClick={() => window.location.reload()} className="btn-primary text-sm">Retry</button>
      </div>
    </div>
  );
  if (!quiz) return <div style={{ padding: 64, textAlign: 'center', color: 'var(--text-3)' }}>Quiz not found</div>;

  // Result screen
  if (result) {
    const pct = result.percentage;
    const color = pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';

    return (
      <div className="p-8" style={{ maxWidth: 700, margin: '0 auto' }}>
        <div className="glass-card animate-fade-in" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</div>
          <h1 style={{ color: 'var(--text-1)', fontSize: 28, fontWeight: 700 }}>Quiz Complete!</h1>
          <div style={{ fontSize: 48, fontWeight: 800, color, margin: '16px 0' }}>{pct}%</div>
          <p style={{ color: 'var(--text-2)', fontSize: 16 }}>
            You scored <strong style={{ color: 'var(--text-1)' }}>{result.score}</strong> out of <strong style={{ color: 'var(--text-1)' }}>{result.total}</strong>
          </p>
          <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 8 }}>⏱️ Time: {formatTime(timer)}</p>
        </div>

        {/* Graded answers */}
        <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
          {questions.map((q, idx) => {
            const graded = result.graded_answers[q.id];
            const isCorrect = graded?.is_correct;
            return (
              <div key={q.id} className="glass-card" style={{ padding: 20, borderLeft: `3px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'}` }}>
                <p style={{ color: 'var(--text-1)', fontWeight: 500, fontSize: 14, marginBottom: 8 }}>
                  {idx + 1}. {q.question_text} {isCorrect ? '✅' : '❌'}
                </p>
                <div style={{ display: 'grid', gap: 4 }}>
                  {q.options.map((opt, oIdx) => {
                    const isSelected = graded?.selected === oIdx;
                    const isCorrectOpt = graded?.correct === oIdx;
                    let bg = 'transparent';
                    if (isCorrectOpt) bg = 'rgba(16,185,129,0.15)';
                    else if (isSelected && !isCorrect) bg = 'rgba(239,68,68,0.15)';

                    return (
                      <div key={oIdx} style={{ padding: '6px 12px', borderRadius: 8, background: bg, fontSize: 13, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isCorrectOpt ? '✅' : isSelected ? '❌' : '○'} {opt}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={() => router.push('/student/dashboard/quiz')} className="btn-primary" style={{ width: '100%', marginTop: 24 }}>
          ← Back to Quizzes
        </button>
      </div>
    );
  }

  // Start screen
  if (!started) {
    return (
      <div className="p-8" style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="glass-card animate-fade-in" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
          <h1 style={{ color: 'var(--text-1)', fontSize: 24, fontWeight: 700 }}>{quiz.title}</h1>
          <span className="badge badge-primary" style={{ marginTop: 8 }}>{quiz.subject}</span>
          {quiz.description && <p style={{ color: 'var(--text-3)', fontSize: 14, marginTop: 12 }}>{quiz.description}</p>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24, padding: '16px 0', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
            <div><p style={{ color: 'var(--text-3)', fontSize: 12 }}>Questions</p><p style={{ color: 'var(--text-1)', fontWeight: 600, fontSize: 20 }}>{questions.length}</p></div>
            <div><p style={{ color: 'var(--text-3)', fontSize: 12 }}>Created By</p><p style={{ color: 'var(--text-1)', fontWeight: 600, fontSize: 14 }}>{quiz.created_by_name}</p></div>
          </div>

          {canAttempt ? (
            <button onClick={() => setStarted(true)} className="btn-primary" style={{ width: '100%', marginTop: 24, fontSize: 16, padding: '14px 24px' }}>
              Start Quiz 🚀
            </button>
          ) : (
            <div style={{ marginTop: 24, padding: 16, borderRadius: 12, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p style={{ color: 'var(--warning)', fontSize: 14 }}>⚠️ Maximum attempts reached for this quiz</p>
            </div>
          )}

          <button onClick={() => router.push('/student/dashboard/quiz')} style={{ marginTop: 16, color: 'var(--text-3)', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>
            ← Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  // Quiz taking screen
  const q = questions[currentQ];

  return (
    <div className="p-8" style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: 'var(--text-1)', fontWeight: 600 }}>{quiz.title}</h2>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 14 }}>⏱️ {formatTime(timer)}</span>
          <span style={{ color: 'var(--text-3)', fontSize: 13 }}>{currentQ + 1}/{questions.length}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', height: 4, background: 'var(--bg-secondary)', borderRadius: 2, marginBottom: 24 }}>
        <div style={{ width: `${((currentQ + 1) / questions.length) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--accent))', borderRadius: 2, transition: 'width 0.3s ease' }} />
      </div>

      {/* Question */}
      <div className="glass-card animate-fade-in" style={{ padding: 32 }} key={currentQ}>
        <p style={{ color: 'var(--text-1)', fontSize: 18, fontWeight: 600, marginBottom: 24, lineHeight: 1.6 }}>
          {currentQ + 1}. {q.question_text}
        </p>

        <div style={{ display: 'grid', gap: 10 }}>
          {q.options.map((opt, oIdx) => {
            const selected = answers[q.id] === oIdx;
            return (
              <button key={oIdx} onClick={() => selectAnswer(q.id, oIdx)}
                style={{
                  padding: '14px 16px', borderRadius: 12, textAlign: 'left', cursor: 'pointer', fontSize: 15,
                  background: selected ? 'rgba(99,102,241,0.15)' : 'var(--bg-secondary)',
                  border: `1px solid ${selected ? 'var(--primary)' : 'var(--glass-border)'}`,
                  color: selected ? 'var(--primary-light)' : 'var(--text-2)',
                  transition: 'all 0.2s ease',
                }}>
                <span style={{ fontWeight: 600, marginRight: 8 }}>
                  {String.fromCharCode(65 + oIdx)}.
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <button onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))} className="btn-ghost" disabled={currentQ === 0}>
          ← Previous
        </button>
        {currentQ === questions.length - 1 ? (
          <button onClick={handleSubmit} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }} disabled={submitting}>
            {submitting ? <span className="spinner" style={{ width: 18, height: 18 }} /> : null}
            Submit Quiz ✓
          </button>
        ) : (
          <button onClick={() => setCurrentQ(prev => Math.min(questions.length - 1, prev + 1))} className="btn-primary">
            Next →
          </button>
        )}
      </div>

      {/* Question dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 24, flexWrap: 'wrap' }}>
        {questions.map((qq, idx) => (
          <button key={idx} onClick={() => setCurrentQ(idx)}
            style={{
              width: 32, height: 32, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${idx === currentQ ? 'var(--primary)' : answers[qq.id] !== undefined ? 'var(--success)' : 'var(--glass-border)'}`,
              background: idx === currentQ ? 'rgba(99,102,241,0.2)' : answers[qq.id] !== undefined ? 'rgba(16,185,129,0.1)' : 'transparent',
              color: idx === currentQ ? 'var(--primary-light)' : answers[qq.id] !== undefined ? 'var(--success)' : 'var(--text-3)',
            }}>
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
