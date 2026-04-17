import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { PageWrapper } from '../../components/motion';
import { SkeletonTable, Modal } from '../../components/ui';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import { CheckCircle, XCircle, Eye, FileText, User, Calendar, ChevronDown } from 'lucide-react';

const StatusPill = ({ status }) => {
  const cfg = {
    pending:  { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', border: 'rgba(245,158,11,0.25)', label: 'Pending',  dot: true },
    approved: { bg: 'rgba(16,185,129,0.12)',  color: '#10b981', border: 'rgba(16,185,129,0.25)', label: 'Approved', dot: false },
    rejected: { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', border: 'rgba(239,68,68,0.25)',  label: 'Rejected', dot: false },
  }[status] || {};
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 12px', borderRadius: 99,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: cfg.color,
        animation: cfg.dot ? 'badge-pulse 2s ease infinite' : 'none',
      }} />
      {cfg.label}
    </span>
  );
};

const AdminLeaves = () => {
  const [leaves, setLeaves]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [remarks, setRemarks]   = useState('');
  const [submitting, setSub]    = useState(false);
  const [filter, setFilter]     = useState('pending');
  const [rejectConfirm, setRejectConfirm] = useState(false);

  useEffect(() => {
    document.title = 'Leave Review Center | Smart Campus';
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const r = await api.get('leaves/');
      setLeaves(r.data);
    } catch { toast.error('Failed to load leaves'); }
    finally { setLoading(false); }
  };

  const handleReview = async (status) => {
    setSub(true);
    try {
      await api.patch(`leaves/${selected.id}/review/`, { status, admin_remarks: remarks });
      toast.success(`Leave request ${status} successfully!`);
      setSelected(null);
      setRejectConfirm(false);
      fetchLeaves();
    } catch { toast.error('Action failed. Please try again.'); }
    finally { setSub(false); }
  };

  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);
  const pendingCount = leaves.filter(l => l.status === 'pending').length;

  return (
    <PageWrapper>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <PageHeader
          moduleName="Admin"
          title="Leave Review Center"
          subtitle="Review and respond to student leave applications"
        />
        {pendingCount > 0 && (
          <div style={{
            padding: '8px 16px', borderRadius: 99,
            background: 'rgba(245,158,11,0.12)', color: '#f59e0b',
            border: '1px solid rgba(245,158,11,0.25)', marginBottom: 28,
            fontSize: 13, fontWeight: 700,
          }}>
            {pendingCount} pending {pendingCount === 1 ? 'review' : 'reviews'}
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {['all', 'pending', 'approved', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '7px 16px', borderRadius: 99, border: '1px solid',
              borderColor: filter === f ? 'var(--accent-primary)' : 'var(--border-subtle)',
              background: filter === f ? 'var(--accent-primary-glow)' : 'transparent',
              color: filter === f ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s',
            }}
          >
            {f} ({leaves.filter(l => f === 'all' || l.status === f).length})
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonTable rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No leave requests"
          message={filter === 'pending' ? 'All caught up! No pending reviews at the moment.' : `No ${filter} requests found.`}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((leave, i) => (
            <motion.div
              key={leave.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{
                background: 'var(--bg-secondary)',
                border: `1px solid ${leave.status === 'pending' ? 'rgba(245,158,11,0.2)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '20px 24px',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                {/* Left: Student info */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--gradient-hero)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 800, color: 'white',
                  }}>
                    {leave.student?.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15, fontFamily: '"Plus Jakarta Sans"' }}>
                      {leave.student?.username}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      {leave.student?.department || '—'} · Roll: {leave.student?.roll_number || '—'}
                    </p>
                    <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 99,
                        background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
                        fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
                        border: '1px solid var(--border-subtle)',
                      }}>
                        {leave.leave_type} Leave
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: '"JetBrains Mono"', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={11} />
                        {leave.start_date} → {leave.end_date}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Status + Action */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                  <StatusPill status={leave.status} />
                  {leave.status === 'pending' && (
                    <button
                      onClick={() => { setSelected(leave); setRemarks(''); setRejectConfirm(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', borderRadius: 'var(--radius-md)',
                        background: 'var(--accent-primary-glow)', color: 'var(--accent-primary)',
                        border: '1px solid rgba(99,102,241,0.25)',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      <Eye size={13} /> Review
                    </button>
                  )}
                </div>
              </div>

              {/* Reason preview */}
              <div style={{
                marginTop: 16, padding: '12px 14px',
                background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
                borderLeft: '3px solid var(--border-hover)',
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Reason</p>
                {leave.reason}
              </div>

              {leave.admin_remarks && (
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 700 }}>Remark:</span> {leave.admin_remarks}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <AnimatePresence>
        {selected && (
          <Modal open={!!selected} onClose={() => { setSelected(null); setRejectConfirm(false); }} title="Review Leave Request">
            <div style={{
              padding: '16px', background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)', marginBottom: 20, fontSize: 13, lineHeight: 1.8,
              borderLeft: '3px solid var(--accent-primary)',
            }}>
              <p><span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Student:</span> {selected.student?.username}</p>
              <p><span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Type:</span> {selected.leave_type} leave</p>
              <p><span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Period:</span> {selected.start_date} → {selected.end_date}</p>
              <p style={{ marginTop: 10, color: 'var(--text-secondary)' }}>{selected.reason}</p>
            </div>

            {rejectConfirm ? (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
                    Rejection Reason (required)
                  </label>
                  <textarea
                    rows={3} className="oc-input" required
                    placeholder="Provide a reason for rejection..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    style={{ resize: 'none' }}
                    autoFocus
                  />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setRejectConfirm(false)} className="oc-btn oc-btn-secondary" style={{ flex: 1 }}>
                    Back
                  </button>
                  <motion.button
                    onClick={() => handleReview('rejected')} disabled={submitting || !remarks.trim()}
                    className="oc-btn oc-btn-danger" whileTap={{ scale: 0.97 }}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    {submitting ? <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ef4444', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> : <><XCircle size={15} /> Confirm Reject</>}
                  </motion.button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Admin Remarks (optional for approval)</label>
                  <textarea
                    rows={3} className="oc-input"
                    placeholder="Optional notes for the student..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    style={{ resize: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <motion.button
                    onClick={() => setRejectConfirm(true)} disabled={submitting}
                    className="oc-btn oc-btn-danger" whileTap={{ scale: 0.97 }}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <XCircle size={15} /> Reject
                  </motion.button>
                  <motion.button
                    onClick={() => handleReview('approved')} disabled={submitting}
                    className="oc-btn oc-btn-primary" whileTap={{ scale: 0.97 }}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    {submitting ? <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> : <><CheckCircle size={15} /> Approve</>}
                  </motion.button>
                </div>
              </div>
            )}
          </Modal>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};

export default AdminLeaves;
