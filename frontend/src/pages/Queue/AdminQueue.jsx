import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FiClock, FiCheckCircle, FiPlay, FiUsers, FiCalendar } from 'react-icons/fi';
import { MdPendingActions } from 'react-icons/md';

const SLOTS = [
  '09:00-10:00', '10:00-11:00', '11:00-12:00',
  '12:00-13:00', '14:00-15:00', '15:00-16:00',
];

const STATUS_META = {
  booked:      { label: 'Queued',      color: '#6366f1', bg: 'rgba(99,102,241,0.10)',  icon: FiClock },
  in_progress: { label: 'In Progress', color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', icon: FiPlay },
  completed:   { label: 'Done',        color: '#10b981', bg: 'rgba(16,185,129,0.10)',  icon: FiCheckCircle },
};

// ── Stat Card ─────────────────────────────────────
const StatCard = ({ icon: Icon, value, label, color, delay }) => {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let n = 0;
    const step = Math.ceil(value / 30);
    const t = setInterval(() => {
      n = Math.min(n + step, value);
      setDisplayed(n);
      if (n >= value) clearInterval(t);
    }, 20);
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
        border: `1px solid var(--border-subtle)`,
        borderLeft: `3px solid ${color}`,
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color,
        }}>
          <Icon size={18} />
        </div>
      </div>
      <div style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 32, color: 'var(--text-primary)', lineHeight: 1 }}>
        {displayed}
      </div>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 6 }}>
        {label}
      </p>
    </motion.div>
  );
};

