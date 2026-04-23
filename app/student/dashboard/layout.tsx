'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  reg_no: string;
  email: string;
  full_name: string;
  created_at: string;
}

export default function StudentDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch('/api/student/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
        else router.push('/student/login');
      })
      .catch(() => router.push('/student/login'));
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch('/api/student/logout', { method: 'POST' });
    router.push('/student/login');
  };

  const navItems = [
    { href: '/student/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/student/dashboard/quiz', icon: '📝', label: 'Quizzes' },
    { href: '/student/dashboard/references', icon: '📚', label: 'References' },
    { href: '/student/dashboard/nlp-analyzer', icon: '💬', label: 'NLP Analyzer' },
  ];

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="spinner" style={{ width: 36, height: 36 }} />
          <span className="text-sm text-text-3">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 260 : 72,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRight: '1px solid var(--glass-border)',
        background: 'rgba(6,8,15,0.7)',
        backdropFilter: 'blur(24px)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '16px 16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: 12, minHeight: 60 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, flexShrink: 0,
            boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
          }}>🎓</div>
          {sidebarOpen && <span className="gradient-text" style={{ fontWeight: 700, fontSize: 15 }}>EduTech</span>}
        </div>

        {/* Toggle */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-3)', cursor: 'pointer', background: 'none', border: 'none', fontSize: 13, borderBottom: '1px solid var(--glass-border)' }}>
          {sidebarOpen ? '◀ Collapse' : '▶'}
        </button>

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.label} href={item.href} className={`sidebar-link ${isActive ? 'active' : ''}`}>
                <div className="sidebar-icon">{item.icon}</div>
                {sidebarOpen ? (
                  <span>{item.label}</span>
                ) : (
                  <span className="sidebar-tooltip">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding: 14, borderTop: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="avatar avatar-md" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary-light)' }}>
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{user.full_name}</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0, fontFamily: 'var(--font-mono)' }}>{user.reg_no}</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button onClick={handleLogout} disabled={loggingOut}
              style={{ marginTop: 10, width: '100%', padding: '8px 12px', textAlign: 'left', fontSize: 12, color: 'var(--text-3)', cursor: 'pointer', background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 10, transition: 'all 0.2s ease' }}>
              {loggingOut ? 'Logging out...' : '🚪 Sign Out'}
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
        {children}
      </main>
    </div>
  );
}
