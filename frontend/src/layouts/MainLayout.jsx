import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useNavigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CalendarDays, FileText, Users, Search,
  BarChart3, Bell, UserCircle, LogOut,
  ChevronRight, Home, BookOpen,
  ChevronLeft, Ticket, AlignJustify,
} from 'lucide-react';
import api from '../utils/api';

// ── Command Palette pages ────────────────────────────
const PAGES = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['student'] },
  { label: 'Dashboard', path: '/faculty/dashboard', icon: LayoutDashboard, roles: ['faculty'] },
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { label: 'Timetable', path: '/schedule', icon: CalendarDays, roles: ['student', 'faculty', 'admin'] },
  { label: 'Leave Management', path: '/leaves', icon: FileText, roles: ['student', 'admin'] },
  { label: 'Queue Booking', path: '/queue', icon: Ticket, roles: ['student', 'admin'] },
  { label: 'Lost & Found', path: '/lost-found', icon: Search, roles: ['student', 'admin'] },
  { label: 'Admin Dashboard', path: '/admin/dashboard', icon: BarChart3, roles: ['admin'] },
  { label: 'Admin Leaves', path: '/admin/leaves', icon: FileText, roles: ['admin'] },
  { label: 'Queue Admin', path: '/admin/queue', icon: Users, roles: ['admin'] },
  { label: 'Class Scheduling', path: '/admin/schedule', icon: CalendarDays, roles: ['admin'] },
  { label: 'My Profile', path: '/profile', icon: UserCircle, roles: ['student', 'faculty', 'admin'] },
  { label: 'Faculty Attendance', path: '/faculty/attendance', icon: BarChart3, roles: ['faculty'] },
  { label: 'Reschedule Center', path: '/faculty/reschedule', icon: CalendarDays, roles: ['faculty'] },
];

const NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['student'] },
      { label: 'Dashboard', path: '/admin/dashboard', icon: BarChart3, roles: ['admin'] },
      { label: 'Dashboard', path: '/faculty/dashboard', icon: LayoutDashboard, roles: ['faculty'] },
      { label: 'Timetable', path: '/schedule', icon: CalendarDays, roles: ['student', 'admin', 'faculty'] },
    ],
  },
  {
    label: 'Modules',
    items: [
      { label: 'Leave Management', path: '/leaves', icon: FileText, roles: ['student'] },
      { label: 'Queue Booking', path: '/queue', icon: Ticket, roles: ['student'] },
      { label: 'Lost & Found', path: '/lost-found', icon: Search, roles: ['student', 'admin'] },
      { label: 'Attendance', path: '/faculty/attendance', icon: BarChart3, roles: ['faculty'] },
      { label: 'Reschedule', path: '/faculty/reschedule', icon: CalendarDays, roles: ['faculty'] },
      { label: 'Academic Calendar', path: '/academic-calendar', icon: BookOpen, roles: ['faculty', 'student', 'admin'] },
    ],
  },
  {
    label: 'Admin',
    items: [
      { label: 'Leave Review', path: '/admin/leaves', icon: FileText, roles: ['admin'] },
      { label: 'Queue Admin', path: '/admin/queue', icon: Users, roles: ['admin'] },
      { label: 'Scheduling', path: '/admin/schedule', icon: CalendarDays, roles: ['admin'] },
      { label: 'All Users', path: '/users', icon: Users, roles: ['admin'] },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'My Profile', path: '/profile', icon: UserCircle, roles: ['student', 'faculty', 'admin'] },
    ],
  },
];

const roleBadgeStyle = {
  admin:   { bg: 'var(--accent-primary-glow)',  color: 'var(--accent-primary)' },
  student: { bg: 'var(--success-glow)',          color: 'var(--success)' },
  faculty: { bg: 'rgba(167,139,250,0.12)',       color: 'var(--accent-secondary)' },
};

