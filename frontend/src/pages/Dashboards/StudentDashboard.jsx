import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { PageWrapper } from '../../components/motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import {
  CheckCircle, TrendingUp, BookOpen, Clock, ChevronRight,
  FileText, Ticket, Search, Calendar, AlertTriangle, X,
  CalendarDays, MapPin, Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ── Animated Count-up Stat Card ─────────────────────
const StatCard = ({ icon: Icon, value, label, color, bgColor, delay = 0 }) => {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const target = typeof value === 'number' ? value : parseFloat(value) || 0;
    if (target === 0) return;
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 22px',
        display: 'flex', alignItems: 'center', gap: 16,
        boxShadow: 'var(--shadow-md)',
        cursor: 'default',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div style={{
        position: 'absolute', right: -20, bottom: -20,
        width: 100, height: 100, borderRadius: '50%',
        background: bgColor || `${color}08`,
        opacity: 0.5,
      }} />
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: bgColor || `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color, flexShrink: 0,
        boxShadow: `0 0 20px ${color}30`,
      }}>
        <Icon size={22} />
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          fontFamily: '"Plus Jakarta Sans"', fontWeight: 800,
          fontSize: 30, color: 'var(--text-primary)', lineHeight: 1,
        }}>
          {typeof value === 'string' && value.includes('%') ? `${displayed}%` : displayed}
        </div>
        <p style={{
          fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)',
          textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 4,
        }}>
          {label}
        </p>
      </div>
    </motion.div>
  );
};

// ── SVG Circular Progress Ring ────────────────────
const AttendanceRing = ({ percentage, subject }) => {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const color = percentage >= 75 ? '#10b981' : percentage >= 65 ? '#f59e0b' : '#ef4444';
  const offset = circ - (percentage / 100) * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: 128, height: 128 }}>
        <svg width="128" height="128" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
          <motion.circle
            cx="64" cy="64" r={r} fill="none"
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
            fontSize: 24, color: 'var(--text-primary)',
          }}>
            {percentage}%
          </span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Overall Attendance</p>
        <p style={{ fontSize: 11, color, marginTop: 3, fontWeight: 600 }}>
          {percentage >= 75 ? 'Eligible' : percentage >= 65 ? 'At Risk' : 'Condonation Required'}
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
      background: 'rgba(10,15,30,0.95)', border: '1px solid rgba(99,102,241,0.3)',
      borderRadius: 12, padding: '10px 14px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
      backdropFilter: 'blur(20px)',
    }}>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ fontSize: 13, fontWeight: 700, color: entry.color || '#fff', display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, display: 'inline-block' }} />
          {entry.name}: <strong>{typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}</strong>
          {entry.dataKey === 'percentage' ? '%' : ''}
        </p>
      ))}
    </div>
  );
};

// ── Quick Actions Row ─────────────────────────────
const QUICK_ACTIONS = [
  { label: 'Apply Leave', icon: FileText, path: '/leaves', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { label: 'Book Queue', icon: Ticket, path: '/queue', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  { label: 'Report Item', icon: Search, path: '/lost-found', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  { label: 'Timetable', icon: CalendarDays, path: '/schedule', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
];

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [performance, setPerformance]             = useState([]);
  const [upcomingClasses, setUpcomingClasses]     = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [warnDismissed, setWarnDismissed]         = useState(false);

  useEffect(() => {
    document.title = 'Dashboard | Smart Campus';
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

  const lowAttendance = attendanceSummary.filter(s => s.percentage < 75);
  const bestSubject = attendanceSummary.reduce((best, s) => (!best || s.percentage > best.percentage ? s : best), null);

  const barColor = (pct) => pct >= 75 ? '#10b981' : pct >= 65 ? '#f59e0b' : '#ef4444';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <PageWrapper>
      {/* Welcome Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Zap size={18} style={{ color: 'var(--warning)' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Student Portal
          </span>
        </div>
        <h1 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 28, marginBottom: 6, lineHeight: 1.2 }}>
          {greeting}, <span className="gradient-text">{user?.first_name || user?.username}</span> 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Roll No: <span style={{ fontFamily: '"JetBrains Mono"', color: 'var(--text-primary)', fontWeight: 600 }}>{user?.roll_number || '—'}</span>
          {' · '}{user?.department || '—'}{' · '}Semester 5
        </p>
      </motion.div>

      {/* Attendance Warning Banner */}
      <AnimatePresence>
        {!warnDismissed && lowAttendance.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderLeft: '4px solid #f59e0b',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              marginBottom: 24,
              display: 'flex', alignItems: 'flex-start', gap: 14,
            }}
          >
            <AlertTriangle size={20} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#f59e0b', marginBottom: 4 }}>
                Attendance Alert
              </p>
              {lowAttendance.map(s => {
                const needed = Math.ceil((0.75 * (s.total_classes || 45) - s.attended_classes) / (1 - 0.75));
                const subName = (s.schedule__subject || '').split(':')[0];
                return (
                  <p key={subName} style={{ fontSize: 13, color: 'rgba(245,158,11,0.85)', lineHeight: 1.6 }}>
                    Your attendance in <strong>{subName}</strong> is{' '}
                    <strong>{s.percentage?.toFixed(1)}%</strong> — below the required 75%.
                    {needed > 0 && ` Attend ${needed} more classes to meet the minimum.`}
                  </p>
                );
              })}
            </div>
            <button onClick={() => setWarnDismissed(true)} style={{ color: 'rgba(245,158,11,0.6)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={CheckCircle}  value={`${totalPct}%`}             label="Avg Attendance"   color="#10b981" bgColor="rgba(16,185,129,0.12)" delay={0} />
        <StatCard icon={BookOpen}     value={attendanceSummary.length}   label="Subjects"          color="#6366f1" bgColor="rgba(99,102,241,0.12)"  delay={0.08} />
        <StatCard icon={TrendingUp}   value={performance.length}         label="Exam Records"     color="#8b5cf6" bgColor="rgba(139,92,246,0.12)"  delay={0.16} />
        <StatCard icon={Clock}        value={upcomingClasses.length}     label="Classes Today"    color="#f59e0b" bgColor="rgba(245,158,11,0.12)"  delay={0.24} />
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{ marginBottom: 28 }}
      >
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
          Quick Actions
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {QUICK_ACTIONS.map((action, i) => (
            <motion.button
              key={action.path}
              onClick={() => navigate(action.path)}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 + i * 0.06 }}
              whileHover={{ y: -4, boxShadow: `0 12px 30px ${action.color}25` }}
              whileTap={{ scale: 0.97 }}
              style={{
                background: action.bg,
                border: `1px solid ${action.color}30`,
                borderRadius: 'var(--radius-lg)',
                padding: '16px 12px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: `${action.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: action.color,
              }}>
                <action.icon size={20} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center' }}>
                {action.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Attendance Ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <AttendanceRing percentage={totalPct} />
        </motion.div>

        {/* Subject Attendance Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2"
          style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-md)',
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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="schedule__subject"
                  tick={{ fill: 'var(--text-tertiary)', fontSize: 10, fontFamily: '"JetBrains Mono"' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => v?.split(':')[0] || v}
                />
                <YAxis
                  tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
                  axisLine={false} tickLine={false} domain={[0, 100]}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <ReferenceLine y={75} stroke="rgba(245,158,11,0.5)" strokeDasharray="4 2" label={{ value: '75%', fill: '#f59e0b', fontSize: 10 }} />
                <Bar dataKey="percentage" radius={[5, 5, 0, 0]} animationBegin={200} animationDuration={1200} animationEasing="ease-out">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Performance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-md)',
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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="subject"
                  tick={{ fill: 'var(--text-tertiary)', fontSize: 10, fontFamily: '"JetBrains Mono"' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => v?.split(':')[0] || v}
                />
                <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="total_obtained" name="Obtained" fill="#6366f1" radius={[5, 5, 0, 0]} animationBegin={200} animationDuration={1200} />
                <Bar dataKey="total_max"      name="Max"      fill="rgba(99,102,241,0.15)" radius={[5, 5, 0, 0]} animationBegin={300} animationDuration={1200} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Today's Classes */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-md)',
          }}
        >
          <h3 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 700, fontSize: 15, marginBottom: 20 }}>
            Today's Classes
          </h3>
          {upcomingClasses.length === 0 ? (
            <div style={{ height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 13, gap: 10 }}>
              <Calendar size={36} strokeWidth={1.5} style={{ opacity: 0.4 }} />
              <span>No classes scheduled for today</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto' }}>
              {upcomingClasses.map((cls, i) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.06 }}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 14px',
                    background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)', transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 4, height: 36, borderRadius: 99, background: 'var(--gradient-hero)' }} />
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 13, fontFamily: '"Plus Jakarta Sans"' }}>
                        {cls.subject?.split(':')[1]?.trim() || cls.subject}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, display: 'flex', gap: 6 }}>
                        <Clock size={10} /> {cls.start_time?.slice(0, 5)} – {cls.end_time?.slice(0, 5)}
                        <MapPin size={10} style={{ marginLeft: 4 }} /> {cls.room}
                      </p>
                    </div>
                  </div>
                  <div style={{
                    padding: '3px 10px', borderRadius: 'var(--radius-full)',
                    background: 'var(--accent-primary-glow)', color: 'var(--accent-primary)',
                    fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
                  }}>
                    LIVE
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Summary Strip */}
      {attendanceSummary.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))',
            border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: 'var(--radius-lg)', padding: '14px 20px',
            display: 'flex', gap: 24, flexWrap: 'wrap',
          }}
        >
          <SummaryItem label="Overall Attendance" value={`${totalPct}%`} color="var(--accent-primary)" />
          {bestSubject && (
            <SummaryItem label="Best Subject" value={`${bestSubject.schedule__subject?.split(':')[0]} (${bestSubject.percentage?.toFixed(1)}%)`} color="var(--success)" />
          )}
          {lowAttendance.length > 0 && (
            <SummaryItem label="Needs Attention" value={lowAttendance.map(s => s.schedule__subject?.split(':')[0]).join(', ')} color="var(--warning)" />
          )}
        </motion.div>
      )}
    </PageWrapper>
  );
};

const SummaryItem = ({ label, value, color }) => (
  <div>
    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 3 }}>{label}</p>
    <p style={{ fontSize: 13, fontWeight: 700, color }}>{value}</p>
  </div>
);

export default StudentDashboard;
