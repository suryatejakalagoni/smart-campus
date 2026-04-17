import React, { useState, useEffect, useMemo } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMapPin, FiUser, FiClock, FiList, FiGrid, FiRefreshCw } from 'react-icons/fi';
import { SkeletonTable } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { Calendar, X, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useTimetable } from '../../hooks/useTimetable';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16];
const HOUR_HEIGHT = 96; // px per hour

const subjectColors = [
  { bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.3)',  text: '#818cf8', shadow: 'rgba(99,102,241,0.15)' },
  { bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.3)',  text: '#a78bfa', shadow: 'rgba(139,92,246,0.15)' },
  { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  text: '#34d399', shadow: 'rgba(16,185,129,0.15)' },
  { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  text: '#fbbf24', shadow: 'rgba(245,158,11,0.15)' },
  { bg: 'rgba(236,72,153,0.12)',  border: 'rgba(236,72,153,0.3)',  text: '#f472b6', shadow: 'rgba(236,72,153,0.15)' },
];

const getSubjectColor = (subject) => {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  return subjectColors[Math.abs(hash) % subjectColors.length];
};

const getCurrentTimeOffset = () => {
  const now = new Date();
  const hours = now.getHours();
  const mins = now.getMinutes();
  if (hours < 9 || hours > 16) return null;
  return (hours - 9 + mins / 60) * HOUR_HEIGHT;
};

