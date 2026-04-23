'use client';

import { useEffect, useState } from 'react';

interface Student { id: string; reg_no: string; email: string; full_name: string; is_verified: boolean; created_at: string; }

export default function ManageStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchStudents = () => { setLoading(true); fetch('/api/admin/students').then(res => res.json()).then(data => setStudents(data.students || [])).finally(() => setLoading(false)); };
  useEffect(() => { fetchStudents(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    setDeleting(id);
    try { const res = await fetch(`/api/admin/students/${id}`, { method: 'DELETE' }); if (res.ok) fetchStudents(); else alert('Failed to delete student'); } finally { setDeleting(null); }
  };

  const filtered = students.filter(s => s.full_name.toLowerCase().includes(search.toLowerCase()) || s.reg_no.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      <div className="page-header animate-fade-in">
        <h1 className="text-2xl font-bold text-text-1">🎓 Manage Students</h1>
        <p className="text-text-3 text-sm mt-1">{students.length} total students</p>
      </div>

      <div className="mb-6 animate-fade-in animate-fade-in-delay-1">
        <input type="text" className="input-field" style={{ maxWidth: 420 }} placeholder="🔍 Search by name, reg no, or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="glass-card overflow-hidden animate-fade-in animate-fade-in-delay-2">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 44 }} />)}</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon mx-auto">🎓</div>
            <p className="text-text-3">{search ? 'No students match your search' : 'No students registered yet'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Student</th><th>Reg No</th><th>Email</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar avatar-sm" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary-light)' }}>
                          {student.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>{student.full_name}</span>
                      </div>
                    </td>
                    <td><code className="tech-chip" style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-2)' }}>{student.reg_no}</code></td>
                    <td className="text-xs">{student.email}</td>
                    <td>
                      <span className={`badge ${student.is_verified ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 10 }}>
                        {student.is_verified ? '✓ Verified' : '⏳ Pending'}
                      </span>
                    </td>
                    <td className="text-xs font-mono">{new Date(student.created_at).toLocaleDateString()}</td>
                    <td>
                      <button onClick={() => handleDelete(student.id, student.full_name)}
                        className="text-xs px-2.5 py-1 rounded-lg transition-all"
                        style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.1)' }}
                        disabled={deleting === student.id}>
                        {deleting === student.id ? '...' : '🗑️ Delete'}
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
