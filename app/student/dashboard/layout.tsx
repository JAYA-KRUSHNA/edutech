'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface User { id: string; reg_no: string; email: string; full_name: string; created_at: string; }

export default function StudentDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [authError, setAuthError] = useState<'network' | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    fetch('/api/student/me')
      .then(res => { if (!res.ok) { router.push('/student/login'); return null; } return res.json(); })
      .then(data => { if (data?.user) setUser(data.user); else if (data !== null) router.push('/student/login'); })
      .catch(() => setAuthError('network'));
  }, [router]);

  // Close mobile menu on navigation
  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

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

  if (authError === 'network') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-card" style={{ padding: 32, textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📡</div>
          <h2 style={{ color: 'var(--text-1)', fontWeight: 700, marginBottom: 8 }}>Connection Error</h2>
          <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 20 }}>Unable to reach the server. Check your internet connection.</p>
          <button onClick={() => window.location.reload()} className="btn-primary text-sm">🔄 Retry</button>
        </div>
      </div>
    );
  }

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

  // Mobile layout
  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Mobile Header */}
        <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(6,8,15,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--glass-border)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🎓</div>
            <span className="gradient-text" style={{ fontWeight: 700, fontSize: 14 }}>EduTech</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: 'none', border: 'none', color: 'var(--text-2)', fontSize: 20, cursor: 'pointer', padding: 4 }}>
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </header>

        {/* Mobile Slide Menu */}
        {mobileMenuOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 45, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setMobileMenuOpen(false)}>
            <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 0, right: 0, width: '75%', maxWidth: 300, height: '100%', background: 'var(--bg-secondary)', borderLeft: '1px solid var(--glass-border)', padding: 20, display: 'flex', flexDirection: 'column', animation: 'slideInLeft 0.3s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--glass-border)' }}>
                <div className="avatar avatar-md" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary-light)' }}>{user.full_name.charAt(0).toUpperCase()}</div>
                <div><p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>{user.full_name}</p><p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>{user.reg_no}</p></div>
              </div>
              {navItems.map(item => (
                <Link key={item.label} href={item.href} className={`sidebar-link ${pathname === item.href ? 'active' : ''}`} style={{ marginBottom: 4 }}>
                  <div className="sidebar-icon">{item.icon}</div><span>{item.label}</span>
                </Link>
              ))}
              <div style={{ marginTop: 'auto' }}>
                <button onClick={handleLogout} disabled={loggingOut} style={{ width: '100%', padding: '10px 14px', textAlign: 'left', fontSize: 13, color: 'var(--text-3)', cursor: 'pointer', background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 10 }}>
                  {loggingOut ? 'Logging out...' : '🚪 Sign Out'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <main style={{ flex: 1, background: 'var(--bg)', paddingBottom: 72 }}>{children}</main>

        {/* Bottom Nav */}
        <nav className="mobile-bottom-nav">
          {navItems.map(item => (
            <Link key={item.label} href={item.href} className={`mobile-nav-item ${pathname === item.href ? 'active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label.length > 8 ? item.label.slice(0, 7) + '…' : item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    );
  }

  // Desktop layout
  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <aside style={{ width: sidebarOpen ? 260 : 72, transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)', borderRight: '1px solid var(--glass-border)', background: 'rgba(6,8,15,0.7)', backdropFilter: 'blur(24px)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '16px 16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: 12, minHeight: 60 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, boxShadow: '0 4px 12px rgba(99,102,241,0.25)' }}>🎓</div>
          {sidebarOpen && <span className="gradient-text" style={{ fontWeight: 700, fontSize: 15 }}>EduTech</span>}
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-3)', cursor: 'pointer', background: 'none', border: 'none', fontSize: 13, borderBottom: '1px solid var(--glass-border)' }}>
          {sidebarOpen ? '◀ Collapse' : '▶'}
        </button>
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.label} href={item.href} className={`sidebar-link ${isActive ? 'active' : ''}`}>
                <div className="sidebar-icon">{item.icon}</div>
                {sidebarOpen ? <span>{item.label}</span> : <span className="sidebar-tooltip">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: 14, borderTop: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="avatar avatar-md" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary-light)' }}>{user.full_name.charAt(0).toUpperCase()}</div>
            {sidebarOpen && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{user.full_name}</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0, fontFamily: 'var(--font-mono)' }}>{user.reg_no}</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button onClick={handleLogout} disabled={loggingOut} style={{ marginTop: 10, width: '100%', padding: '8px 12px', textAlign: 'left', fontSize: 12, color: 'var(--text-3)', cursor: 'pointer', background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 10, transition: 'all 0.2s ease' }}>
              {loggingOut ? 'Logging out...' : '🚪 Sign Out'}
            </button>
          )}
        </div>
      </aside>
      <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>{children}</main>
    </div>
  );
}
