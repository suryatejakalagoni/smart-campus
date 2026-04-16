import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { motion } from 'framer-motion';
import { PageWrapper } from '../../components/motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Users, FileText, Clock, Ticket, ArrowRight, Circle } from 'lucide-react';

const ACCENT_COLORS = ['#6366f1', '#a78bfa', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'];

const StatCard = ({ icon: Icon, value, label, color, trend, delay = 0 }) => {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let start = 0;
    const target = parseInt(value) || 0;
    const step = target / 40;
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setDisplayed(target); clearInterval(t); }
      else setDisplayed(Math.floor(start));
    }, 22);
    return () => clearInterval(t);
  }, [value]);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <div style={{
        background: 'var(--bg-secondary)', borderLeft: `3px solid ${color}`,
        border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)',
        padding: 20, boxShadow: 'var(--shadow-md)', transition: 'all 0.25s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `var(--shadow-lg), 0 0 16px ${color}18`; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: `${color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0,
          }}>
            <Icon size={18} />
          </div>
          {trend && (
            <span style={{ fontSize: 11, fontWeight: 700, color: trend > 0 ? 'var(--success)' : 'var(--danger)' }}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
        </div>
        <div style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 30, color: 'var(--text-primary)', lineHeight: 1 }}>
          {displayed}
        </div>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 6 }}>
          {label}
        </p>
      </div>
    </motion.div>
  );
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)', padding: '10px 14px', boxShadow: 'var(--shadow-lg)',
    }}>
      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</p>
      {payload.map((e, i) => (
        <p key={i} style={{ fontSize: 13, fontWeight: 600, color: e.color || 'var(--text-primary)' }}>
          {e.name}: {e.value}
        </p>
      ))}
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats]               = useState({ students: 0, faculty: 0, leaves: 0, bookings: 0 });
  const [attendanceData, setChartData]  = useState([]);
  const [recentActivity, setActivity]  = useState([]);
  const [loading, setLoading]           = useState(true);

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
        setChartData([
          { name: 'CSE-A', avg: 82 }, { name: 'CSE-B', avg: 76 },
          { name: 'ECE-A', avg: 79 }, { name: 'ME-A',  avg: 71 },
        ]);
        const combined = [
          ...leavesRes.data.slice(0, 3).map((l) => ({ type: 'leave', title: `${l.student?.username || 'Student'} — Leave Request`, status: l.status, date: l.created_at })),
          ...queueRes.data.slice(0, 3).map((q) => ({ type: 'queue', title: `${q.token_number} — Queue Booking`, status: q.status, date: q.created_at })),
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
    { icon: Users,    value: stats.students, label: 'Enrolled Students', color: '#6366f1' },
    { icon: Users,    value: stats.faculty,  label: 'Faculty Members',   color: '#a78bfa' },
    { icon: FileText, value: stats.leaves,   label: 'Pending Leaves',    color: '#f59e0b' },
    { icon: Ticket,   value: stats.bookings, label: 'Queue Today',       color: '#10b981' },
  ];

  const typeColor = { leave: '#f59e0b', queue: '#6366f1' };

  return (
    <PageWrapper>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 26, marginBottom: 6 }}>
          Campus Overview
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Real-time visibility across all campus operations
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s, i) => (
          <StatCard key={s.label} {...s} delay={i * 0.07} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="lg:col-span-2"
          style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 700, fontSize: 15 }}>
              Section-wise Avg Attendance
            </h3>
            <span style={{
              padding: '4px 10px', borderRadius: 99,
              background: 'var(--success-glow)', color: 'var(--success)',
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>Live</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={attendanceData} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-tertiary)', fontSize: 12, fontFamily: '"JetBrains Mono"' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontFamily: '"JetBrains Mono"' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar dataKey="avg" radius={[6, 6, 0, 0]} animationDuration={1000}>
                {attendanceData.map((_, i) => (
                  <Cell key={i} fill={ACCENT_COLORS[i % ACCENT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-md)',
            display: 'flex', flexDirection: 'column',
          }}
        >
          <h3 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 700, fontSize: 15, marginBottom: 20 }}>
            Platform Activity
          </h3>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {recentActivity.map((act, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.05 }}
                style={{
                  display: 'flex', gap: 12, padding: '10px 8px',
                  borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-glass)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', marginTop: 5,
                  background: typeColor[act.type] || '#6366f1', flexShrink: 0,
                }} />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {act.title}
                  </p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 3 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      {new Date(act.date).toLocaleDateString()}
                    </span>
                    <span className={`oc-badge oc-badge-${act.status}`}>{act.status}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <button style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            marginTop: 12, padding: '8px', borderRadius: 'var(--radius-md)',
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
    </PageWrapper>
  );
};

export default AdminDashboard;