const TimetableView = () => {
  const { user } = useAuth();
  const [section, setSection]     = useState('A');
  const [semester, setSemester]   = useState(5);
  const [viewMode, setViewMode]   = useState('grid');
  const [timeOffset, setTimeOffset] = useState(getCurrentTimeOffset());

  const { schedules, loading, error, fetchSchedules } = useTimetable({
    section,
    semester,
    role: user?.role,
  });

  // Reschedule state
  const [rescheduleModal, setRescheduleModal] = useState(null); // stores the schedule object
  const [rescheduleForm, setRescheduleForm] = useState({
    new_day: 'monday', new_start_time: '', new_end_time: '', new_room: '', reason: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    const timer = setInterval(() => setTimeOffset(getCurrentTimeOffset()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getDaySchedules = (day) => schedules.filter(s => s.day_of_week === day);

  // FIX Bug 3: useMemo now correctly depends on [schedules] so it re-renders on remote state change
  const buildGrid = (data) => {
    const grid = {};
    DAYS.forEach(day => { grid[day] = data.filter(s => s.day_of_week === day); });
    return grid;
  };

  const dayGrid = useMemo(() => buildGrid(schedules), [schedules]);

  const todayClasses = useMemo(() => 
    getDaySchedules(todayName).sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [schedules, todayName]
  );

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('reschedule/', {
        original_schedule: rescheduleModal.id,
        ...rescheduleForm
      });
      toast.success('Reschedule request submitted for review!');
      setRescheduleModal(null);
      fetchSchedules(); // Refresh to show pending status
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const getPageTitle = () => {
    if (user?.role === 'faculty') return 'My Teaching Schedule';
    if (user?.role === 'admin') return 'Master Campus Timetable';
    return 'Class Timetable';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Calendar size={13} style={{ color: 'var(--text-tertiary)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Modules</span>
          </div>
          <h1 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 26 }}>{getPageTitle()}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            {user?.role === 'faculty' ? 'Manage your assigned classes and slots' : 'Weekly distribution of theory & lab sessions'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {(user?.role === 'admin' || user?.role === 'student') && (
            <>
              <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: 4, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                {['A', 'B'].map(s => (
                  <button key={s} onClick={() => setSection(s)} style={{
                    padding: '7px 16px', borderRadius: 'var(--radius-md)',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                    background: section === s ? 'var(--gradient-hero)' : 'transparent',
                    color: section === s ? 'white' : 'var(--text-secondary)',
                  }}>
                    Section {s}
                  </button>
                ))}
              </div>

              <select
                className="oc-input"
                style={{ width: 'auto', paddingRight: 32 }}
                value={semester}
                onChange={e => setSemester(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
              </select>
            </>
          )}

          <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: 4, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
            <button onClick={() => setViewMode('grid')} title="Grid View" style={{
              padding: '7px 12px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              background: viewMode === 'grid' ? 'var(--accent-primary-glow)' : 'transparent',
              color: viewMode === 'grid' ? 'var(--accent-primary)' : 'var(--text-tertiary)',
            }}>
              <FiGrid size={15} />
            </button>
            <button onClick={() => setViewMode('list')} title="List View" style={{
              padding: '7px 12px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              background: viewMode === 'list' ? 'var(--accent-primary-glow)' : 'transparent',
              color: viewMode === 'list' ? 'var(--accent-primary)' : 'var(--text-tertiary)',
            }}>
              <FiList size={15} />
            </button>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <SkeletonTable rows={8} />
      ) : schedules.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No classes scheduled"
          message="The timetable for this section and semester has not been set up yet."
        />
      ) : viewMode === 'list' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            marginBottom: 8,
            padding: '10px 16px', borderRadius: 'var(--radius-md)',
            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
            fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'capitalize',
          }}>
            Today: {todayName || 'Weekend'}
          </div>
          {todayClasses.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
              No classes today.  Enjoy your free time!
            </div>
          ) : (
            todayClasses.map((cls, i) => {
              const color = getSubjectColor(cls.subject);
              return (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  style={{
                    background: 'var(--bg-secondary)', border: `1px solid ${color.border}`,
                    borderLeft: `4px solid ${color.text}`,
                    borderRadius: 'var(--radius-lg)', padding: '16px 20px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <p style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 700, fontSize: 14, color: color.text }}>
                        {cls.subject}
                      </p>
                      {cls.reschedule_status === 'pending' && (
                        <span style={{ fontSize: 10, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>PENDING RESCHEDULE</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <FiUser size={11} /> {cls.faculty_details?.username}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <FiMapPin size={11} /> {cls.room}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      fontFamily: '"JetBrains Mono"', fontSize: 13, fontWeight: 700, color: color.text,
                      background: color.bg, padding: '6px 14px', borderRadius: 99,
                      border: `1px solid ${color.border}`,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <FiClock size={12} />
                      {cls.start_time?.slice(0, 5)} – {cls.end_time?.slice(0, 5)}
                    </div>
                    {user?.role === 'faculty' && (
                      <button 
                        onClick={() => { setRescheduleModal(cls); setRescheduleForm({...rescheduleForm, new_day: cls.day_of_week, new_room: cls.room})}}
                        style={{ color: 'var(--text-tertiary)', cursor: 'pointer', background: 'none', border: 'none' }} title="Request Reschedule"
                      >
                        <FiRefreshCw size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 900 }}>
              {/* Day Headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '72px repeat(5, 1fr)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-tertiary)' }}>
                <div style={{ padding: '14px 10px' }} />
                {DAYS.map(day => {
                  const isToday = day === todayName;
                  return (
                    <div key={day} style={{
                      padding: '14px 10px', textAlign: 'center',
                      borderLeft: '1px solid var(--border-subtle)',
                    }}>
                      <p style={{
                        fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
                        color: isToday ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                      }}>
                        {day.slice(0, 3)}
                      </p>
                      {isToday && (
                        <span style={{
                          display: 'inline-block', marginTop: 4, width: 6, height: 6,
                          borderRadius: '50%', background: 'var(--accent-primary)',
                          boxShadow: '0 0 8px var(--accent-primary)',
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Time Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '72px repeat(5, 1fr)', position: 'relative' }}>
                <div>
                  {HOURS.map(hour => (
                    <div key={hour} style={{ height: HOUR_HEIGHT, borderBottom: '1px solid var(--border-subtle)', padding: '8px 10px', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: 10, fontFamily: '"JetBrains Mono"', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                        {hour}:00
                      </span>
                    </div>
                  ))}
                </div>

                {DAYS.map(day => {
                  const isToday = day === todayName;
                  const dayClasses = dayGrid[day] || [];
                  return (
                    <div key={day} style={{
                      position: 'relative', borderLeft: '1px solid var(--border-subtle)',
                      background: isToday ? 'rgba(99,102,241,0.02)' : 'transparent',
                    }}>
                      {HOURS.map(hour => (
                        <div key={hour} style={{ height: HOUR_HEIGHT, borderBottom: '1px solid rgba(255,255,255,0.03)' }} />
                      ))}

                      {isToday && timeOffset !== null && (
                        <div style={{
                          position: 'absolute', left: 0, right: 0, top: timeOffset,
                          height: 2, background: 'var(--accent-primary)', zIndex: 10,
                          boxShadow: '0 0 8px var(--accent-primary)',
                        }}>
                          <div style={{
                            position: 'absolute', left: -4, top: -3,
                            width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)',
                          }} />
                        </div>
                      )}

                      {dayClasses.map(cls => {
                        const startH = parseInt(cls.start_time.split(':')[0]);
                        const startM = parseInt(cls.start_time.split(':')[1]);
                        const endH   = parseInt(cls.end_time.split(':')[0]);
                        const endM   = parseInt(cls.end_time.split(':')[1]);
                        const top    = (startH - 9 + startM / 60) * HOUR_HEIGHT;
                        const height = (endH - startH + (endM - startM) / 60) * HOUR_HEIGHT;
                        const color  = getSubjectColor(cls.subject);
                        const parts  = cls.subject.split(':');
                        const code   = parts[0]?.trim();
                        const name   = parts[1]?.trim() || cls.subject;
                        const isPending = cls.reschedule_status === 'pending';

                        return (
                          <motion.div
                            key={cls.id}
                            whileHover={{ scale: 1.02, zIndex: 20, boxShadow: `0 8px 24px ${color.shadow}` }}
                            style={{
                              position: 'absolute', left: 4, right: 4, top, height: height - 4,
                              background: color.bg, border: `1px solid ${isPending ? '#f59e0b66' : color.border}`,
                              borderRadius: 8, padding: '8px 10px', overflow: 'hidden',
                              cursor: 'pointer', transition: 'box-shadow 0.2s',
                              borderLeft: `3px solid ${isPending ? '#f59e0b' : color.text}`,
                            }}
                          >
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <p style={{ fontFamily: '"JetBrains Mono"', fontSize: 9, fontWeight: 700, color: isPending ? '#f59e0b' : color.text, marginBottom: 2, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {code}
                              </p>
                              {isPending && <span title="Reschedule Pending" style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 6px #f59e0b' }} />}
                            </div>
                            {height > 40 && (
                              <p style={{ fontSize: 10, fontWeight: 700, color: isPending ? '#f59e0b' : color.text, lineHeight: 1.3, marginBottom: 4 }}>
                                {name}
                              </p>
                            )}
                            {height > 60 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <span style={{ fontSize: 9, color: color.text, opacity: 0.7, display: 'flex', alignItems: 'center', gap: 3 }}>
                                  <FiMapPin size={8} /> {cls.room}
                                </span>
                                {user?.role === 'faculty' && !isPending && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setRescheduleModal(cls); setRescheduleForm({...rescheduleForm, new_day: cls.day_of_week, new_room: cls.room})}}
                                    style={{ fontSize: 9, color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', fontWeight: 700, marginTop: 2 }}
                                  >
                                    Request Change
                                  </button>
                                )}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Reschedule Request Modal */}
      <AnimatePresence>
        {rescheduleModal && (
          <Modal open={!!rescheduleModal} onClose={() => setRescheduleModal(null)} title="Request Class Reschedule">
            <div style={{ marginBottom: 20, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8, borderLeft: '3px solid var(--accent-primary)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>Original Slot</p>
              <p style={{ fontSize: 13, fontWeight: 700 }}>{rescheduleModal.subject}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {rescheduleModal.day_of_week.toUpperCase()} | {rescheduleModal.start_time.slice(0, 5)} - {rescheduleModal.end_time.slice(0, 5)} | Room {rescheduleModal.room}
              </p>
            </div>
            
            <form onSubmit={handleRescheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>New Day</label>
                  <select required className="oc-input" value={rescheduleForm.new_day} onChange={e => setRescheduleForm({...rescheduleForm, new_day: e.target.value})}>
                    {DAYS.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>New Room</label>
                  <input required className="oc-input" value={rescheduleForm.new_room} onChange={e => setRescheduleForm({...rescheduleForm, new_room: e.target.value})} placeholder="e.g. 302" />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Start Time</label>
                  <input type="time" required className="oc-input" value={rescheduleForm.new_start_time} onChange={e => setRescheduleForm({...rescheduleForm, new_start_time: e.target.value})} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>End Time</label>
                  <input type="time" required className="oc-input" value={rescheduleForm.new_end_time} onChange={e => setRescheduleForm({...rescheduleForm, new_end_time: e.target.value})} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Reason for Change</label>
                <textarea required rows={3} className="oc-input" value={rescheduleForm.reason} onChange={e => setRescheduleForm({...rescheduleForm, reason: e.target.value})} placeholder="Why is this slot being moved?" style={{ resize: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
                <button type="button" onClick={() => setRescheduleModal(null)} className="oc-btn oc-btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={submitting} className="oc-btn oc-btn-primary" style={{ flex: 1 }}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TimetableView;
