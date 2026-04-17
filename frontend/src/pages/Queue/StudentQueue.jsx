import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FiPlus, FiClock, FiCheckCircle, FiShield, FiXCircle, FiCalendar, FiGrid } from 'react-icons/fi';
import { MdQrCode2 } from 'react-icons/md';
import Badge from '../../components/common/Badge';
import { SkeletonTable } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Spinner';

const SLOT_HOURS = [
  { slot: '09:00-10:00', label: '9 AM', hour: 9 },
  { slot: '10:00-11:00', label: '10 AM', hour: 10 },
  { slot: '11:00-12:00', label: '11 AM', hour: 11 },
  { slot: '12:00-13:00', label: '12 PM', hour: 12 },
  { slot: '14:00-15:00', label: '2 PM', hour: 14 },
  { slot: '15:00-16:00', label: '3 PM', hour: 15 },
];

const PURPOSE_LABELS = {
  certificate_collection: 'Certificate Collection',
  document_submission: 'Document Submission',
  fee_related: 'Fee Related',
  transcript_request: 'Transcript Request',
  other: 'Other',
};

// ── QR placeholder SVG ─────────────────────────────
const QrPlaceholder = ({ token }) => (
  <div style={{
    width: 120, height: 120, borderRadius: 12,
    background: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', overflow: 'hidden',
    boxShadow: '0 0 0 4px rgba(99,102,241,0.2)',
  }}>
    <MdQrCode2 size={96} color="#1e1b4b" />
    <div style={{
      position: 'absolute', inset: 0,
      background: 'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(99,102,241,0.05) 6px, rgba(99,102,241,0.05) 7px)',
    }} />
    <div style={{
      position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center',
      fontSize: 8, fontFamily: '"JetBrains Mono"', fontWeight: 700, color: '#6366f1',
      letterSpacing: '0.1em',
    }}>{token}</div>
  </div>
);

