import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { PageWrapper } from '../../components/motion';
import { SkeletonTable, Modal } from '../../components/ui';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import { Plus, FileText, Calendar, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

// ── Status Badge with pulsing dot for pending ────
const StatusPill = ({ status }) => {
  const cfg = {
    pending:  { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.25)', dot: true,  label: 'Pending' },
    approved: { bg: 'rgba(16,185,129,0.12)',  color: '#10b981', border: 'rgba(16,185,129,0.25)', dot: false, label: 'Approved' },
    rejected: { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', border: 'rgba(239,68,68,0.25)',  dot: false, label: 'Rejected' },
  }[status] || {};

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 12px', borderRadius: 99,
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`,
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: cfg.color, display: 'inline-block', flexShrink: 0,
        animation: cfg.dot ? 'badge-pulse 2s ease infinite' : 'none',
      }} />
      {cfg.label}
    </span>
  );
};

// ── Leave Type Chips ──────────────────────────────
const LEAVE_TYPES = [
  { value: 'sick',     label: 'Medical' },
  { value: 'personal', label: 'Personal' },
  { value: 'academic', label: 'Academic' },
  { value: 'other',    label: 'Other' },
];

const StudentLeaves = () => {
  const [leaves, setLeaves]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModal]     = useState(false);
  const [submitting, setSub]      = useState(false);
  const [filter, setFilter]       = useState('all');
  const [expandedId, setExpanded] = useState(null);
  const [form, setForm]           = useState({ leave_type: 'sick', start_date: '', end_date: '', reason: '' });

  useEffect(() => {
    document.title = 'Leave Management | Smart Campus';
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const r = await api.get('leaves/');
      setLeaves(r.data);
    } catch { toast.error('Failed to load leave requests'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.reason.length < 20) {
      toast.error('Reason must be at least 20 characters');
      return;
    }
    setSub(true);
    try {
      await api.post('leaves/', form);
      toast.success('Leave request submitted successfully!');
      setModal(false);
      setForm({ leave_type: 'sick', start_date: '', end_date: '', reason: '' });
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.non_field_errors?.[0] || 'Submission failed. Check all fields.');
    } finally { setSub(false); }
  };

  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);

  return (
    <PageWrapper>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <PageHeader
          moduleName="Modules"
          title="Leave Management"
          subtitle="Track and manage your absence applications"
        />
        <motion.button
          className="oc-btn oc-btn-primary"
          onClick={() => setModal(true)}
          whileTap={{ scale: 0.97 }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}
        >
          <Plus size={16} /> Apply for Leave
        </motion.button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'pending', 'approved', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '7px 16px', borderRadius: 99,
              border: '1px solid',
              borderColor: filter === f ? 'var(--accent-primary)' : 'var(--border-subtle)',
              background: filter === f ? 'var(--accent-primary-glow)' : 'transparent',
              color: filter === f ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize',
              transition: 'all 0.2s',
            }}
          >
            {f}
            {f !== 'all' && (
              <span style={{ marginLeft: 6, opacity: 0.7 }}>
                ({leaves.filter(l => l.status === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No leave requests"
          message={filter === 'all' ? "You haven't submitted any leaves yet. Use the button above to apply." : `No ${filter} leave requests found.`}
          actionLabel="Apply for Leave"
          onAction={() => setModal(true)}
        />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="oc-table-wrapper">
          <table className="oc-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Reason</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((leave, i) => {
                const isExpanded = expandedId === leave.id;
                return (
                  <React.Fragment key={leave.id}>
                    <motion.tr
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setExpanded(isExpanded ? null : leave.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 700, textTransform: 'capitalize' }}>
                        {LEAVE_TYPES.find(t => t.value === leave.leave_type)?.label || leave.leave_type}
                      </td>
                      <td style={{ fontFamily: '"JetBrains Mono"', fontSize: 12, color: 'var(--text-secondary)' }}>
                        {leave.start_date} → {leave.end_date}
                      </td>
                      <td><StatusPill status={leave.status} /></td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: 13 }}>
                        {leave.reason}
                      </td>
                      <td>
                        {isExpanded
                          ? <ChevronUp size={15} style={{ color: 'var(--text-tertiary)' }} />
                          : <ChevronDown size={15} style={{ color: 'var(--text-tertiary)' }} />}
                      </td>
                    </motion.tr>
                    {isExpanded && (
                      <motion.tr
                        key={`expand-${leave.id}`}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      >
                        <td colSpan={5} style={{ padding: 0 }}>
                          <div style={{
                            background: 'var(--bg-tertiary)',
                            borderTop: '1px solid var(--border-subtle)',
                            padding: '16px 20px', fontSize: 13,
                          }}>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 10 }}>
                              <strong style={{ color: 'var(--text-primary)' }}>Reason:</strong> {leave.reason}
                            </p>
                            {leave.admin_remarks && (
                              <div style={{
                                display: 'flex', alignItems: 'flex-start', gap: 10,
                                background: leave.status === 'rejected'
                                  ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)',
                                border: `1px solid ${leave.status === 'rejected' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
                                borderRadius: 8, padding: '10px 14px',
                              }}>
                                <AlertCircle size={14} style={{
                                  color: leave.status === 'rejected' ? '#ef4444' : '#10b981',
                                  flexShrink: 0, marginTop: 1,
                                }} />
                                <p style={{ color: 'var(--text-secondary)' }}>
                                  <strong>Admin Remark:</strong> {leave.admin_remarks}
                                </p>
                              </div>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Apply Leave Modal */}
      <AnimatePresence>
        {modalOpen && (
          <Modal open={modalOpen} onClose={() => setModal(false)} title="Apply for Leave">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Leave Type Chips */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 10 }}>
                  Leave Type
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {LEAVE_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm({ ...form, leave_type: t.value })}
                      style={{
                        padding: '8px 18px', borderRadius: 99,
                        border: '1.5px solid',
                        borderColor: form.leave_type === t.value ? 'var(--accent-primary)' : 'var(--border-subtle)',
                        background: form.leave_type === t.value ? 'var(--accent-primary-glow)' : 'transparent',
                        color: form.leave_type === t.value ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date pickers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Start Date</label>
                  <input type="date" required className="oc-input" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>End Date</label>
                  <input type="date" required className="oc-input" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>

              {/* Reason with character counter */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Reason</label>
                  <span style={{
                    fontSize: 11, fontFamily: '"JetBrains Mono"',
                    color: form.reason.length < 20 ? 'var(--warning)' : form.reason.length > 450 ? 'var(--danger)' : 'var(--text-tertiary)',
                  }}>
                    {form.reason.length}/500
                  </span>
                </div>
                <textarea
                  required rows={4} className="oc-input"
                  placeholder="Briefly describe your reason (minimum 20 characters)..."
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value.slice(0, 500) })}
                  style={{ resize: 'none' }}
                />
                {form.reason.length > 0 && form.reason.length < 20 && (
                  <p style={{ fontSize: 11, color: 'var(--warning)', marginTop: 4 }}>
                    {20 - form.reason.length} more characters required
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 4 }}>
                <button type="button" onClick={() => setModal(false)} className="oc-btn oc-btn-secondary">Cancel</button>
                <motion.button type="submit" disabled={submitting} className="oc-btn oc-btn-primary" whileTap={{ scale: 0.97 }}>
                  {submitting ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                      Submitting...
                    </span>
                  ) : 'Submit Request'}
                </motion.button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};

export default StudentLeaves;