// ── Notification Bell ──────────────────────────────
const NotificationPanel = ({ onClose }) => {
  const [notes, setNotes]   = useState([]);
  const [count, setCount]   = useState(0);
  const [open, setOpen]     = useState(false);
  const bellRef             = useRef(null);
  const [wiggle, setWiggle] = useState(false);

  const fetchCount = useCallback(async () => {
    try {
      const res = await api.get('notifications/unread-count/');
      const newCount = res.data.count;
      if (newCount > count && count > 0) setWiggle(true);
      setCount(newCount);
    } catch {}
  }, [count]);

  const fetchNotes = async () => {
    try {
      const res = await api.get('notifications/');
      setNotes(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    // Wiggle every 5s if unread
    const wiggleInterval = setInterval(() => {
      if (count > 0) setWiggle(true);
    }, 5000);
    return () => { clearInterval(interval); clearInterval(wiggleInterval); };
  }, [count]);

  useEffect(() => {
    if (wiggle) { const t = setTimeout(() => setWiggle(false), 600); return () => clearTimeout(t); }
  }, [wiggle]);

  const toggleOpen = () => {
    setOpen(!open);
    if (!open) fetchNotes();
  };

  const markRead = async (id) => {
    await api.patch(`notifications/${id}/read/`);
    fetchNotes(); fetchCount();
  };

  return (
    <div style={{ position: 'relative' }} ref={bellRef}>
      <button
        onClick={toggleOpen}
        className={wiggle ? 'animate-bell-wiggle' : ''}
        style={{
          width: 38, height: 38, borderRadius: 'var(--radius-md)',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', position: 'relative', color: 'var(--text-secondary)',
          transition: 'all 0.2s',
        }}
      >
        <Bell size={17} />
        {count > 0 && (
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            style={{
              position: 'absolute', top: -4, right: -4,
              width: 18, height: 18, borderRadius: '50%',
              background: 'var(--danger)',
              boxShadow: '0 0 8px rgba(239,68,68,0.5)',
              fontSize: 10, fontWeight: 700, color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {count > 9 ? '9+' : count}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', right: 0, top: 46,
              width: 320, maxHeight: 400, overflowY: 'auto',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-hover)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-xl)',
              backdropFilter: 'blur(20px)',
              zIndex: 200,
            }}
          >
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: '"Plus Jakarta Sans"' }}>
                Notifications
              </span>
              {count > 0 && (
                <button
                  onClick={async () => {
                    await api.patch('notifications/mark-all-read/');
                    fetchNotes(); fetchCount();
                  }}
                  style={{ fontSize: 11, color: 'var(--accent-primary)', cursor: 'pointer', background: 'none', border: 'none' }}
                >
                  Mark all read
                </button>
              )}
            </div>
            {notes.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
                You're all caught up! 🎉
              </div>
            ) : (
              notes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: n.is_read ? 'transparent' : 'var(--accent-primary-glow)',
                    cursor: 'pointer', transition: 'background 0.2s',
                  }}
                >
                  {!n.is_read && (
                    <span style={{
                      display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                      background: 'var(--accent-primary)', marginBottom: 4,
                    }} />
                  )}
                  <p style={{ fontSize: 13, color: n.is_read ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                    {n.message}
                  </p>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Command Palette ────────────────────────────────
const CommandPalette = ({ open, onClose, user, navigate }) => {
  const [query, setQuery]   = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef            = useRef(null);

  const filtered = PAGES
    .filter((p) => p.roles.includes(user?.role))
    .filter((p) => p.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (open) { setQuery(''); setCursor(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    if (e.key === 'Enter' && filtered[cursor]) { navigate(filtered[cursor].path); onClose(); }
    if (e.key === 'Escape') onClose();
  };

  if (!open) return null;

  return (
    <div className="command-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <Search size={17} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setCursor(0); }}
            onKeyDown={handleKey}
            placeholder="Search pages or actions…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 15, color: 'var(--text-primary)',
              fontFamily: '"Inter", sans-serif',
            }}
          />
          <kbd style={{
            fontSize: 11, color: 'var(--text-tertiary)',
            background: 'var(--bg-tertiary)',
            padding: '2px 6px', borderRadius: 4,
            border: '1px solid var(--border-subtle)',
          }}>ESC</kbd>
        </div>

        <div style={{ maxHeight: 340, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
              No results for "{query}"
            </div>
          ) : (
            <>
              <div style={{ padding: '8px 16px 4px', fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Pages
              </div>
              {filtered.map((page, i) => {
                const Icon = page.icon;
                return (
                  <div
                    key={page.path}
                    onClick={() => { navigate(page.path); onClose(); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 16px', cursor: 'pointer',
                      background: i === cursor ? 'var(--accent-primary-glow)' : 'transparent',
                      color: i === cursor ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      transition: 'all 0.1s',
                    }}
                    onMouseEnter={() => setCursor(i)}
                  >
                    <Icon size={16} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 14 }}>{page.label}</span>
                    {i === cursor && (
                      <kbd style={{
                        marginLeft: 'auto', fontSize: 10, color: 'var(--text-tertiary)',
                        background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: 4,
                        border: '1px solid var(--border-subtle)',
                      }}>⏎</kbd>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Sidebar Link ──────────────────────────────────
const SidebarLink = ({ to, icon: Icon, label, collapsed, badge }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `oc-sidebar-link${isActive ? ' active' : ''}`}
    title={collapsed ? label : undefined}
  >
    <Icon size={18} style={{ flexShrink: 0 }} />
    {!collapsed && <span style={{ flex: 1 }}>{label}</span>}
    {!collapsed && badge > 0 && (
      <span className="oc-nav-badge">{badge > 99 ? '99+' : badge}</span>
    )}
    {collapsed && badge > 0 && (
      <span style={{
        position: 'absolute', top: 4, right: 4,
        width: 8, height: 8, borderRadius: '50%',
        background: 'var(--danger)',
        boxShadow: '0 0 6px rgba(239,68,68,0.6)',
      }} />
    )}
    {collapsed && <span className="oc-sidebar-tooltip">{label}</span>}
  </NavLink>
);

// ── Main Layout ────────────────────────────────────
const MainLayout = () => {
  const { user, logout }    = useAuth();
  const navigate            = useNavigate();
  const location            = useLocation();
  const [collapsed, setCollapsed]     = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [cmdOpen, setCmdOpen]         = useState(false);
  const [pendingLeaves, setPendingLeaves] = useState(0);

  // Fetch pending leave count for admin badge
  useEffect(() => {
    if (user?.role !== 'admin') return;
    const load = async () => {
      try {
        const res = await api.get('leaves/');
        setPendingLeaves(res.data.filter((l) => l.status === 'pending').length);
      } catch {}
    };
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [user]);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  const handleLogout = () => { logout(); navigate('/login'); };

  // Build nav groups filtered by role
  const filteredGroups = NAV_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(user?.role)) }))
    .filter((g) => g.items.length > 0);

  // Breadcrumbs
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const pageTitle = pathSegments[pathSegments.length - 1]?.replace(/-/g, ' ') || 'Dashboard';

  const rbStyle = roleBadgeStyle[user?.role] || {};
  const initials = user?.username?.[0]?.toUpperCase() || '?';

  const SidebarContent = ({ collapsed: col }) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand */}
      <div style={{
        padding: col ? '20px 16px' : '20px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 36, height: 36, flexShrink: 0,
          borderRadius: 10, background: 'var(--gradient-hero)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800, color: 'white',
          fontFamily: '"Plus Jakarta Sans"',
          boxShadow: 'var(--shadow-glow-indigo)',
        }}>SC</div>
        {!col && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>
                SMART CAMPUS
              </span>
              {/* Live indicator */}
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--success)',
                boxShadow: '0 0 8px var(--success)',
                animation: 'badge-pulse 2s ease infinite',
              }} />
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 1, letterSpacing: '0.05em' }}>
              Campus Operating System
            </p>
          </div>
        )}
      </div>

      {/* User section */}
      <div style={{
        padding: col ? '12px 10px' : '12px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 36, height: 36, flexShrink: 0, borderRadius: '50%',
          background: 'var(--gradient-hero)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: 'white',
        }}>{initials}</div>
        {!col && (
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.username}
            </p>
            <span style={{
              display: 'inline-block',
              padding: '1px 8px', borderRadius: 99,
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
              background: rbStyle.bg, color: rbStyle.color,
              marginTop: 2,
            }}>
              {user?.role}
            </span>
          </div>
        )}
      </div>

      {/* Nav Groups */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: col ? '12px 8px' : '12px 12px', scrollbarWidth: 'none' }}>
        {filteredGroups.map((group, gi) => (
          <div key={gi} style={{ marginBottom: 8 }}>
            {!col && (
              <p style={{
                fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                padding: '6px 4px 4px', marginBottom: 2,
              }}>
                {group.label}
              </p>
            )}
            <motion.div
              className="stagger-children"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
              initial="hidden" animate="show"
            >
              {group.items.map((item) => (
                <motion.div
                  key={item.path + item.label}
                  variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                >
                  <SidebarLink
                    to={item.path}
                    icon={item.icon}
                    label={item.label}
                    collapsed={col}
                    badge={item.path === '/admin/leaves' ? pendingLeaves : 0}
                  />
                </motion.div>
              ))}
            </motion.div>
            {gi < filteredGroups.length - 1 && (
              <div style={{ height: 1, background: 'var(--border-subtle)', margin: '8px 4px' }} />
            )}
          </div>
        ))}
      </nav>

      {/* Bottom: Logout + Collapse toggle */}
      <div style={{ padding: col ? '12px 8px' : '12px 12px', borderTop: '1px solid var(--border-subtle)' }}>
        <button
          onClick={handleLogout}
          className="oc-sidebar-link"
          style={{
            width: '100%', border: 'none', background: 'transparent',
            cursor: 'pointer', justifyContent: col ? 'center' : 'flex-start',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {!col && <span>Sign Out</span>}
          {col && <span className="oc-sidebar-tooltip">Sign Out</span>}
        </button>
        {/* Collapse toggle (desktop) */}
        <button
          onClick={() => setCollapsed(!col)}
          style={{
            width: '100%', marginTop: 4, padding: '8px 12px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: col ? 'center' : 'flex-end',
            color: 'var(--text-tertiary)', borderRadius: 'var(--radius-md)',
            transition: 'all 0.2s',
          }}
        >
          {col ? <ChevronRight size={15} /> : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
              <ChevronLeft size={15} /> Collapse
            </span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      {/* ── Desktop Sidebar ── */}
      <motion.aside
        className="oc-sidebar"
        style={{ display: 'none' }}
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        // Force display on md+
        css={{ '@media (min-width: 768px)': { display: 'flex' } }}
      >
        <SidebarContent collapsed={collapsed} />
      </motion.aside>
      <aside
        style={{
          display: 'none',
          position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100,
          width: collapsed ? 72 : 260,
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-subtle)',
          flexDirection: 'column',
          overflowX: 'hidden',
        }}
        className="md-sidebar"
      >
        <SidebarContent collapsed={collapsed} />
      </aside>

      {/* ── Mobile Drawer Overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
            }}
            onClick={() => setMobileOpen(false)}
          >
            <motion.aside
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              style={{
                width: 260, height: '100%',
                background: 'var(--bg-secondary)',
                borderRight: '1px solid var(--border-subtle)',
                overflowX: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <SidebarContent collapsed={false} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command Palette */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} user={user} navigate={navigate} />

      {/* ── Main Content ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }} className="main-content-area">
        {/* Header */}
        <header className="oc-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Hamburger (mobile) / Collapse toggle (desktop) */}
            <button
              onClick={() => {
                if (window.innerWidth < 768) setMobileOpen(true);
                // On desktop the sidebar toggle is in the sidebar itself
              }}
              style={{
                width: 36, height: 36, borderRadius: 'var(--radius-md)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-secondary)',
              }}
            >
              <AlignJustify size={17} />
            </button>

            {/* Breadcrumb */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Home size={14} style={{ color: 'var(--text-tertiary)' }} />
              {pathSegments.map((seg, i) => (
                <React.Fragment key={seg}>
                  <ChevronRight size={12} style={{ color: 'var(--text-tertiary)' }} />
                  <span style={{
                    fontSize: 13, fontWeight: 500, textTransform: 'capitalize',
                    color: i === pathSegments.length - 1 ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  }}>
                    {seg.replace(/-/g, ' ')}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Search / Command Palette */}
            <button
              onClick={() => setCmdOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 12px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-tertiary)', cursor: 'pointer',
                fontSize: 13, transition: 'all 0.2s',
              }}
              className="hidden md:flex"
            >
              <Search size={14} />
              <span>Search…</span>
              <kbd style={{
                fontSize: 10, color: 'var(--text-tertiary)',
                background: 'var(--bg-secondary)',
                padding: '1px 5px', borderRadius: 4,
                border: '1px solid var(--border-subtle)',
                marginLeft: 6,
              }}>⌘K</kbd>
            </button>
            <button
              onClick={() => setCmdOpen(true)}
              style={{
                width: 36, height: 36, borderRadius: 'var(--radius-md)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-secondary)',
              }}
              className="flex md:hidden"
            >
              <Search size={16} />
            </button>

            {/* Notifications */}
            <NotificationPanel />

            {/* User Avatar */}
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-hero)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: 'white', cursor: 'pointer',
            }}>
              {initials}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          padding: '28px 28px 80px',
          scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent',
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── Inline CSS for sidebar desktop positioning ── */}
      <style>{`
        @media (min-width: 768px) {
          .md-sidebar { display: flex !important; }
          .main-content-area {
            margin-left: ${collapsed ? 72 : 260}px;
            transition: margin-left 0.3s cubic-bezier(0.4,0,0.2,1);
          }
        }
        select.oc-input option { background: var(--bg-secondary); color: var(--text-primary); }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
};

export default MainLayout;
