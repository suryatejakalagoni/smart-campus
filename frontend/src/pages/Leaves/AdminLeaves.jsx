import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { PageWrapper } from '../../components/motion';
import { StatusBadge, SkeletonTable, EmptyState, Modal } from '../../components/ui';
import { CheckCircle, XCircle, Eye, FileText } from 'lucide-react';

const AdminLeaves = () => {
  const [leaves, setLeaves]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSub]  = useState(false);
  const [filter, setFilter]   = useState('all');

  useEffect(() => {
    document.title = 'Admin Leaves | Smart Campus';
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
      toast.success(`Leave ${status}!`);
      setSelected(null);
      fetchLeaves();
    } catch { toast.error('Review failed'); }
    finally { setSub(false); }
  };

  const filtered = filter === 'all' ? leaves : leaves.filter((l) => l.status === filter);

  return (
    <PageWrapper>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 26, marginBottom: 6 }}>
            Leave Review Center
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Review and respond to student leave applications</p>
        </div>
        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['all', 'pending', 'approved', 'rejected'].map((f) => (
            <button
              key={f} onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: 'var(--radius-full)',
                border: '1px solid',
                borderColor: filter === f ? 'var(--accent-primary)' : 'var(--border-subtle)',
                background: filter === f ? 'var(--accent-primary-glow)' : 'transparent',
                color: filter === f ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize',
                transition: 'all 0.2s',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? <SkeletonTable rows={6} /> : filtered.length === 0 ? (
        <EmptyState icon={<FileText />} message="No leave requests" description="All caught up! No pending reviews." />
      ) : (
        <div className="oc-table-wrapper">
          <table className="oc-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Type</th>
                <th>Period</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((leave, i) => (
                <motion.tr
                  key={leave.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                >
                  <td>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: 'var(--gradient-hero)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: 'white', marginRight: 10,
                    }}>
                      {leave.student?.username?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{leave.student?.username}</span>
                  </td>
                  <td style={{ textTransform: 'capitalize', fontSize: 13 }}>{leave.leave_type}</td>
                  <td style={{ fontFamily: '"JetBrains Mono"', fontSize: 12, color: 'var(--text-secondary)' }}>
                    {leave.start_date} → {leave.end_date}
                  </td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, color: 'var(--text-secondary)' }}>
                    {leave.reason}
                  </td>
                  <td><StatusBadge status={leave.status} /></td>
                  <td>
                    {leave.status === 'pending' ? (
                      <button
                        onClick={() => { setSelected(leave); setRemarks(''); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '4px 12px', borderRadius: 'var(--radius-md)',
                          background: 'var(--accent-primary-glow)', color: 'var(--accent-primary)',
                          border: '1px solid rgba(99,102,241,0.2)',
                          fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        <Eye size={12} /> Review
                      </button>
                    ) : <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>Reviewed</span>}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <Modal open={!!selected} onClose={() => setSelected(null)} title="Review Leave Request">
            <div style={{
              padding: '14px 16px', background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)', marginBottom: 20, fontSize: 13,
            }}>
              <p><span style={{ color: 'var(--text-tertiary)' }}>Student:</span> <strong>{selected.student?.username}</strong></p>
              <p style={{ marginTop: 4 }}><span style={{ color: 'var(--text-tertiary)' }}>Type:</span> {selected.leave_type}</p>
              <p style={{ marginTop: 4 }}><span style={{ color: 'var(--text-tertiary)' }}>Period:</span> {selected.start_date} → {selected.end_date}</p>
              <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>{selected.reason}</p>
            </div>
            <div className="flex flex-col gap-1.5" style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Admin Remarks</label>
              <textarea
                rows={3} className="oc-input"
                placeholder="Optional remarks for the student..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <motion.button
                onClick={() => handleReview('rejected')} disabled={submitting}
                className="oc-btn oc-btn-danger flex-1"
                whileTap={{ scale: 0.97 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <XCircle size={16} /> Reject
              </motion.button>
              <motion.button
                onClick={() => handleReview('approved')} disabled={submitting}
                className="oc-btn oc-btn-primary flex-1"
                whileTap={{ scale: 0.97 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {submitting ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <><CheckCircle size={16} /> Approve</>}
              </motion.button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};

export default AdminLeaves;