// ── Booking Success Modal ──────────────────────────
const SuccessModal = ({ booking, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0, y: 40 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 20 }}
      transition={{ type: 'spring', damping: 18, stiffness: 280 }}
      onClick={(e) => e.stopPropagation()}
      style={{
        width: '100%', maxWidth: 520,
        background: 'var(--bg-secondary)',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 60px rgba(99,102,241,0.15)',
      }}
    >
      {/* Header glow strip */}
      <div style={{
        height: 4,
        background: 'linear-gradient(90deg, #6366f1, #a78bfa, #10b981)',
      }} />

      <div style={{ padding: '32px 32px 28px' }}>
        {/* Status icon */}
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
          style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(16,185,129,0.12)',
            border: '2px solid rgba(16,185,129,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20, color: '#10b981',
          }}
        >
          <FiCheckCircle size={26} />
        </motion.div>

        <h2 style={{
          fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 24,
          color: 'var(--text-primary)', marginBottom: 6,
        }}>Booking Confirmed</h2>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 14, marginBottom: 28 }}>
          Present your token number and OTP at the campus office.
        </p>

        {/* Token + QR row */}
        <div style={{
          display: 'flex', gap: 24, alignItems: 'center',
          padding: 20, borderRadius: 16,
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-subtle)',
          marginBottom: 20,
        }}>
          <QrPlaceholder token={booking.token_number} />

          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                Token Number
              </p>
              <p style={{
                fontFamily: '"JetBrains Mono"', fontWeight: 800, fontSize: 36,
                color: '#6366f1', letterSpacing: '0.05em', lineHeight: 1,
              }}>
                {booking.token_number}
              </p>
            </div>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '10px 16px', borderRadius: 10,
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.2)',
            }}>
              <FiShield size={14} color="#a78bfa" />
              <div>
                <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>OTP</p>
                <p style={{ fontFamily: '"JetBrains Mono"', fontWeight: 700, fontSize: 20, color: 'white', letterSpacing: '0.2em' }}>
                  {booking.otp}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Date', value: booking.preferred_date },
            { label: 'Time Slot', value: booking.time_slot },
            { label: 'Purpose', value: PURPOSE_LABELS[booking.purpose] || booking.purpose },
            { label: 'Status', value: booking.status?.toUpperCase() },
          ].map(({ label, value }) => (
            <div key={label} style={{
              padding: '12px 14px', borderRadius: 10,
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%', height: 44,
            background: 'var(--gradient-hero)',
            border: 'none', borderRadius: 10,
            fontFamily: '"Plus Jakarta Sans"', fontWeight: 700, fontSize: 14,
            color: 'white', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          Done
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// ── Time Grid Slot Card ───────────────────────────
const SlotCard = ({ slotInfo, selected, onSelect }) => {
  const isFull = slotInfo.remaining === 0;
  const fillPercent = slotInfo ? Math.round(((10 - slotInfo.remaining) / 10) * 100) : 0;

  return (
    <motion.button
      type="button"
      disabled={isFull}
      onClick={() => !isFull && onSelect(slotInfo.slot)}
      whileHover={!isFull ? { scale: 1.02 } : {}}
      whileTap={!isFull ? { scale: 0.98 } : {}}
      style={{
        padding: '14px 16px', borderRadius: 14,
        border: `1px solid ${selected ? '#6366f1' : isFull ? 'var(--border-subtle)' : 'var(--border-hover)'}`,
        background: selected
          ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(167,139,250,0.1))'
          : isFull
            ? 'rgba(255,255,255,0.02)'
            : 'var(--bg-tertiary)',
        cursor: isFull ? 'not-allowed' : 'pointer',
        opacity: isFull ? 0.45 : 1,
        textAlign: 'left',
        boxShadow: selected ? '0 0 0 1px #6366f1, 0 4px 16px rgba(99,102,241,0.2)' : 'none',
        transition: 'all 0.2s',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {selected && (
        <motion.div
          layoutId="slot-highlight"
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(99,102,241,0.06)',
            borderRadius: 14,
          }}
        />
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <p style={{
          fontFamily: '"JetBrains Mono"', fontWeight: 700, fontSize: 13,
          color: selected ? '#a78bfa' : isFull ? 'var(--text-tertiary)' : 'var(--text-primary)',
          marginBottom: 6,
        }}>
          {slotInfo.slot}
        </p>

        {/* Fill bar */}
        <div style={{
          height: 3, borderRadius: 99,
          background: 'var(--bg-secondary)',
          marginBottom: 6, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 99,
            width: `${fillPercent}%`,
            background: fillPercent > 70 ? '#ef4444' : fillPercent > 40 ? '#f59e0b' : '#10b981',
            transition: 'width 0.4s ease',
          }} />
        </div>

        <p style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
          color: isFull ? '#ef4444' : selected ? '#10b981' : 'var(--text-tertiary)',
        }}>
          {isFull ? 'Full' : `${slotInfo.remaining} slots left`}
        </p>
      </div>
    </motion.button>
  );
};

// ── Main Component ─────────────────────────────────
const StudentQueue = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);
  const [formData, setFormData] = useState({
    purpose: 'certificate_collection',
    description: '',
    time_slot: '',
  });
  const [lastBooking, setLastBooking] = useState(null);

  const fetchBookings = async () => {
    try {
      const res = await api.get('queue/');
      setBookings(res.data);
    } catch {
      toast.error('Failed to load your bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async () => {
    try {
      const res = await api.get(`queue/slots/?date=${date}`);
      setSlots(res.data);
    } catch {
      toast.error('Failed to fetch available slots');
    }
  };

  useEffect(() => { fetchBookings(); }, []);
  useEffect(() => { if (date) fetchSlots(); }, [date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.time_slot) { toast.error('Please select a time slot'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('queue/', { ...formData, preferred_date: date });
      setLastBooking(res.data);
      setShowModal(false);
      setShowSuccess(true);
      fetchBookings();
      fetchSlots();
      setFormData({ purpose: 'certificate_collection', description: '', time_slot: '' });
    } catch (err) {
      toast.error(err.response?.data?.non_field_errors?.[0] || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = { booked: '#6366f1', in_progress: '#f59e0b', completed: '#10b981', cancelled: '#ef4444' };

  return (
    <div className="space-y-8 animate-in">
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 26, color: 'var(--text-primary)', marginBottom: 6 }}>
            Queue Booking
          </h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>Schedule document submissions and collections</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px',
            background: 'var(--gradient-hero)',
            border: 'none', borderRadius: 10,
            fontFamily: '"Plus Jakarta Sans"', fontWeight: 700, fontSize: 14,
            color: 'white', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
          }}
        >
          <FiPlus size={18} />
          Book Appointment
        </motion.button>
      </div>

      {/* ── Bookings Table ── */}
      {loading ? (
        <SkeletonTable rows={5} />
      ) : bookings.length === 0 ? (
        <EmptyState
          message="No bookings yet"
          description="Avoid the rush by scheduling your visit in advance."
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {['Token', 'Purpose', 'Date & Slot', 'Status', 'OTP'].map((h) => (
                    <th key={h} style={{
                      padding: '14px 20px', textAlign: 'left',
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.08em', color: 'var(--text-tertiary)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, i) => (
                  <motion.tr
                    key={b.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-glass)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        fontFamily: '"JetBrains Mono"', fontWeight: 700, fontSize: 15,
                        color: statusColor[b.status] || '#6366f1',
                      }}>{b.token_number}</span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                      {(PURPOSE_LABELS[b.purpose] || b.purpose)}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiClock size={13} color="var(--text-tertiary)" />
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: '"JetBrains Mono"' }}>
                          {b.preferred_date} · {b.time_slot}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <Badge status={b.status} />
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {(b.status === 'booked' || b.status === 'in_progress') ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FiShield size={13} color="#a78bfa" />
                          <span style={{
                            fontFamily: '"JetBrains Mono"', fontWeight: 700,
                            fontSize: 15, letterSpacing: '0.15em', color: 'var(--text-primary)',
                          }}>{b.otp}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>—</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ── Booking Modal ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 640,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-hover)',
                borderRadius: 20, overflow: 'hidden',
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              {/* Modal top bar */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <h2 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 18, color: 'var(--text-primary)', marginBottom: 2 }}>
                    New Appointment
                  </h2>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Select a slot and fill in your visit details</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    width: 34, height: 34, borderRadius: 8, border: 'none',
                    background: 'var(--bg-tertiary)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-tertiary)', fontSize: 18,
                  }}
                >×</button>
              </div>

              <div style={{ padding: 24, maxHeight: '80vh', overflowY: 'auto' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Purpose + Date row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
                        Purpose of Visit
                      </label>
                      <select
                        className="oc-input"
                        value={formData.purpose}
                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                      >
                        {Object.entries(PURPOSE_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
                        <FiCalendar size={11} style={{ display: 'inline', marginRight: 4 }} />Select Date
                      </label>
                      <input
                        type="date"
                        className="oc-input"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={date}
                        onChange={(e) => { setDate(e.target.value); setFormData({ ...formData, time_slot: '' }); }}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
                      Description
                    </label>
                    <textarea
                      rows={2}
                      required
                      className="oc-input"
                      style={{ resize: 'none' }}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="What specifically do you need help with?"
                    />
                  </div>

                  {/* Time Grid */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 12 }}>
                      <FiGrid size={11} style={{ display: 'inline', marginRight: 4 }} />Available Slots — {date}
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                      {slots.length > 0 ? slots.map((s) => (
                        <SlotCard
                          key={s.slot}
                          slotInfo={s}
                          selected={formData.time_slot === s.slot}
                          onSelect={(slot) => setFormData({ ...formData, time_slot: slot })}
                        />
                      )) : SLOT_HOURS.map((h) => (
                        <div key={h.slot} style={{
                          padding: '14px 16px', borderRadius: 14,
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-tertiary)', opacity: 0.5,
                        }}>
                          <p style={{ fontFamily: '"JetBrains Mono"', fontSize: 13, color: 'var(--text-tertiary)' }}>{h.slot}</p>
                          <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>Loading…</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      style={{
                        flex: 1, height: 44, borderRadius: 10,
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)', fontWeight: 600, fontSize: 14,
                        cursor: 'pointer',
                      }}
                    >Cancel</button>
                    <button
                      type="submit"
                      disabled={!formData.time_slot || submitting}
                      style={{
                        flex: 2, height: 44, borderRadius: 10,
                        background: formData.time_slot ? 'var(--gradient-hero)' : 'var(--bg-tertiary)',
                        border: 'none',
                        color: formData.time_slot ? 'white' : 'var(--text-tertiary)',
                        fontFamily: '"Plus Jakarta Sans"', fontWeight: 700, fontSize: 14,
                        cursor: formData.time_slot ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        boxShadow: formData.time_slot ? '0 4px 16px rgba(99,102,241,0.35)' : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      {submitting ? <Spinner /> : 'Register for Queue'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Success Modal ── */}
      <AnimatePresence>
        {showSuccess && lastBooking && (
          <SuccessModal booking={lastBooking} onClose={() => setShowSuccess(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentQueue;
