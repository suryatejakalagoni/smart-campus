import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageWrapper } from '../components/motion';
import { CalendarDays, BookOpen, Trophy, Coffee, Zap, Flag } from 'lucide-react';

const EVENT_TYPES = {
  exam:      { label: 'Exam',         color: '#ef4444', bg: 'rgba(239,68,68,0.10)',    icon: BookOpen },
  holiday:   { label: 'Holiday',      color: '#10b981', bg: 'rgba(16,185,129,0.10)',   icon: Coffee },
  event:     { label: 'Event',        color: '#6366f1', bg: 'rgba(99,102,241,0.10)',   icon: Zap },
  deadline:  { label: 'Deadline',     color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',   icon: Flag },
  result:    { label: 'Result',       color: '#a78bfa', bg: 'rgba(167,139,250,0.10)',  icon: Trophy },
};

const CALENDAR_EVENTS = [
  { date: '2026-04-18', title: 'Mid-Semester Exam — CSE Core',          type: 'exam',     note: 'Halls A & B, 9 AM' },
  { date: '2026-04-19', title: 'Mid-Semester Exam — ECE Core',          type: 'exam',     note: 'Hall C, 9 AM' },
  { date: '2026-04-21', title: 'Campus Tech Fest — Innovate 2026',       type: 'event',    note: 'All day' },
  { date: '2026-04-23', title: 'Project Submission Deadline',            type: 'deadline', note: 'End of day' },
  { date: '2026-05-01', title: 'Labour Day — Public Holiday',            type: 'holiday',  note: 'No classes' },
  { date: '2026-05-05', title: 'Internal Assessment Results Published',  type: 'result',   note: 'Check portal' },
  { date: '2026-05-12', title: 'End-Semester Exam Schedule Released',    type: 'deadline', note: 'Check notice board' },
  { date: '2026-05-20', title: 'End-Semester Examinations Begin',        type: 'exam',     note: 'All departments' },
  { date: '2026-06-10', title: 'End-Semester Examinations End',          type: 'exam',     note: 'All departments' },
  { date: '2026-06-15', title: 'Results Declaration',                    type: 'result',   note: 'Official portal' },
  { date: '2026-06-20', title: 'Summer Recess Begins',                   type: 'holiday',  note: '6 weeks' },
  { date: '2026-07-20', title: 'New Semester Registration Opens',        type: 'event',    note: 'Online portal' },
];

const FILTER_TYPES = ['all', ...Object.keys(EVENT_TYPES)];

const AcademicCalendar = () => {
  const [filter, setFilter] = useState('all');
  const today = new Date().toISOString().split('T')[0];

  const filtered = CALENDAR_EVENTS
    .filter((e) => filter === 'all' || e.type === filter)
    .sort((a, b) => a.date.localeCompare(b.date));

  const upcoming = filtered.filter((e) => e.date >= today);
  const past = filtered.filter((e) => e.date < today);

  const formatDate = (d) => {
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const daysUntil = (d) => {
    const diff = Math.ceil((new Date(d + 'T00:00:00') - new Date()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff > 0) return `In ${diff} days`;
    return `${Math.abs(diff)}d ago`;
  };

  const EventRow = ({ event, index, isPast }) => {
    const meta = EVENT_TYPES[event.type];
    const Icon = meta.icon;
    const isToday = event.date === today;

    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.04 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '14px 18px', borderRadius: 12,
          background: isToday ? `${meta.color}08` : 'var(--bg-secondary)',
          border: `1px solid ${isToday ? meta.color + '40' : 'var(--border-subtle)'}`,
          opacity: isPast ? 0.55 : 1,
          transition: 'all 0.2s',
        }}
        whileHover={{ scale: 1.005 }}
      >
        {/* Type icon */}
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: meta.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: meta.color,
        }}>
          <Icon size={17} />
        </div>

        {/* Main content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <p style={{
            fontSize: 14, fontWeight: 600, color: isPast ? 'var(--text-secondary)' : 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            marginBottom: 3,
          }}>
            {event.title}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              {formatDate(event.date)}
            </span>
            {event.note && (
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', opacity: 0.7 }}>
                · {event.note}
              </span>
            )}
          </div>
        </div>

        {/* Days badge */}
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <span style={{
            display: 'inline-block',
            padding: '3px 10px', borderRadius: 99,
            fontSize: 11, fontWeight: 700,
            background: isToday ? meta.color : (isPast ? 'var(--bg-tertiary)' : meta.bg),
            color: isToday ? 'white' : (isPast ? 'var(--text-tertiary)' : meta.color),
          }}>
            {daysUntil(event.date)}
          </span>
        </div>

        {/* Type badge */}
        <div style={{ flexShrink: 0 }}>
          <span style={{
            display: 'inline-block',
            padding: '3px 10px', borderRadius: 99,
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
            background: meta.bg, color: meta.color,
          }}>
            {meta.label}
          </span>
        </div>
      </motion.div>
    );
  };

  return (
    <PageWrapper>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <CalendarDays size={13} style={{ color: 'var(--text-tertiary)' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Academic Year 2025–26
          </span>
        </div>
        <h1 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 26, marginBottom: 6 }}>
          Academic Calendar
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Key dates, exams, and events for the academic year
        </p>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {FILTER_TYPES.map((t) => {
          const meta = t !== 'all' ? EVENT_TYPES[t] : { color: '#6366f1', bg: 'rgba(99,102,241,0.10)', label: 'All' };
          const isActive = filter === t;
          return (
            <button
              key={t}
              onClick={() => setFilter(t)}
              style={{
                padding: '7px 14px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                cursor: 'pointer', border: '1px solid', transition: 'all 0.18s',
                textTransform: 'capitalize',
                borderColor: isActive ? meta.color : 'var(--border-subtle)',
                background: isActive ? meta.bg : 'transparent',
                color: isActive ? meta.color : 'var(--text-secondary)',
              }}
            >
              {t === 'all' ? 'All Events' : meta.label}
            </button>
          );
        })}
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <p style={{
            fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
          }}>Upcoming ({upcoming.length})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcoming.map((e, i) => <EventRow key={e.date + e.title} event={e} index={i} isPast={false} />)}
          </div>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div>
          <p style={{
            fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
          }}>Past Events</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...past].reverse().map((e, i) => <EventRow key={e.date + e.title} event={e} index={i} isPast={true} />)}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '48px 20px',
          background: 'var(--bg-secondary)', border: '1px dashed var(--border-subtle)', borderRadius: 16,
        }}>
          <CalendarDays size={32} style={{ margin: '0 auto 12px', opacity: 0.25 }} />
          <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No events for this filter</p>
        </div>
      )}
    </PageWrapper>
  );
};

export default AcademicCalendar;