// ── Booking Card ──────────────────────────────────
const BookingCard = ({ booking, onUpdate, index }) => {
  const meta = STATUS_META[booking.status] || STATUS_META.booked;
  const StatusIcon = meta.icon;
  const [updating, setUpdating] = useState(false);

  const handleAction = async (newStatus) => {
    setUpdating(true);
    try {
      await onUpdate(booking.id, newStatus);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 260, damping: 22 }}
      style={{
        padding: '16px 18px',
        borderRadius: 14,
        background: 'var(--bg-secondary)',
        border: `1px solid ${booking.status === 'in_progress' ? 'rgba(245,158,11,0.4)' : 'var(--border-subtle)'}`,
        boxShadow: booking.status === 'in_progress'
          ? '0 0 20px rgba(245,158,11,0.08), var(--shadow-md)'
          : 'var(--shadow-sm)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Status glow strip */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: meta.color, borderRadius: '14px 0 0 14px',
      }} />

      <div style={{ paddingLeft: 8 }}>
        {/* Token + status badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
              Token
            </p>
            <p style={{
              fontFamily: '"JetBrains Mono"', fontWeight: 800, fontSize: 20,
              color: meta.color, lineHeight: 1,
            }}>
              {booking.token_number}
            </p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 99,
            background: meta.bg,
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
            color: meta.color,
          }}>
            <StatusIcon size={10} />
            {meta.label}
          </div>
        </div>

        {/* Student info */}
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
          {booking.student?.username || '—'}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'capitalize', marginBottom: 14 }}>
          {booking.purpose?.replace(/_/g, ' ')}
        </p>

        {/* OTP chip */}
        {booking.status !== 'completed' && booking.status !== 'cancelled' && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 8,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            marginBottom: 14,
          }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>OTP</span>
            <span style={{ fontFamily: '"JetBrains Mono"', fontWeight: 700, fontSize: 13, letterSpacing: '0.15em', color: 'var(--text-primary)' }}>
              {booking.otp}
            </span>
          </div>
        )}

        {/* Action buttons */}
        {booking.status !== 'completed' && booking.status !== 'cancelled' && (
          <div style={{ display: 'flex', gap: 8 }}>
            {booking.status === 'booked' && (
              <button
                onClick={() => handleAction('in_progress')}
                disabled={updating}
                style={{
                  flex: 1, height: 32, borderRadius: 8,
                  background: 'rgba(245,158,11,0.12)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  color: '#f59e0b', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(245,158,11,0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(245,158,11,0.12)'}
              >
                <FiPlay size={11} /> Start
              </button>
            )}
            <button
              onClick={() => handleAction('completed')}
              disabled={updating}
              style={{
                flex: 1, height: 32, borderRadius: 8,
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.3)',
                color: '#10b981', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16,185,129,0.22)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(16,185,129,0.12)'}
            >
              <FiCheckCircle size={11} /> Done
            </button>
          </div>
        )}

        {booking.status === 'completed' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 10px', borderRadius: 8,
            background: 'rgba(16,185,129,0.08)',
          }}>
            <FiCheckCircle size={13} color="#10b981" />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#10b981' }}>Completed</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ── Slot Column ───────────────────────────────────
const SlotColumn = ({ slot, bookings, onUpdate }) => {
  const active = bookings.filter((b) => b.status === 'in_progress').length;
  const done = bookings.filter((b) => b.status === 'completed').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 24 }}
      style={{
        minWidth: 240, flex: '0 0 240px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
    >
      {/* Column header */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        boxShadow: 'var(--shadow-sm)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{
            fontFamily: '"JetBrains Mono"', fontWeight: 700, fontSize: 13,
            color: 'var(--text-primary)',
          }}>{slot}</p>
          <span style={{
            padding: '2px 8px', borderRadius: 99,
            background: bookings.length > 0 ? 'rgba(99,102,241,0.12)' : 'var(--bg-tertiary)',
            fontSize: 10, fontWeight: 700,
            color: bookings.length > 0 ? '#a78bfa' : 'var(--text-tertiary)',
          }}>
            {bookings.length}
          </span>
        </div>
        {bookings.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            {active > 0 && (
              <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>
                ● {active} active
              </span>
            )}
            {done > 0 && (
              <span style={{ fontSize: 10, color: '#10b981', fontWeight: 600 }}>
                ✓ {done} done
              </span>
            )}
          </div>
        )}
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 80 }}>
        <AnimatePresence mode="popLayout">
          {bookings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                padding: '24px 16px', textAlign: 'center',
                borderRadius: 12,
                border: '1px dashed var(--border-subtle)',
                color: 'var(--text-tertiary)', fontSize: 12,
              }}
            >
              No bookings
            </motion.div>
          ) : (
            bookings.map((b, i) => (
              <BookingCard key={b.id} booking={b} onUpdate={onUpdate} index={i} />
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ── Main Component ─────────────────────────────────
const AdminQueue = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const stats = {
    total: bookings.length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    pending: bookings.filter((b) => b.status === 'booked' || b.status === 'in_progress').length,
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get(`queue/?date=${date}`);
      setBookings(res.data);
    } catch {
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, [date]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`queue/${id}/`, { status });
      toast.success(`Marked as ${status.replace('_', ' ')}`);
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
    } catch {
      toast.error('Failed to update status');
    }
  };

  const groupedBySlot = bookings.reduce((acc, b) => {
    if (!acc[b.time_slot]) acc[b.time_slot] = [];
    acc[b.time_slot].push(b);
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 26, color: 'var(--text-primary)', marginBottom: 6 }}>
            Queue Management
          </h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>Monitor and process today's tokens in real-time</p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 16px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12, boxShadow: 'var(--shadow-sm)',
        }}>
          <FiCalendar size={15} color="var(--text-tertiary)" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: 14, fontFamily: '"JetBrains Mono"',
              cursor: 'pointer',
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <StatCard icon={FiUsers}         value={stats.total}     label="Total Bookings" color="#6366f1" delay={0} />
        <StatCard icon={FiCheckCircle}   value={stats.completed} label="Completed"      color="#10b981" delay={0.07} />
        <StatCard icon={MdPendingActions} value={stats.pending}   label="Pending"        color="#f59e0b" delay={0.14} />
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 12 }}>
          {SLOTS.map((s) => (
            <div key={s} style={{
              minWidth: 240, height: 200, borderRadius: 14,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      ) : (
        <motion.div
          layout
          style={{
            display: 'flex', gap: 16,
            overflowX: 'auto',
            paddingBottom: 16,
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.1) transparent',
          }}
        >
          {SLOTS.map((slot) => (
            <SlotColumn
              key={slot}
              slot={slot}
              bookings={groupedBySlot[slot] || []}
              onUpdate={updateStatus}
            />
          ))}
        </motion.div>
      )}

      {/* Legend */}
      <div style={{
        display: 'flex', gap: 20, flexWrap: 'wrap',
        padding: '12px 20px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 4 }}>Legend:</span>
        {Object.entries(STATUS_META).map(([key, m]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminQueue;
