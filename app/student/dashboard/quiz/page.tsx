'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Quiz { id: string; title: string; description: string; subject: string; created_by_name: string; created_by_role: string; max_attempts: number; question_count: number; attempt_count: number; created_at: string; }

export default function StudentQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/quiz').then(res => res.json()).then(data => setQuizzes(data.quizzes || [])).finally(() => setLoading(false));
  }, []);

  const filtered = quizzes.filter(q => q.title.toLowerCase().includes(search.toLowerCase()) || q.subject.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      <div className="page-header animate-fade-in flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-1">📝 Quizzes</h1>
          <p className="text-text-3 text-sm mt-1">Test your knowledge and track your progress</p>
        </div>
        <Link href="/student/dashboard/quiz/create" className="btn-primary text-sm">+ Create Quiz</Link>
      </div>

      <div className="mb-6 animate-fade-in animate-fade-in-delay-1">
        <input type="text" className="input-field" style={{ maxWidth: 400 }}
          placeholder="🔍 Search by title or subject..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="glass-card p-6 space-y-3"><div className="skeleton" style={{ height: 20, width: '70%' }} /><div className="skeleton" style={{ height: 14, width: '40%' }} /><div className="skeleton" style={{ height: 36, width: '100%' }} /></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card empty-state">
          <div className="empty-state-icon mx-auto">📭</div>
          <p className="text-text-2 text-lg font-medium mb-1">{search ? 'No matches' : 'No quizzes yet'}</p>
          <p className="text-text-3 text-sm">Be the first to create one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in animate-fade-in-delay-2">
          {filtered.map((quiz) => {
            const attemptsLeft = quiz.max_attempts - quiz.attempt_count;
            const exhausted = attemptsLeft <= 0;
            return (
              <div key={quiz.id} className="glass-card-hover p-5 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-text-1 text-base font-semibold">{quiz.title}</h3>
                    <span className="badge badge-primary mt-1.5" style={{ fontSize: 10 }}>{quiz.subject}</span>
                  </div>
                  <span className="tech-chip" style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-3)' }}>
                    {quiz.question_count} Q{quiz.question_count !== 1 ? 's' : ''}
                  </span>
                </div>
                {quiz.description && (
                  <p className="text-text-3 text-sm leading-relaxed">{quiz.description.length > 100 ? quiz.description.slice(0, 100) + '...' : quiz.description}</p>
                )}
                <div className="flex justify-between items-center text-xs text-text-3 pt-2 border-t border-glass-border">
                  <span>By {quiz.created_by_name} · {quiz.created_by_role === 'student' ? '🎓' : '🛡️'}</span>
                  <span className="font-mono">{quiz.attempt_count}/{quiz.max_attempts}</span>
                </div>
                <Link href={exhausted ? '#' : `/student/dashboard/quiz/${quiz.id}`}
                  className={exhausted ? 'btn-ghost' : 'btn-primary'}
                  style={{ fontSize: 13, textAlign: 'center', marginTop: 'auto', pointerEvents: exhausted ? 'none' : 'auto', opacity: exhausted ? 0.5 : 1 }}>
                  {exhausted ? 'No attempts left' : quiz.attempt_count > 0 ? 'Retry Quiz →' : 'Start Quiz →'}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
