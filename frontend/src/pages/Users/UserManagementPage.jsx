import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Plus, Upload, Download, MoreVertical,
  Edit3, KeyRound, Power, PowerOff, Trash2, Shield, UserCog,
  Filter, X, Activity, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Eye, EyeOff,
} from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const ROLE_COLORS = {
  admin:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  color: '#ef4444' },
  faculty: { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', color: '#6366f1' },
  student: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', color: '#10b981' },
};

const StatusPill = ({ active }) => (
  <span style={{
    padding: '3px 9px', borderRadius: 99, fontSize: 10, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.06em',
    background: active ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
    border: `1px solid ${active ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
    color: active ? '#10b981' : '#ef4444',
  }}>{active ? 'Active' : 'Inactive'}</span>
);

const RoleChip = ({ role }) => {
  const c = ROLE_COLORS[role] || { bg: 'var(--bg-tertiary)', border: 'var(--border-subtle)', color: 'var(--text-secondary)' };
  return (
    <span style={{
      padding: '3px 9px', borderRadius: 99, fontSize: 10, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.06em',
      background: c.bg, border: `1px solid ${c.border}`, color: c.color,
    }}>{role}</span>
  );
};

const Field = ({ label, children, hint }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</label>
    {children}
    {hint && <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{hint}</span>}
  </div>
);

const EmptyForm = {
  username: '', email: '', password: '',
  first_name: '', last_name: '',
  role: 'student', roll_number: '', department: '', section: '', phone: '',
  is_active: true,
};

const ROWS_PER_PAGE = 10;

const UserManagementPage = () => {
  const { user: me } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // filters
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ role: '', department: '', section: '', is_active: '' });
  const [page, setPage] = useState(1);

  // menus / modals
  const [openMenu, setOpenMenu] = useState(null); // user id
  const [editUser, setEditUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showAudit, setShowAudit] = useState(false);

  // forms
  const [addForm, setAddForm] = useState(EmptyForm);
  const [editForm, setEditForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // reset password form
  const [newPassword, setNewPassword] = useState('');

  // bulk import
  const [importRows, setImportRows] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const importInputRef = useRef(null);

  // audit
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filters.role) params.set('role', filters.role);
      if (filters.department) params.set('department', filters.department);
      if (filters.section) params.set('section', filters.section);
      if (filters.is_active) params.set('is_active', filters.is_active);
      const res = await api.get(`admin/users/?${params.toString()}`);
      setUsers(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get('admin/users/stats/');
      setStats(res.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => { setPage(1); }, [search, filters]);

  const pagedUsers = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return users.slice(start, start + ROWS_PER_PAGE);
  }, [users, page]);
  const totalPages = Math.max(1, Math.ceil(users.length / ROWS_PER_PAGE));

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('admin/users/', addForm);
      toast.success('User created');
      setShowAdd(false);
      setAddForm(EmptyForm);
      loadUsers(); loadStats();
    } catch (err) {
      const d = err.response?.data;
      toast.error(d ? Object.values(d).flat().join(' ') : 'Failed to create user');
    } finally { setSubmitting(false); }
  };

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({
      first_name: u.first_name || '', last_name: u.last_name || '',
      email: u.email || '', phone: u.phone || '',
      department: u.department || '', section: u.section || '',
      roll_number: u.roll_number || '', role: u.role,
    });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`admin/users/${editUser.id}/`, editForm);
      toast.success('User updated');
      setEditUser(null);
      loadUsers(); loadStats();
    } catch (err) {
      const d = err.response?.data;
      toast.error(d ? Object.values(d).flat().join(' ') : 'Failed to update');
    } finally { setSubmitting(false); }
  };

  const toggleActive = async (u) => {
    try {
      const endpoint = u.is_active ? 'deactivate' : 'activate';
      await api.post(`admin/users/${u.id}/${endpoint}/`);
      toast.success(`User ${u.is_active ? 'deactivated' : 'activated'}`);
      loadUsers(); loadStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed');
    }
  };

  const handleRoleChange = async (u, role) => {
    try {
      await api.post(`admin/users/${u.id}/change-role/`, { role });
      toast.success(`Role changed to ${role}`);
      loadUsers(); loadStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to change role');
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`admin/users/${resetUser.id}/reset-password/`, { new_password: newPassword });
      toast.success('Password reset');
      setResetUser(null);
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reset password');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await api.delete(`admin/users/${deleteUser.id}/`);
      toast.success('User deleted');
      setDeleteUser(null);
      loadUsers(); loadStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete');
    } finally { setSubmitting(false); }
  };

  // CSV parsing
  const parseCSV = (text) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const cols = line.split(',').map(c => c.trim());
      const obj = {};
      headers.forEach((h, i) => { obj[h] = cols[i] || ''; });
      if (obj.is_active !== undefined) {
        obj.is_active = String(obj.is_active).toLowerCase() !== 'false';
      }
      return obj;
    });
  };

  const handleFileUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCSV(ev.target.result);
      if (!rows.length) {
        toast.error('CSV appears empty');
        return;
      }
      setImportRows(rows);
      setImportErrors([]);
    };
    reader.readAsText(file);
  };

  const handleBulkSubmit = async () => {
    if (!importRows.length) return;
    setSubmitting(true);
    try {
      const res = await api.post('admin/users/bulk-import/', importRows);
      const { created, errors } = res.data;
      if (errors?.length) {
        setImportErrors(errors);
        toast(`Imported ${created.length} users with ${errors.length} errors`, { icon: 'warning' });
      } else {
        toast.success(`Imported ${created.length} users`);
        setShowImport(false);
        setImportRows([]);
      }
      loadUsers(); loadStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Bulk import failed');
    } finally { setSubmitting(false); }
  };

  const downloadTemplate = () => {
    const csv = 'username,email,password,first_name,last_name,role,roll_number,department,section,phone\n'
      + 'jdoe,jdoe@campus.edu,ChangeMe123!,John,Doe,student,R001,CSE,A,9876543210\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'user-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const openAuditLog = async () => {
    setShowAudit(true);
    setAuditLoading(true);
    try {
      const res = await api.get('admin/audit-logs/');
      setAuditLogs(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch {
      toast.error('Failed to load audit logs');
    } finally { setAuditLoading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
         onClick={() => setOpenMenu(null)}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <UserCog size={13} style={{ color: 'var(--text-tertiary)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Admin</span>
          </div>
          <h1 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 26 }}>User Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            Manage campus users, roles, and access.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="oc-btn oc-btn-secondary" onClick={openAuditLog}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity size={14} /> Audit Log
          </button>
          <button className="oc-btn oc-btn-secondary" onClick={() => setShowImport(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Upload size={14} /> Bulk Import
          </button>
          <button className="oc-btn oc-btn-primary" onClick={() => setShowAdd(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Add User
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          {[
            { label: 'Total', value: stats.total, color: 'var(--accent-primary)' },
            { label: 'Students', value: stats.students, color: '#10b981' },
            { label: 'Faculty', value: stats.faculty, color: '#6366f1' },
            { label: 'Admins', value: stats.admins, color: '#ef4444' },
            { label: 'Active', value: stats.active, color: '#10b981' },
            { label: 'Inactive', value: stats.inactive, color: 'var(--text-tertiary)' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)', padding: 16,
            }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
              <p style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 24, color: s.color, marginTop: 4 }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input className="oc-input" placeholder="Search username, email, name..."
                 value={search} onChange={e => setSearch(e.target.value)}
                 style={{ paddingLeft: 36 }} />
        </div>
        <select className="oc-input" style={{ maxWidth: 160 }}
                value={filters.role} onChange={e => setFilters(f => ({ ...f, role: e.target.value }))}>
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
          <option value="admin">Admin</option>
        </select>
        <input className="oc-input" style={{ maxWidth: 160 }} placeholder="Department"
               value={filters.department} onChange={e => setFilters(f => ({ ...f, department: e.target.value }))} />
        <input className="oc-input" style={{ maxWidth: 120 }} placeholder="Section"
               value={filters.section} onChange={e => setFilters(f => ({ ...f, section: e.target.value }))} />
        <select className="oc-input" style={{ maxWidth: 140 }}
                value={filters.is_active} onChange={e => setFilters(f => ({ ...f, is_active: e.target.value }))}>
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        {(search || filters.role || filters.department || filters.section || filters.is_active) && (
          <button className="oc-btn oc-btn-ghost"
                  onClick={() => { setSearch(''); setFilters({ role: '', department: '', section: '', is_active: '' }); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading users...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <Users size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
            <p style={{ fontWeight: 700, fontSize: 14 }}>No users match your filters</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-subtle)' }}>
                  {['User', 'Email', 'Role', 'Department', 'Section', 'Status', 'Joined', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: u.avatar ? 'transparent' : 'var(--gradient-hero)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: 12, fontWeight: 700,
                          overflow: 'hidden', flexShrink: 0,
                        }}>
                          {u.avatar
                            ? <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : (u.first_name?.[0] || u.username?.[0] || '?').toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600 }}>{u.full_name || u.username}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>@{u.username}{u.roll_number ? ` · ${u.roll_number}` : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{u.email || '—'}</td>
                    <td style={{ padding: '12px 14px' }}><RoleChip role={u.role} /></td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{u.department || '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{u.section || '—'}</td>
                    <td style={{ padding: '12px 14px' }}><StatusPill active={u.is_active} /></td>
                    <td style={{ padding: '12px 14px', fontSize: 11, color: 'var(--text-tertiary)' }}>
                      {u.date_joined ? new Date(u.date_joined).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '12px 14px', position: 'relative' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === u.id ? null : u.id); }}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 6, borderRadius: 6 }}
                      >
                        <MoreVertical size={15} />
                      </button>
                      <AnimatePresence>
                        {openMenu === u.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              position: 'absolute', right: 8, top: 'calc(100% - 4px)',
                              background: 'var(--bg-secondary)', border: '1px solid var(--border-hover)',
                              borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                              minWidth: 180, zIndex: 20, overflow: 'hidden',
                            }}
                          >
                            {[
                              { icon: Edit3, label: 'Edit Details', onClick: () => { openEdit(u); setOpenMenu(null); } },
                              { icon: KeyRound, label: 'Reset Password', onClick: () => { setResetUser(u); setOpenMenu(null); } },
                              { icon: Shield, label: 'Change Role', submenu: true, roleOptions: ['student', 'faculty', 'admin'] },
                              {
                                icon: u.is_active ? PowerOff : Power,
                                label: u.is_active ? 'Deactivate' : 'Activate',
                                onClick: () => { toggleActive(u); setOpenMenu(null); },
                                disabled: u.id === me?.id,
                              },
                              {
                                icon: Trash2, label: 'Delete User', danger: true,
                                onClick: () => { setDeleteUser(u); setOpenMenu(null); },
                                disabled: u.id === me?.id,
                              },
                            ].map((item, i) => item.submenu ? (
                              <div key={i} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                                <div style={{ padding: '8px 12px', fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <item.icon size={11} /> {item.label}
                                </div>
                                {item.roleOptions.map(r => (
                                  <button
                                    key={r}
                                    disabled={u.role === r || (u.id === me?.id && r !== 'admin')}
                                    onClick={() => { handleRoleChange(u, r); setOpenMenu(null); }}
                                    style={{
                                      width: '100%', padding: '8px 24px', textAlign: 'left',
                                      background: 'transparent', border: 'none',
                                      color: u.role === r ? 'var(--text-tertiary)' : 'var(--text-primary)',
                                      fontSize: 12, fontWeight: 500,
                                      cursor: (u.role === r || (u.id === me?.id && r !== 'admin')) ? 'not-allowed' : 'pointer',
                                      opacity: (u.role === r || (u.id === me?.id && r !== 'admin')) ? 0.5 : 1,
                                      display: 'flex', alignItems: 'center', gap: 6,
                                    }}
                                  >
                                    {u.role === r && <CheckCircle size={11} />} {r}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <button
                                key={i}
                                disabled={item.disabled}
                                onClick={item.onClick}
                                style={{
                                  width: '100%', padding: '9px 12px', textAlign: 'left',
                                  background: 'transparent', border: 'none',
                                  color: item.danger ? '#ef4444' : 'var(--text-primary)',
                                  fontSize: 12, fontWeight: 500, cursor: item.disabled ? 'not-allowed' : 'pointer',
                                  opacity: item.disabled ? 0.4 : 1,
                                  display: 'flex', alignItems: 'center', gap: 8,
                                  borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)',
                                }}
                              >
                                <item.icon size={13} /> {item.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {users.length > ROWS_PER_PAGE && (
          <div style={{
            padding: '12px 16px', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', borderTop: '1px solid var(--border-subtle)',
          }}>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              Showing {(page - 1) * ROWS_PER_PAGE + 1}–{Math.min(page * ROWS_PER_PAGE, users.length)} of {users.length}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="oc-btn oc-btn-ghost"
                style={{ padding: 6 }}
              ><ChevronLeft size={14} /></button>
              <span style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600 }}>
                {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="oc-btn oc-btn-ghost"
                style={{ padding: 6 }}
              ><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAdd && (
          <ModalShell title="Add New User" onClose={() => setShowAdd(false)} maxWidth={600}>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Username *">
                  <input required className="oc-input" value={addForm.username}
                         onChange={e => setAddForm({ ...addForm, username: e.target.value })} />
                </Field>
                <Field label="Email *">
                  <input required type="email" className="oc-input" value={addForm.email}
                         onChange={e => setAddForm({ ...addForm, email: e.target.value })} />
                </Field>
                <Field label="First Name">
                  <input className="oc-input" value={addForm.first_name}
                         onChange={e => setAddForm({ ...addForm, first_name: e.target.value })} />
                </Field>
                <Field label="Last Name">
                  <input className="oc-input" value={addForm.last_name}
                         onChange={e => setAddForm({ ...addForm, last_name: e.target.value })} />
                </Field>
                <Field label="Role *">
                  <select className="oc-input" value={addForm.role}
                          onChange={e => setAddForm({ ...addForm, role: e.target.value })}>
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="admin">Admin</option>
                  </select>
                </Field>
                <Field label="Phone">
                  <input className="oc-input" value={addForm.phone}
                         onChange={e => setAddForm({ ...addForm, phone: e.target.value })} />
                </Field>
                {addForm.role === 'student' && (
                  <>
                    <Field label="Roll Number">
                      <input className="oc-input" value={addForm.roll_number}
                             onChange={e => setAddForm({ ...addForm, roll_number: e.target.value })} />
                    </Field>
                    <Field label="Section">
                      <input className="oc-input" value={addForm.section}
                             onChange={e => setAddForm({ ...addForm, section: e.target.value })} />
                    </Field>
                  </>
                )}
                <Field label="Department">
                  <input className="oc-input" value={addForm.department}
                         onChange={e => setAddForm({ ...addForm, department: e.target.value })} />
                </Field>
                <Field label="Password *" hint="Minimum 8 characters">
                  <div style={{ position: 'relative' }}>
                    <input
                      required minLength={8}
                      type={showPassword ? 'text' : 'password'}
                      className="oc-input"
                      value={addForm.password}
                      onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                      style={{ paddingRight: 36 }}
                    />
                    <button type="button" onClick={() => setShowPassword(s => !s)}
                            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </Field>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 6 }}>
                <button type="button" className="oc-btn oc-btn-secondary"
                        onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" disabled={submitting} className="oc-btn oc-btn-primary">
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editUser && (
          <ModalShell title={`Edit — ${editUser.username}`} onClose={() => setEditUser(null)} maxWidth={600}>
            <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="First Name">
                  <input className="oc-input" value={editForm.first_name}
                         onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} />
                </Field>
                <Field label="Last Name">
                  <input className="oc-input" value={editForm.last_name}
                         onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} />
                </Field>
                <Field label="Email">
                  <input type="email" className="oc-input" value={editForm.email}
                         onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                </Field>
                <Field label="Phone">
                  <input className="oc-input" value={editForm.phone}
                         onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                </Field>
                <Field label="Department">
                  <input className="oc-input" value={editForm.department}
                         onChange={e => setEditForm({ ...editForm, department: e.target.value })} />
                </Field>
                <Field label="Section">
                  <input className="oc-input" value={editForm.section}
                         onChange={e => setEditForm({ ...editForm, section: e.target.value })} />
                </Field>
                <Field label="Roll Number">
                  <input className="oc-input" value={editForm.roll_number}
                         onChange={e => setEditForm({ ...editForm, roll_number: e.target.value })} />
                </Field>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 6 }}>
                <button type="button" className="oc-btn oc-btn-secondary"
                        onClick={() => setEditUser(null)}>Cancel</button>
                <button type="submit" disabled={submitting} className="oc-btn oc-btn-primary">
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {resetUser && (
          <ModalShell title={`Reset Password — ${resetUser.username}`} onClose={() => { setResetUser(null); setNewPassword(''); }} maxWidth={440}>
            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 'var(--radius-md)', padding: '12px 14px',
                fontSize: 12, color: '#f59e0b', display: 'flex', gap: 10,
              }}>
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>This will immediately reset the user's password and invalidate their active session. They must log in again.</span>
              </div>
              <Field label="New Password" hint="Minimum 8 characters. Share via secure channel.">
                <div style={{ position: 'relative' }}>
                  <input
                    required minLength={8}
                    type={showPassword ? 'text' : 'password'}
                    className="oc-input"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    style={{ paddingRight: 36 }}
                  />
                  <button type="button" onClick={() => setShowPassword(s => !s)}
                          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </Field>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="oc-btn oc-btn-secondary"
                        onClick={() => { setResetUser(null); setNewPassword(''); }}>Cancel</button>
                <button type="submit" disabled={submitting} className="oc-btn oc-btn-primary">
                  {submitting ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteUser && (
          <ModalShell title="Delete User" onClose={() => setDeleteUser(null)} maxWidth={420}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 'var(--radius-md)', padding: '14px 16px',
                fontSize: 13, color: '#ef4444', display: 'flex', gap: 10,
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  Permanently delete <strong>{deleteUser.username}</strong>? This also removes their
                  leaves, bookings, and related records. This cannot be undone.
                </span>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="oc-btn oc-btn-secondary" onClick={() => setDeleteUser(null)}>Cancel</button>
                <button disabled={submitting} onClick={handleDelete} className="oc-btn oc-btn-danger">
                  {submitting ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* Bulk Import Modal */}
      <AnimatePresence>
        {showImport && (
          <ModalShell title="Bulk Import Users"
                      onClose={() => { setShowImport(false); setImportRows([]); setImportErrors([]); }}
                      maxWidth={680}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 'var(--radius-md)', padding: '14px 16px',
                fontSize: 12, color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
              }}>
                <span>Upload a CSV with columns: username, email, password, first_name, last_name, role, roll_number, department, section, phone</span>
                <button className="oc-btn oc-btn-ghost" onClick={downloadTemplate}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Download size={13} /> Template
                </button>
              </div>

              {!importRows.length ? (
                <label
                  htmlFor="csv-upload"
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); handleFileUpload(e.dataTransfer.files[0]); }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: 40, border: '2px dashed var(--border-subtle)',
                    borderRadius: 'var(--radius-md)', cursor: 'pointer', gap: 10,
                  }}
                >
                  <Upload size={28} style={{ opacity: 0.3 }} />
                  <p style={{ fontSize: 13, fontWeight: 600 }}>Drop CSV file here or click to browse</p>
                  <input id="csv-upload" ref={importInputRef} type="file" accept=".csv,text/csv"
                         style={{ display: 'none' }}
                         onChange={e => handleFileUpload(e.target.files?.[0])} />
                </label>
              ) : (
                <>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Parsed <strong>{importRows.length}</strong> rows. Review and submit.
                  </p>
                  <div style={{
                    maxHeight: 260, overflow: 'auto',
                    border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead style={{ background: 'var(--bg-tertiary)', position: 'sticky', top: 0 }}>
                        <tr>
                          {Object.keys(importRows[0]).map(k => (
                            <th key={k} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importRows.slice(0, 30).map((r, i) => (
                          <tr key={i} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                            {Object.keys(importRows[0]).map(k => (
                              <td key={k} style={{ padding: '6px 10px', color: 'var(--text-secondary)' }}>{String(r[k] ?? '')}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importRows.length > 30 && (
                      <p style={{ padding: 8, textAlign: 'center', fontSize: 11, color: 'var(--text-tertiary)' }}>
                        ...and {importRows.length - 30} more rows
                      </p>
                    )}
                  </div>

                  {importErrors.length > 0 && (
                    <div style={{
                      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: 'var(--radius-md)', padding: 12,
                      maxHeight: 160, overflow: 'auto', fontSize: 11,
                    }}>
                      <p style={{ fontWeight: 700, color: '#ef4444', marginBottom: 6 }}>
                        {importErrors.length} row{importErrors.length > 1 ? 's' : ''} failed:
                      </p>
                      {importErrors.slice(0, 10).map((e, i) => (
                        <p key={i} style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', marginTop: 2 }}>
                          Row {e.row}: {e.error}
                        </p>
                      ))}
                    </div>
                  )}
                </>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                {importRows.length > 0 && (
                  <button className="oc-btn oc-btn-ghost"
                          onClick={() => { setImportRows([]); setImportErrors([]); }}>
                    Clear
                  </button>
                )}
                <button className="oc-btn oc-btn-secondary"
                        onClick={() => { setShowImport(false); setImportRows([]); setImportErrors([]); }}>
                  Cancel
                </button>
                <button disabled={!importRows.length || submitting}
                        onClick={handleBulkSubmit}
                        className="oc-btn oc-btn-primary">
                  {submitting ? 'Importing...' : `Import ${importRows.length} Users`}
                </button>
              </div>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* Audit Log Modal */}
      <AnimatePresence>
        {showAudit && (
          <ModalShell title="Audit Log" onClose={() => setShowAudit(false)} maxWidth={760}>
            {auditLoading ? (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading...</div>
            ) : auditLogs.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                <Activity size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p>No audit events yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '60vh', overflow: 'auto' }}>
                {auditLogs.map(log => (
                  <div key={log.id} style={{
                    padding: 12,
                    background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                  }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: 'var(--accent-primary-glow)', color: 'var(--accent-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Activity size={13} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600 }}>
                        <span style={{ color: 'var(--accent-primary)' }}>{log.actor_username || 'system'}</span>
                        {' · '}{log.action_display}
                        {log.target_username && <> · <span style={{ color: 'var(--text-secondary)' }}>{log.target_username}</span></>}
                      </p>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <p style={{ fontSize: 11, fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-tertiary)', marginTop: 4 }}>
                          {JSON.stringify(log.details)}
                        </p>
                      )}
                      <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
                        {new Date(log.created_at).toLocaleString()}
                        {log.ip_address && ` · ${log.ip_address}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ModalShell>
        )}
      </AnimatePresence>
    </div>
  );
};

const ModalShell = ({ title, onClose, children, maxWidth = 520 }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    onClick={onClose}
    style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 300,
    }}
  >
    <motion.div
      initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
      onClick={e => e.stopPropagation()}
      style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border-hover)',
        borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)',
        width: '100%', maxWidth, maxHeight: '92vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '18px 22px', borderBottom: '1px solid var(--border-subtle)',
      }}>
        <h2 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 17 }}>{title}</h2>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
          <X size={16} />
        </button>
      </div>
      <div style={{ padding: 22, overflowY: 'auto' }}>
        {children}
      </div>
    </motion.div>
  </motion.div>
);

export default UserManagementPage;
