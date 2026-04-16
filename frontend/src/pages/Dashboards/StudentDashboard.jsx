import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { PageWrapper, StaggerList } from '../../components/motion';
import { Card, StatusBadge } from '../../components/ui';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

import { CheckCircle, TrendingUp, BookOpen, Clock, ChevronRight } from 'lucide-react';

// ── Animated Stat Card ────────────────────────────
const StatCard = ({ icon: Icon, value, label, color, delay = 0 }) => {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const target = typeof value === 'number' ? value : parseFloat(value) || 0;
    let start = 0;
    const step = target / 40;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setDisplayed(target); clearInterval(timer); }
      else setDisplayed(Math.floor(start * 10) / 10);
    }, 25);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
    >
      <div style={{
        background: 'var(--bg-secondary)',
        border: `1px solid var(--border-subtle)`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 'var(--radius-lg)',
        padding: '20px 20px',
        display: 'flex', alignItems: 'center', gap: 16,
        transition: 'all 0.3s',
        boxShadow: 'var(--shadow-md)',
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color, flexShrink: 0,
        }}>
          <Icon size={20} />
        </div>
        <div>
          <div className="stat-number" style={{ fontSize: 28 }}>
            {typeof value === 'string' && value.includes('%') ? `${displayed}%` : displayed}
          </div>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
            {label}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// ── SVG Circular Progress Ring ────────────────────
const AttendanceRing = ({ percentage }) => {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const color = percentage >= 75 ? 'var(--success)' : percentage >= 65 ? 'var(--warning)' : 'var(--danger)';
  const offset = circ - (percentage / 100) * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', width: 140, height: 140 }}>
        <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
          <motion.circle
            cx="70" cy="70" r={r} fill="none"
            stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: '"Plus Jakarta Sans"', fontWeight: 800,
            fontSize: 28, color: 'var(--text-primary)',
          }}>
            {percentage}%
          </span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Overall Attendance</p>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
          {percentage >= 75 ? '✅ Eligible' : percentage >= 65 ? '⚠️ At Risk' : '❌ Condonation Required'}
        </p>
      </div>
    </div>
  );
};

// ── Custom Chart Tooltip ──────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)', padding: '10px 14px',
      boxShadow: 'var(--shadow-lg)',
    }}>
      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ fontSize: 13, fontWeight: 600, color: entry.color || 'var(--text-primary)' }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
          {entry.name?.includes('%') || entry.dataKey === 'percentage' ? '%' : ''}
        </p>
      ))}
    </div>
  );
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [performance, setPerformance]             = useState([]);
  const [upcomingClasses, setUpcomingClasses]     = useState([]);
  const [loading, setLoading]                     = useState(true);

  useEffect(() => {
    document.title = `Dashboard | Smart Campus`;
    (async () => {
      try {
        const [attRes, perfRes, schRes] = await Promise.all([
          api.get('attendance/my-summary/'),
          api.get('marks/my-performance/'),
          api.get('schedule/'),
        ]);
        setAttendanceSummary(attRes.data);
        setPerformance(perfRes.data);
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        setUpcomingClasses(schRes.data.filter((s) => s.day_of_week === today));
      } catch (e) {
        console.error('Dashboard load error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalPct = attendanceSummary.length > 0
    ? Math.round(attendanceSummary.reduce((a, c) => a + c.percentage, 0) / attendanceSummary.length)
    : 0;

  // Color bars based on percentage
  const barColor = (pct) =>
    pct >= 75 ? '#10b981' : pct >= 65 ? '#f59e0b' : '#ef4444';

  return (
    <PageWrapper>
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 28 }}
      >
        <h1 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 26, marginBottom: 6 }}>
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},{' '}
          <span className="gradient-text">{user?.username}</span> 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Roll no: <span style={{ fontFamily: '"JetBrains Mono"', color: 'var(--text-primary)' }}>{user?.roll_number || '—'}</span>
          {' · '}{user?.department || '—'}
          {' · '}Semester 4
        </p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={CheckCircle}  value={`${totalPct}%`} label="Avg Attendance"  color="var(--success)"          delay={0} />
        <StatCard icon={BookOpen}     value={attendanceSummary.length} label="Subjects" color="var(--accent-primary)" delay={0.08} />
        <StatCard icon={TrendingUp}   value={performance.length}  label="Exam Records"  color="var(--accent-secondary)"  delay={0.16} />
        <StatCard icon={Clock}        value={upcomingClasses.length} label="Classes Today" color="var(--warning)"      delay={0.24} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Attendance Ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 24, boxShadow: 'var(--shadow-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <AttendanceRing percentage={totalPct} />
        </motion.div>

        {/* Subject Attendance Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 24, boxShadow: 'var(--shadow-md)',
          }}
        >
          <h3 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 700, fontSize: 15, marginBottom: 20 }}>
            Subject-wise Attendance
          </h3>
          {attendanceSummary.length === 0 ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
              No attendance data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={attendanceSummary} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="schedule__subject"
                  tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontFamily: '"JetBrains Mono"' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontFamily: '"JetBrains Mono"' }}
                  axisLine={false} tickLine={false} domain={[0, 100]}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="percentage" radius={[4, 4, 0, 0]} animationDuration={1000} animationEasing="ease-out">
                  {attendanceSummary.map((entry, i) => (
                    <Cell key={i} fill={barColor(entry.percentage)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Performance + Today's Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 24, boxShadow: 'var(--shadow-md)',
          }}
        >
          <h3 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 700, fontSize: 15, marginBottom: 20 }}>
            Academic Performance
          </h3>
          {performance.length === 0 ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
              No performance data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={performance} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="subject"
                  tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontFamily: '"JetBrains Mono"' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontFamily: '"JetBrains Mono"' }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="total_obtained" name="Obtained" fill="#6366f1" radius={[4, 4, 0, 0]} animationDuration={1000} />
                <Bar dataKey="total_max" name="Max"      fill="rgba(99,102,241,0.15)" radius={[4, 4, 0, 0]} animationDuration={1200} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Today's Classes */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 24, boxShadow: 'var(--shadow-md)',
          }}
        >
          <h3 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 700, fontSize: 15, marginBottom: 20 }}>
            Today's Classes
          </h3>
          {upcomingClasses.length === 0 ? (
            <div style={{
              height: 180, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-tertiary)', fontSize: 13, gap: 8,
            }}>
              <Clock size={32} strokeWidth={1.5} />
              <span>No classes scheduled today</span>
            </div>
          ) : (
            <div className="space-y-3" style={{ maxHeight: 260, overflowY: 'auto' }}>
              {upcomingClasses.map((cls, i) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.06 }}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 14px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                >
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13, fontFamily: '"Plus Jakarta Sans"' }}>{cls.subject}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3 }}>
                      {cls.start_time?.slice(0, 5)} – {cls.end_time?.slice(0, 5)} · Room {cls.room}
                    </p>
                  </div>
                  <div style={{
                    padding: '4px 10px', borderRadius: 'var(--radius-full)',
                    background: 'var(--accent-primary-glow)', color: 'var(--accent-primary)',
                    fontSize: 11, fontWeight: 700,
                  }}>
                    LIVE
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </PageWrapper>
  );
};

export default StudentDashboard;
