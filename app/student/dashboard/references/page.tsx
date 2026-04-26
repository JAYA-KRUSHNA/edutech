'use client';

import { useEffect, useState } from 'react';

interface Reference { id: string; title: string; description: string; url: string; subject: string; posted_by_id: string; posted_by_name: string; posted_by_role: string; created_at: string; }

const ITEMS_PER_PAGE = 12;

export default function StudentReferences() {
  const [refs, setRefs] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('latest');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', url: '', subject: '' });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState('');

  const fetchRefs = (s?: string, so?: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (s || search) params.set('search', s || search);
    params.set('sort', so || sort);
    fetch(`/api/references?${params}`).then(res => res.json()).then(data => { setRefs(data.references || []); setCurrentUserId(data.current_user_id || ''); }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchRefs(); }, []); // eslint-disable-line

  const handleSearch = (v: string) => { setSearch(v); setPage(1); fetchRefs(v, sort); };
  const handleSort = (v: string) => { setSort(v); fetchRefs(search, v); };

  const subjects = ['All', ...Array.from(new Set(refs.map(r => r.subject)))];
  const filtered = refs.filter(r => selectedSubject === 'All' || r.subject === selectedSubject);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const subjectIcons: Record<string, string> = { 'Deep Learning': '🧠', 'Machine Learning': '🤖', 'Mathematics': '📐', 'Python': '🐍', 'Programming': '💻', 'Computer Vision': '👁️', 'NLP': '💬', 'Data Science': '📊' };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError(''); setFormSuccess('');
    if (!form.title || !form.url || !form.subject) { setFormError('Title, URL, and subject are required'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/references', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error); return; }
      setFormSuccess('Reference added!'); setForm({ title: '', description: '', url: '', subject: '' }); fetchRefs();
      setTimeout(() => { setShowForm(false); setFormSuccess(''); }, 1200);
    } catch { setFormError('Failed to add reference'); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this reference?')) return;
    setDeleting(id);
    try { const res = await fetch(`/api/references/${id}`, { method: 'DELETE' }); if (res.ok) fetchRefs(); else { const d = await res.json(); alert(d.error); } } finally { setDeleting(null); }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      <div className="page-header animate-fade-in flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-1">📚 References</h1>
          <p className="text-text-3 text-sm mt-1">Share and discover study resources ({refs.length} total)</p>
        </div>
        <button className="btn-primary text-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add Reference'}
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-6 mb-6 animate-scale-in">
          <h3 className="text-base font-semibold text-text-1 mb-4">Add New Reference</h3>
          <form onSubmit={handleAdd}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className="label-text">Title *</label><input className="input-field" placeholder="e.g. CNN Tutorial" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div><label className="label-text">Subject *</label><input className="input-field" placeholder="e.g. Deep Learning" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} /></div>
            </div>
            <div className="mt-3"><label className="label-text">URL *</label><input className="input-field" type="url" placeholder="https://..." value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} /></div>
            <div className="mt-3"><label className="label-text">Description (optional)</label><textarea className="input-field" style={{ minHeight: 60, resize: 'vertical' }} placeholder="Brief description..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div className="flex items-center gap-3 mt-4">
              <button type="submit" className="btn-primary text-sm" disabled={submitting}>{submitting ? 'Adding...' : 'Add Reference'}</button>
              {formError && <span className="error-text">⚠️ {formError}</span>}
              {formSuccess && <span className="success-text">✅ {formSuccess}</span>}
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="mb-5 animate-fade-in-delay-1" style={{ opacity: 0 }}>
        <div className="flex gap-2 flex-wrap mb-3">
          {subjects.map(s => (
            <button key={s} className={`filter-chip ${selectedSubject === s ? 'active' : ''}`} onClick={() => { setSelectedSubject(s); setPage(1); }}>
              {s === 'All' ? '🌐 All' : `${subjectIcons[s] || '📖'} ${s}`}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <input type="text" className="input-field flex-1" style={{ maxWidth: 400 }} placeholder="🔍 Search..." value={search} onChange={e => handleSearch(e.target.value)} />
          <select className="input-field" style={{ width: 150 }} value={sort} onChange={e => handleSort(e.target.value)}>
            <option value="latest">Latest First</option><option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="glass-card p-5"><div className="skeleton" style={{ height: 18, width: '50%' }} /><div className="skeleton mt-2" style={{ height: 12, width: '80%' }} /></div>)}</div>
      ) : paginated.length === 0 ? (
        <div className="glass-card empty-state"><div className="empty-state-icon mx-auto">📭</div><p className="text-text-2 text-lg font-medium mb-1">No references found</p><p className="text-text-3 text-sm">Be the first to share a resource!</p></div>
      ) : (
        <>
          <div className="space-y-3 animate-fade-in-delay-2" style={{ opacity: 0 }}>
            {paginated.map(ref => (
              <div key={ref.id} className="glass-card-hover p-5 flex justify-between items-start gap-4">
                <div className="flex gap-3 flex-1 min-w-0">
                  <div className="stat-icon flex-shrink-0" style={{ width: 40, height: 40, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.12)', fontSize: 18 }}>
                    {subjectIcons[ref.subject] || '📖'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-primary-light font-semibold text-sm hover:text-accent transition-colors">🔗 {ref.title}</a>
                      <span className="badge badge-primary" style={{ fontSize: 10 }}>{ref.subject}</span>
                    </div>
                    {ref.description && <p className="text-text-3 text-sm mt-2 leading-relaxed">{ref.description}</p>}
                    <p className="text-text-3 text-xs mt-2">By {ref.posted_by_name} ({ref.posted_by_role === 'student' ? '🎓' : '🛡️'}) · {new Date(ref.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {currentUserId === ref.posted_by_id && (
                  <button onClick={() => handleDelete(ref.id)} className="text-xs flex-shrink-0 px-3 py-1.5 rounded-lg transition-all" style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.1)' }} disabled={deleting === ref.id}>
                    {deleting === ref.id ? '...' : '🗑️'}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} className="btn-ghost text-xs" disabled={page === 1}>← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={page === i + 1 ? 'btn-primary' : 'btn-ghost'} style={{ padding: '6px 12px', fontSize: 12, minWidth: 36 }}>{i + 1}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="btn-ghost text-xs" disabled={page === totalPages}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
