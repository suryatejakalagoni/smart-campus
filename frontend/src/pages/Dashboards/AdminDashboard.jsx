import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { motion } from 'framer-motion';
import { PageWrapper } from '../../components/motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line,
} from 'recharts';
import {
  Users, FileText, Clock, Ticket, ArrowRight,
  CheckCircle, AlertTriangle, Search, CalendarDays,
} from 'lucide-react';

const ACCENT = ['#6366f1', '#a78bfa', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'];

// ── Count-up Stat Card ────────────────────────────
const StatCard = ({ icon: Icon, value, label, color, sub, delay = 0 }) => {
  const [n, setN] = useState(0);
  useEffect(() => {
    const target = parseInt(value) || 0;
    const step = Math.max(1, Math.ceil(target / 35));
    let cur = 0;
    const t = setInterval(() => {
      cur = Math.min(cur + step, target);
      setN(cur);
      if (cur >= target) clearInterval(t);
    }, 20);
    return () => clearInterval(t);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      style={{
        padding: 20, borderRadius: 16,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderLeft: `3px solid ${color}`,
        boxShadow: 'var(--shadow-md)',
        cursor: 'default',
        transition: 'box-shadow 0.25s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = `var(--shadow-lg), 0 0 20px ${color}18`}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color,
        }}>
          <Icon size={18} />
        </div>
        {sub && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
            background: `${color}18`, color,
          }}>{sub}</span>
        )}
      </div>
      <div style={{
        fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 34,
        color: 'var(--text-primary)', lineHeight: 1,
      }}>{n}</div>
      <p style={{
        fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)',
        textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 6,
      }}>{label}</p>
    </motion.div>
  );
};

// ── Custom Chart Tooltip ──────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
      borderRadius: 10, padding: '10px 14px', boxShadow: 'var(--shadow-lg)',
    }}>
      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</p>
      {payload.map((e, i) => (
        <p key={i} style={{ fontSize: 13, fontWeight: 600, color: e.color || 'var(--text-primary)' }}>
          {e.name}: {e.value}{typeof e.value === 'number' && e.name.toLowerCase().includes('avg') ? '%' : ''}
        </p>
      ))}
    </div>
  );
};

// ── Quick Action Button ───────────────────────────
const QuickAction = ({ icon: Icon, label, path, color, navigate, delay }) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.93 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    whileHover={{ scale: 1.04 }}
    whileTap={{ scale: 0.97 }}
    onClick={() => navigate(path)}
    style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      padding: '18px 12px', borderRadius: 14,
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-subtle)',
      cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = color + '55';
      e.currentTarget.style.boxShadow = `0 4px 20px ${color}18`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = 'var(--border-subtle)';
      e.currentTarget.style.boxShadow = 'none';
    }}
  >
    <div style={{
      width: 40, height: 40, borderRadius: 12,
      background: `${color}14`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', color,
    }}>
      <Icon size={18} />
    </div>
    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>{label}</span>
  </motion.button>
);

// ── Activity Row ──────────────────────────────────
const ActivityRow = ({ act, index }) => {
  const typeColor = { leave: '#f59e0b', queue: '#6366f1' };
  const statusColor = {
    pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444',
    booked: '#6366f1', completed: '#10b981', in_progress: '#f59e0b',
  };
  const sc = statusColor[act.status] || '#6366f1';

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.55 + index * 0.04 }}
      style={{
        display: 'flex', gap: 12, padding: '10px 8px',
        borderRadius: 10, cursor: 'pointer', transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-glass)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{
        width: 8, height: 8, borderRadius: '50%', marginTop: 5,
        background: typeColor[act.type] || '#6366f1', flexShrink: 0,
      }} />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <p style={{
          fontSize: 13, fontWeight: 500, color: 'var(--text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{act.title}</p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 3 }}>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            {new Date(act.date).toLocaleDateString()}
          </span>
          <span style={{
            padding: '1px 7px', borderRadius: 99, fontSize: 10, fontWeight: 700,
            background: `${sc}18`, color: sc, textTransform: 'capitalize',
          }}>{act.status}</span>
        </div>
      </div>
    </motion.div>
  );
};

