'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Quiz { id: string; title: string; description: string; subject: string; created_by_name: string; created_by_role: string; max_attempts: number; question_count: number; attempt_count: number; created_at: string; }

export default function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchQuizzes = () => { setLoading(true); fetch('/api/quiz').then(res => res.json()).then(data => setQuizzes(data.quizzes || [])).finally(() => setLoading(false)); };
  useEffect(() => { fetchQuizzes(); }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete quiz "${title}"?`)) return;
    setDeleting(id);
    try { const res = await fetch(`/api/quiz/${id}`, { method: 'DELETE' }); if (res.ok) fetchQuizzes(); else { const d = await res.json(); alert(d.error); } } finally { setDeleting(null); }
  };

  const filtered = quizzes.filter(q => q.title.toLowerCase().includes(search.toLowerCase()) || q.subject.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      <div className="page-header animate-fade-in flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-1">📝 Manage Quizzes</h1>
          <p className="text-text-3 text-sm mt-1">{quizzes.length} total quizzes</p>
        </div>
        <Link href="/admin/dashboard/quiz/create" className="btn-primary text-sm">+ Create Quiz</Link>
      </div>

      <div className="mb-6"><input type="text" className="input-field" style={{ maxWidth: 400 }} placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>

      <div className="glass-card overflow-hidden animate-fade-in animate-fade-in-delay-1">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 40 }} />)}</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon mx-auto">📭</div><p className="text-text-3">No quizzes found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Quiz</th><th>Subject</th><th>Questions</th><th>Created By</th><th>Attempts</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(q => (
                  <tr key={q.id}>
                    <td style={{ color: 'var(--text-1)', fontWeight: 500 }}>{q.title}</td>
                    <td><span className="badge badge-primary" style={{ fontSize: 10 }}>{q.subject}</span></td>
                    <td className="font-mono">{q.question_count}</td>
                    <td className="text-xs">{q.created_by_name} <span className="text-text-3">({q.created_by_role})</span></td>
                    <td className="font-mono">Max {q.max_attempts}</td>
                    <td className="text-xs font-mono">{new Date(q.created_at).toLocaleDateString()}</td>
                    <td>
                      <button onClick={() => handleDelete(q.id, q.title)} className="text-xs px-2.5 py-1 rounded-lg transition-all" style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.1)' }} disabled={deleting === q.id}>
                        {deleting === q.id ? '...' : '🗑️ Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
