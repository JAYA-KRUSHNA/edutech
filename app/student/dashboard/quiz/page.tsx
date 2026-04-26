'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Quiz { id: string; title: string; description: string; subject: string; created_by_name: string; created_by_role: string; max_attempts: number; question_count: number; attempt_count: number; created_at: string; }

export default function StudentQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');

  useEffect(() => {
    fetch('/api/quiz').then(res => res.json()).then(data => setQuizzes(data.quizzes || [])).finally(() => setLoading(false));
  }, []);

  const subjects = ['All', ...Array.from(new Set(quizzes.map(q => q.subject)))];

  const filtered = quizzes
    .filter(q => (selectedSubject === 'All' || q.subject === selectedSubject) && (q.title.toLowerCase().includes(search.toLowerCase()) || q.subject.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => sortBy === 'popular' ? b.attempt_count - a.attempt_count : new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const completed = quizzes.filter(q => q.attempt_count > 0).length;
  const remaining = quizzes.filter(q => q.attempt_count < q.max_attempts).length;

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      <div className="page-header animate-fade-in flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-1">📝 Quizzes</h1>
          <p className="text-text-3 text-sm mt-1">Test your knowledge and track your progress</p>
        </div>
        <Link href="/student/dashboard/quiz/create" className="btn-primary text-sm">+ Create Quiz</Link>
      </div>

      {/* Stats Bar */}
      {!loading && quizzes.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6 animate-fade-in-delay-1" style={{ opacity: 0 }}>
          {[
            { label: 'Total', value: quizzes.length, icon: '📋', color: 'var(--primary-light)' },
            { label: 'Completed', value: completed, icon: '✅', color: 'var(--success)' },
            { label: 'Available', value: remaining, icon: '🎯', color: 'var(--accent)' },
          ].map(s => (
            <div key={s.label} className="glass-card p-3 text-center">
              <span className="text-lg">{s.icon}</span>
              <p className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-text-3">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="mb-5 animate-fade-in-delay-1" style={{ opacity: 0 }}>
        <div className="flex gap-2 flex-wrap mb-3">
          {subjects.map(s => (
            <button key={s} className={`filter-chip ${selectedSubject === s ? 'active' : ''}`} onClick={() => setSelectedSubject(s)}>
              {s === 'All' ? '🌐 All' : s}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <input type="text" className="input-field flex-1" style={{ maxWidth: 400 }} placeholder="🔍 Search by title or subject..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="input-field" style={{ width: 140 }} value={sortBy} onChange={e => setSortBy(e.target.value as 'newest' | 'popular')}>
            <option value="newest">Newest</option>
            <option value="popular">Popular</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="glass-card p-6 space-y-3"><div className="skeleton" style={{ height: 20, width: '70%' }} /><div className="skeleton" style={{ height: 14, width: '40%' }} /><div className="skeleton" style={{ height: 36, width: '100%' }} /></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card empty-state">
          <div className="empty-state-icon mx-auto">📭</div>
          <p className="text-text-2 text-lg font-medium mb-1">{search || selectedSubject !== 'All' ? 'No matches' : 'No quizzes yet'}</p>
          <p className="text-text-3 text-sm">Be the first to create one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-delay-2" style={{ opacity: 0 }}>
          {filtered.map(quiz => {
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
                {quiz.description && <p className="text-text-3 text-sm leading-relaxed">{quiz.description.length > 100 ? quiz.description.slice(0, 100) + '...' : quiz.description}</p>}
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
