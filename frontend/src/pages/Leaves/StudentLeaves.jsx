import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { PageWrapper } from '../../components/motion';
import { StatusBadge, SkeletonTable, EmptyState, Button, Modal, Select } from '../../components/ui';
import { Plus, FileText, Calendar, AlertCircle } from 'lucide-react';

const StudentLeaves = () => {
  const [leaves, setLeaves]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modalOpen, setModal]   = useState(false);
  const [submitting, setSub]    = useState(false);
  const [form, setForm]         = useState({
    leave_type: 'sick', start_date: '', end_date: '', reason: '',
  });

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
    setSub(true);
    try {
      await api.post('leaves/', form);
      toast.success('Leave request submitted!');
      setModal(false);
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.non_field_errors?.[0] || 'Submission failed');
    } finally { setSub(false); }
  };

  return (
    <PageWrapper>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 26, marginBottom: 6 }}>
            Leave Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Track and manage your absentee applications</p>
        </div>
        <motion.button
          className="oc-btn oc-btn-primary"
          style={{ gap: 8 }}
          onClick={() => setModal(true)}
          whileTap={{ scale: 0.97 }}
        >
          <Plus size={16} />
          Apply for Leave
        </motion.button>
      </div>

      {/* Table */}
      {loading ? <SkeletonTable rows={5} /> : leaves.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          message="No leave requests yet"
          description="Enjoying campus life? When you need time off, apply here."
          action={() => setModal(true)}
          actionLabel="Apply for Leave"
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="oc-table-wrapper"
        >
          <table className="oc-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Duration</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave, i) => (
                <motion.tr
                  key={leave.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <td>
                    <span style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 700, textTransform: 'capitalize' }}>
                      {leave.leave_type}
                    </span>
                  </td>
                  <td style={{ fontFamily: '"JetBrains Mono"', fontSize: 12, color: 'var(--text-secondary)' }}>
                    {leave.start_date} → {leave.end_date}
                  </td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: 13 }}>
                    {leave.reason}
                  </td>
                  <td><StatusBadge status={leave.status} /></td>
                  <td style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                    {leave.admin_remarks || '—'}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <Modal open={modalOpen} onClose={() => setModal(false)} title="Apply for Leave">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Leave Type</label>
                <select className="oc-input" value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })}>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal</option>
                  <option value="academic">Academic</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Start Date</label>
                  <input type="date" required className="oc-input" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>End Date</label>
                  <input type="date" required className="oc-input" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Reason</label>
                <textarea
                  required rows={3} className="oc-input"
                  placeholder="Briefly describe your reason..."
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  style={{ resize: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
                <button type="button" onClick={() => setModal(false)} className="oc-btn oc-btn-secondary">
                  Cancel
                </button>
                <motion.button
                  type="submit" disabled={submitting} className="oc-btn oc-btn-primary"
                  whileTap={{ scale: 0.97 }}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
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
