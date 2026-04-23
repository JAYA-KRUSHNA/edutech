'use client';

import { useEffect, useState } from 'react';

interface Reference { id: string; title: string; description: string; url: string; subject: string; posted_by_id: string; posted_by_name: string; posted_by_role: string; created_at: string; }

export default function AdminReferences() {
  const [refs, setRefs] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('latest');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', url: '', subject: '' });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchRefs = (s?: string, so?: string) => {
    setLoading(true); const params = new URLSearchParams();
    if (s || search) params.set('search', s || search); params.set('sort', so || sort);
    fetch(`/api/references?${params}`).then(res => res.json()).then(data => setRefs(data.references || [])).finally(() => setLoading(false));
  };
  useEffect(() => { fetchRefs(); }, []); // eslint-disable-line

  const handleSearch = (v: string) => { setSearch(v); fetchRefs(v, sort); };
  const handleSort = (v: string) => { setSort(v); fetchRefs(search, v); };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError(''); setFormSuccess('');
    if (!form.title || !form.url || !form.subject) { setFormError('Title, URL, and subject are required'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/references', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error); return; }
      setFormSuccess('Added!'); setForm({ title: '', description: '', url: '', subject: '' }); fetchRefs();
      setTimeout(() => { setShowForm(false); setFormSuccess(''); }, 1200);
    } catch { setFormError('Failed'); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this reference?')) return;
    setDeleting(id);
    try { const res = await fetch(`/api/references/${id}`, { method: 'DELETE' }); if (res.ok) fetchRefs(); else { const d = await res.json(); alert(d.error); } } finally { setDeleting(null); }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      <div className="page-header animate-fade-in flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-1">📚 Manage References</h1>
          <p className="text-text-3 text-sm mt-1">{refs.length} total references</p>
        </div>
        <button className="btn-primary text-sm" onClick={() => setShowForm(!showForm)}>{showForm ? '✕ Cancel' : '+ Add Reference'}</button>
      </div>

      {showForm && (
        <div className="glass-card p-6 mb-6 animate-scale-in">
          <form onSubmit={handleAdd}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className="label-text">Title *</label><input className="input-field" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div><label className="label-text">Subject *</label><input className="input-field" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} /></div>
            </div>
            <div className="mt-3"><label className="label-text">URL *</label><input className="input-field" type="url" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} /></div>
            <div className="mt-3"><label className="label-text">Description</label><textarea className="input-field" style={{ minHeight: 60, resize: 'vertical' }} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div className="flex items-center gap-3 mt-4">
              <button type="submit" className="btn-primary text-sm" disabled={submitting}>{submitting ? 'Adding...' : 'Add Reference'}</button>
              {formError && <span className="error-text">⚠️ {formError}</span>}
              {formSuccess && <span className="success-text">✅ {formSuccess}</span>}
            </div>
          </form>
        </div>
      )}

      <div className="flex gap-3 mb-6">
        <input type="text" className="input-field flex-1" style={{ maxWidth: 400 }} placeholder="🔍 Search..." value={search} onChange={e => handleSearch(e.target.value)} />
        <select className="input-field" style={{ width: 150 }} value={sort} onChange={e => handleSort(e.target.value)}>
          <option value="latest">Latest First</option><option value="oldest">Oldest First</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden animate-fade-in animate-fade-in-delay-1">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 40 }} />)}</div>
        ) : refs.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon mx-auto">📭</div><p className="text-text-3">No references found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Title</th><th>Subject</th><th>URL</th><th>Posted By</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {refs.map(ref => (
                  <tr key={ref.id}>
                    <td style={{ color: 'var(--text-1)', fontWeight: 500 }}>{ref.title}</td>
                    <td><span className="badge badge-primary" style={{ fontSize: 10 }}>{ref.subject}</span></td>
                    <td><a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: 'var(--accent)' }}>🔗 Open</a></td>
                    <td className="text-xs">{ref.posted_by_name}</td>
                    <td className="text-xs font-mono">{new Date(ref.created_at).toLocaleDateString()}</td>
                    <td>
                      <button onClick={() => handleDelete(ref.id)} className="text-xs px-2.5 py-1 rounded-lg transition-all" style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.1)' }} disabled={deleting === ref.id}>
                        {deleting === ref.id ? '...' : '🗑️ Delete'}
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
