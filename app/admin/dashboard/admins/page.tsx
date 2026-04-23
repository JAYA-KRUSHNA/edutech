'use client';

import { useEffect, useState } from 'react';

interface Admin { id: string; email: string; full_name: string; is_super: boolean; created_at: string; }

export default function ManageAdmins() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchAdmins = () => { setLoading(true); fetch('/api/admin/admins').then(res => res.json()).then(data => setAdmins(data.admins || [])).finally(() => setLoading(false)); };
  useEffect(() => { fetchAdmins(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError(''); setFormSuccess(''); setSubmitting(true);
    try {
      const res = await fetch('/api/admin/admins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error); return; }
      setFormSuccess('Admin created!'); setForm({ email: '', password: '', full_name: '' }); fetchAdmins();
      setTimeout(() => { setShowForm(false); setFormSuccess(''); }, 1500);
    } catch { setFormError('Failed to create admin'); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete admin "${name}"?`)) return;
    setDeleting(id);
    try { const res = await fetch(`/api/admin/admins/${id}`, { method: 'DELETE' }); const data = await res.json(); if (res.ok) fetchAdmins(); else alert(data.error || 'Failed'); } finally { setDeleting(null); }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      <div className="page-header animate-fade-in flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-1">🛡️ Manage Admins</h1>
          <p className="text-text-3 text-sm mt-1">Super Admin Only — Add or remove administrators</p>
        </div>
        <button className="btn-primary text-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add Admin'}
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-6 mb-6 animate-scale-in">
          <h3 className="text-base font-semibold text-text-1 mb-4">Add New Admin</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label-text">Full Name</label>
              <input type="text" className="input-field" placeholder="Admin name" value={form.full_name} onChange={(e) => setForm(prev => ({ ...prev, full_name: e.target.value }))} required />
            </div>
            <div>
              <label className="label-text">Email</label>
              <input type="email" className="input-field" placeholder="admin@example.com" value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} required />
            </div>
            <div>
              <label className="label-text">Password</label>
              <input type="password" className="input-field" placeholder="Min 6 characters" value={form.password} onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))} required />
            </div>
            <div className="md:col-span-3 flex items-center gap-4">
              <button type="submit" className="btn-primary text-sm flex items-center gap-2" disabled={submitting}>
                {submitting ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : null}
                {submitting ? 'Creating...' : 'Create Admin'}
              </button>
              {formError && <span className="error-text">⚠️ {formError}</span>}
              {formSuccess && <span className="success-text">✅ {formSuccess}</span>}
            </div>
          </form>
        </div>
      )}

      <div className="glass-card overflow-hidden animate-fade-in animate-fade-in-delay-1">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 44 }} />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Admin</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar avatar-sm" style={{
                          background: admin.is_super ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.15)',
                          color: admin.is_super ? 'var(--warning)' : 'var(--primary-light)',
                        }}>
                          {admin.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>{admin.full_name}</span>
                      </div>
                    </td>
                    <td className="text-xs">{admin.email}</td>
                    <td>
                      <span className={`badge ${admin.is_super ? 'badge-warning' : 'badge-primary'}`} style={{ fontSize: 10 }}>
                        {admin.is_super ? '⚡ Super Admin' : '🛡️ Admin'}
                      </span>
                    </td>
                    <td className="text-xs font-mono">{new Date(admin.created_at).toLocaleDateString()}</td>
                    <td>
                      {admin.is_super ? (
                        <span className="text-xs text-text-3">Protected</span>
                      ) : (
                        <button onClick={() => handleDelete(admin.id, admin.full_name)}
                          className="text-xs px-2.5 py-1 rounded-lg transition-all"
                          style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.1)' }}
                          disabled={deleting === admin.id}>
                          {deleting === admin.id ? '...' : '🗑️ Delete'}
                        </button>
                      )}
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