// ── Main Component ─────────────────────────────────
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats]       = useState({ students: 0, faculty: 0, leaves: 0, bookings: 0 });
  const [chartData, setChart]   = useState([]);
  const [trendData, setTrend]   = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    document.title = 'Admin Dashboard | Smart Campus';
    (async () => {
      try {
        const [leavesRes, queueRes, statsRes] = await Promise.all([
          api.get('leaves/'),
          api.get('queue/'),
          api.get('dashboard/stats/'),
        ]);
        setStats(statsRes.data);

        setChart([
          { name: 'CSE-A', avg: 82 },
          { name: 'CSE-B', avg: 76 },
          { name: 'ECE-A', avg: 79 },
          { name: 'ME-A',  avg: 71 },
        ]);

        // Simulated weekly booking trend
        setTrend([
          { day: 'Mon', bookings: 4 },
          { day: 'Tue', bookings: 7 },
          { day: 'Wed', bookings: 5 },
          { day: 'Thu', bookings: 9 },
          { day: 'Fri', bookings: 6 },
          { day: 'Sat', bookings: 2 },
        ]);

        const combined = [
          ...leavesRes.data.slice(0, 4).map((l) => ({
            type: 'leave',
            title: `${l.student?.username || 'Student'} — Leave Request`,
            status: l.status,
            date: l.created_at,
          })),
          ...queueRes.data.slice(0, 4).map((q) => ({
            type: 'queue',
            title: `${q.token_number} — Queue Booking`,
            status: q.status,
            date: q.created_at,
          })),
        ].sort((a, b) => new Date(b.date) - new Date(a.date));
        setActivity(combined.slice(0, 8));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statCards = [
    { icon: Users,       value: stats.students, label: 'Enrolled Students', color: '#6366f1' },
    { icon: Users,       value: stats.faculty,  label: 'Faculty Members',   color: '#a78bfa' },
    { icon: AlertTriangle, value: stats.leaves, label: 'Pending Leaves',    color: '#f59e0b', sub: 'Review' },
    { icon: Ticket,      value: stats.bookings, label: 'Queue Today',       color: '#10b981' },
  ];

  const quickActions = [
    { icon: FileText,    label: 'Review Leaves',    path: '/admin/leaves',   color: '#f59e0b' },
    { icon: Ticket,      label: 'Queue Admin',       path: '/admin/queue',    color: '#6366f1' },
    { icon: CalendarDays,label: 'Scheduling',        path: '/admin/schedule', color: '#a78bfa' },
    { icon: Search,      label: 'Lost & Found',      path: '/lost-found',     color: '#10b981' },
    { icon: Users,       label: 'All Users',         path: '/users',          color: '#3b82f6' },
    { icon: CheckCircle, label: 'Attendance',        path: '/schedule',       color: '#ec4899' },
  ];

  return (
    <PageWrapper>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <motion.h1
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 26, marginBottom: 6 }}
        >
          Campus Overview
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          style={{ color: 'var(--text-secondary)', fontSize: 14 }}
        >
          Real-time visibility across all campus operations
        </motion.p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}
           className="stats-grid">
        {statCards.map((s, i) => (
          <StatCard key={s.label} {...s} delay={i * 0.07} />
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
        style={{ marginBottom: 24 }}
      >
        <p style={{
          fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)',
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
        }}>Quick Actions</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}
             className="quick-actions-grid">
          {quickActions.map((a, i) => (
            <QuickAction key={a.label} {...a} navigate={navigate} delay={0.35 + i * 0.05} />
          ))}
        </div>
      </motion.div>

      {/* Charts + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 320px', gap: 20 }}
           className="charts-grid">

        {/* Attendance Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
            borderRadius: 16, padding: 22, boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <h3 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 700, fontSize: 14 }}>
                Avg Attendance by Section
              </h3>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>Current semester</p>
            </div>
            <span style={{
              padding: '3px 10px', borderRadius: 99,
              background: 'rgba(16,185,129,0.12)', color: '#10b981',
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            }}>Live</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: -24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontFamily: '"JetBrains Mono"' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-tertiary)', fontSize: 10, fontFamily: '"JetBrains Mono"' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar dataKey="avg" name="Avg %" radius={[6, 6, 0, 0]} animationDuration={1000}>
                {chartData.map((_, i) => <Cell key={i} fill={ACCENT[i % ACCENT.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Booking Trend Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.47 }}
          style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
            borderRadius: 16, padding: 22, boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 700, fontSize: 14 }}>
              Weekly Queue Trend
            </h3>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>Bookings this week</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontFamily: '"JetBrains Mono"' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 10, fontFamily: '"JetBrains Mono"' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(99,102,241,0.2)', strokeWidth: 1 }} />
              <Line
                type="monotone" dataKey="bookings" name="Bookings"
                stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }}
                activeDot={{ r: 6, fill: '#a78bfa' }}
                animationDuration={1200}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}
          style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
            borderRadius: 16, padding: 22, boxShadow: 'var(--shadow-md)',
            display: 'flex', flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 700, fontSize: 14 }}>
              Platform Activity
            </h3>
            <Clock size={14} color="var(--text-tertiary)" />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {activity.length === 0 && !loading && (
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', paddingTop: 20 }}>
                No recent activity
              </p>
            )}
            {activity.map((act, i) => <ActivityRow key={i} act={act} index={i} />)}
          </div>

          <button
            onClick={() => navigate('/admin/leaves')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              marginTop: 12, padding: 8, borderRadius: 10,
              background: 'transparent', border: 'none',
              fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)',
              cursor: 'pointer', transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
          >
            View All Activity <ArrowRight size={13} />
          </button>
        </motion.div>
      </div>

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 1200px) {
          .charts-grid { grid-template-columns: 1fr 1fr !important; }
          .charts-grid > *:last-child { grid-column: span 2; }
        }
        @media (max-width: 900px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .quick-actions-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .charts-grid { grid-template-columns: 1fr !important; }
          .charts-grid > *:last-child { grid-column: span 1; }
        }
        @media (max-width: 540px) {
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .quick-actions-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
    </PageWrapper>
  );
};

export default AdminDashboard;
