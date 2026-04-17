import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageWrapper } from '../../components/motion';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  CalendarDays, FileText, Users, BookOpen,
  Clock, ChevronRight, CheckCircle2, AlertTriangle,
} from 'lucide-react';

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const StatCard = ({ icon: Icon, value, label, color, delay }) => {
  const [n, setN] = useState(0);
  useEffect(() => {
    const target = parseInt(value) || 0;
    const step = Math.max(1, Math.ceil(target / 30));
    let cur = 0;
    const t = setInterval(() => {
      cur = Math.min(cur + step, target);
      setN(cur);
      if (cur >= target) clearInterval(t);
    }, 22);
    return () => clearInterval(t);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      style={{
        padding: 20, borderRadius: 16,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderLeft: `3px solid ${color}`,
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          <Icon size={18} />
        </div>
      </div>
      <div style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 34, color: 'var(--text-primary)', lineHeight: 1 }}>{n}</div>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 6 }}>{label}</p>
    </motion.div>
  );
};

const FacultyDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [todayClasses, setTodayClasses] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const todayName = DAY_NAMES[new Date().getDay()];

  useEffect(() => {
    document.title = 'Faculty Dashboard | Smart Campus';
    (async () => {
      try {
        const [schedRes, leavesRes, studentsRes] = await Promise.all([
          api.get('schedule/'),
          api.get('leaves/'),
          api.get('users/?role=student'),
        ]);

        // Filter today's classes for this faculty
        const mine = schedRes.data.filter(
          (s) => s.faculty === user?.id || s.faculty_details?.id === user?.id
        );
        setTodayClasses(mine.filter((s) => s.day_of_week === todayName));
        setPendingLeaves(leavesRes.data.filter((l) => l.status === 'pending').length);
        setTotalStudents(studentsRes.data.length);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, todayName]);

  const quickActions = [
    { icon: CalendarDays, label: 'View Timetable',    path: '/schedule',           color: '#6366f1' },
    { icon: FileText,     label: 'Leave Requests',    path: '/leaves',             color: '#f59e0b' },
    { icon: Users,        label: 'Mark Attendance',   path: '/faculty/attendance', color: '#10b981' },
    { icon: BookOpen,     label: 'Request Reschedule', path: '/faculty/reschedule', color: '#a78bfa' },
  ];

  return (
    <PageWrapper>
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <motion.h1
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 26, marginBottom: 6 }}
        >
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'},{' '}
          <span style={{ color: 'var(--accent-primary)' }}>{user?.username}</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          style={{ color: 'var(--text-secondary)', fontSize: 14 }}
        >
          Here's your campus overview for today
        </motion.p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}
           className="faculty-stats-grid">
        <StatCard icon={CalendarDays}   value={todayClasses.length}  label="Classes Today"   color="#6366f1" delay={0} />
        <StatCard icon={AlertTriangle}  value={pendingLeaves}         label="Pending Leaves"  color="#f59e0b" delay={0.07} />
        <StatCard icon={Users}          value={totalStudents}         label="Total Students"  color="#10b981" delay={0.14} />
      </div>

      {/* Today's Classes + Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}
           className="faculty-grid">

        {/* Today's Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
            borderRadius: 16, padding: 22, boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <h3 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 700, fontSize: 15 }}>
                Today's Classes
              </h3>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, textTransform: 'capitalize' }}>
                {todayName} schedule
              </p>
            </div>
            <button
              onClick={() => navigate('/schedule')}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Full timetable <ChevronRight size={13} />
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="oc-skeleton" style={{ height: 72, borderRadius: 12 }} />
              ))}
            </div>
          ) : todayClasses.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '32px 20px',
              border: '1px dashed var(--border-subtle)', borderRadius: 12,
            }}>
              <CheckCircle2 size={28} color="#10b981" style={{ margin: '0 auto 10px', opacity: 0.6 }} />
              <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)' }}>No classes today</p>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Enjoy your free day!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todayClasses
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map((cls, i) => (
                  <motion.div
                    key={cls.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.06 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px', borderRadius: 12,
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{
                      width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                      background: 'rgba(99,102,241,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <BookOpen size={18} color="#6366f1" />
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cls.subject}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                        {cls.section} · Room {cls.room}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Clock size={12} color="var(--text-tertiary)" />
                        <span style={{ fontFamily: '"JetBrains Mono"', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {cls.start_time.slice(0, 5)}–{cls.end_time.slice(0, 5)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
            borderRadius: 16, padding: 22, boxShadow: 'var(--shadow-md)',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}
        >
          <h3 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
            Quick Actions
          </h3>
          {quickActions.map((a, i) => (
            <motion.button
              key={a.label}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.06 }}
              onClick={() => navigate(a.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 12,
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer', textAlign: 'left',
                transition: 'border-color 0.2s, background 0.2s',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = a.color + '55';
                e.currentTarget.style.background = a.color + '0a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.background = 'var(--bg-tertiary)';
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 8, background: `${a.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color }}>
                <a.icon size={16} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{a.label}</span>
              <ChevronRight size={13} style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }} />
            </motion.button>
          ))}
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .faculty-stats-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .faculty-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 540px) {
          .faculty-stats-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </PageWrapper>
  );
};

export default FacultyDashboard;
