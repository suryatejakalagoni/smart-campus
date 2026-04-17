import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Settings, Shield, Camera, Save, Eye, EyeOff,
  Mail, Phone, MapPin, Calendar, GraduationCap, Briefcase,
  CheckCircle, AlertCircle, Lock,
} from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const TABS = [
  { key: 'personal', label: 'Personal Info', icon: User },
  { key: 'account', label: 'Account Details', icon: Settings },
  { key: 'security', label: 'Security', icon: Shield },
];

const Field = ({ label, children, hint }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</label>
    {children}
    {hint && <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{hint}</span>}
  </div>
);

const ReadOnlyField = ({ label, value, icon: Icon }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</label>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', borderRadius: 'var(--radius-md)',
      background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
      color: 'var(--text-primary)', fontSize: 13,
    }}>
      {Icon && <Icon size={14} style={{ color: 'var(--text-tertiary)' }} />}
      <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{value || '—'}</span>
    </div>
  </div>
);

const ProfilePage = () => {
  const { user, updateUser, refreshUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Form state
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '',
    phone: '', bio: '', date_of_birth: '', address: '',
  });

  // Security form
  const [pw, setPw] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await api.get('auth/profile/');
        if (ignore) return;
        setProfile(res.data);
        setForm({
          first_name: res.data.first_name || '',
          last_name: res.data.last_name || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          bio: res.data.bio || '',
          date_of_birth: res.data.date_of_birth || '',
          address: res.data.address || '',
        });
      } catch {
        toast.error('Failed to load profile');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  const handleSave = async (e) => {
    e?.preventDefault?.();
    setSaving(true);
    try {
      const res = await api.patch('auth/profile/', form);
      setProfile(res.data);
      updateUser({
        email: res.data.email,
        first_name: res.data.first_name,
        last_name: res.data.last_name,
      });
      toast.success('Profile updated');
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : 'Update failed';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await api.patch('auth/profile/', fd);
      setProfile(res.data);
      updateUser({ avatar: res.data.avatar });
      toast.success('Avatar updated');
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pw.new_password !== pw.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    if (pw.new_password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setChangingPw(true);
    try {
      const res = await api.post('auth/change-password/', pw);
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        await refreshUser();
      }
      toast.success('Password changed successfully');
      setPw({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      const data = err.response?.data;
      const msg = data
        ? Object.values(data).flat().join(' ')
        : 'Password change failed';
      toast.error(msg);
    } finally {
      setChangingPw(false);
    }
  };

  const pwStrength = (() => {
    const p = pw.new_password;
    if (!p) return { score: 0, label: '', color: 'var(--border-subtle)' };
    let score = 0;
    if (p.length >= 8) score += 1;
    if (p.length >= 12) score += 1;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score += 1;
    if (/\d/.test(p)) score += 1;
    if (/[^A-Za-z0-9]/.test(p)) score += 1;
    const levels = [
      { label: 'Very weak', color: '#ef4444' },
      { label: 'Weak',      color: '#f59e0b' },
      { label: 'Fair',      color: '#f59e0b' },
      { label: 'Good',      color: '#10b981' },
      { label: 'Strong',    color: '#10b981' },
      { label: 'Excellent', color: '#10b981' },
    ];
    return { score, ...levels[score] };
  })();

  if (loading || !profile) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-tertiary)' }}>
        Loading profile...
      </div>
    );
  }

  const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username;
  const initials = (profile.first_name?.[0] || profile.username?.[0] || '?').toUpperCase()
    + (profile.last_name?.[0] || '').toUpperCase();
  const roleColors = {
    admin:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  color: '#ef4444' },
    faculty: { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', color: '#6366f1' },
    student: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', color: '#10b981' },
  }[profile.role] || { bg: 'var(--bg-tertiary)', border: 'var(--border-subtle)', color: 'var(--text-secondary)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Hero header */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: 32,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 120,
          background: 'var(--gradient-hero)', opacity: 0.12,
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 96, height: 96, borderRadius: '50%',
              background: profile.avatar ? 'transparent' : 'var(--gradient-hero)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 32, fontWeight: 800,
              fontFamily: '"Plus Jakarta Sans"',
              border: '3px solid var(--bg-secondary)',
              boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
              overflow: 'hidden',
            }}>
              {profile.avatar
                ? <img src={profile.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 30, height: 30, borderRadius: '50%',
                background: 'var(--accent-primary)', color: 'white',
                border: '2px solid var(--bg-secondary)', cursor: avatarUploading ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: avatarUploading ? 0.5 : 1,
              }}
            >
              <Camera size={14} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleAvatarUpload(e.target.files?.[0])}
            />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 24 }}>{displayName}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>@{profile.username}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <span style={{
                padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                background: roleColors.bg, border: `1px solid ${roleColors.border}`, color: roleColors.color,
              }}>{profile.role}</span>
              {profile.department && (
                <span style={{
                  padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                  background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}>{profile.department}</span>
              )}
              {profile.section && (
                <span style={{
                  padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                  background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}>Section {profile.section}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, background: 'var(--bg-tertiary)', padding: 4,
        borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)',
        width: 'fit-content', flexWrap: 'wrap',
      }}>
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: '10px 18px', borderRadius: 'var(--radius-md)',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 7,
                background: activeTab === t.key ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === t.key ? 'white' : 'var(--text-secondary)',
                boxShadow: activeTab === t.key ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
              }}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'personal' && (
          <motion.form
            key="personal"
            onSubmit={handleSave}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)', padding: 28,
              display: 'flex', flexDirection: 'column', gap: 20,
            }}
          >
            <div>
              <h3 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Personal Information</h3>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Update your personal details below.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <Field label="First Name">
                <input className="oc-input" value={form.first_name}
                  onChange={e => setForm({ ...form, first_name: e.target.value })} />
              </Field>
              <Field label="Last Name">
                <input className="oc-input" value={form.last_name}
                  onChange={e => setForm({ ...form, last_name: e.target.value })} />
              </Field>
              <Field label="Email">
                <input type="email" className="oc-input" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label="Phone">
                <input className="oc-input" value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })} />
              </Field>
              <Field label="Date of Birth">
                <input type="date" className="oc-input" value={form.date_of_birth || ''}
                  onChange={e => setForm({ ...form, date_of_birth: e.target.value })} />
              </Field>
            </div>

            <Field label="Bio" hint={`${form.bio.length}/300 characters`}>
              <textarea maxLength={300} rows={3} className="oc-input"
                placeholder="Tell us a little about yourself..."
                value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
                style={{ resize: 'none' }} />
            </Field>

            <Field label="Address">
              <textarea rows={2} className="oc-input"
                placeholder="Your current address..."
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                style={{ resize: 'none' }} />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
              <button type="submit" disabled={saving} className="oc-btn oc-btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </motion.form>
        )}

        {activeTab === 'account' && (
          <motion.div
            key="account"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)', padding: 28,
              display: 'flex', flexDirection: 'column', gap: 20,
            }}
          >
            <div>
              <h3 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Account Details</h3>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>These details are managed by the administrator.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <ReadOnlyField label="Username" value={profile.username} icon={User} />
              <ReadOnlyField label="Role" value={profile.role} icon={Briefcase} />
              <ReadOnlyField label="Email" value={profile.email} icon={Mail} />
              <ReadOnlyField label="Phone" value={profile.phone} icon={Phone} />
              {profile.role === 'student' && (
                <>
                  <ReadOnlyField label="Roll Number" value={profile.roll_number} icon={GraduationCap} />
                  <ReadOnlyField label="Section" value={profile.section} icon={GraduationCap} />
                </>
              )}
              {profile.department && (
                <ReadOnlyField label="Department" value={profile.department} icon={Briefcase} />
              )}
              {profile.address && (
                <ReadOnlyField label="Address" value={profile.address} icon={MapPin} />
              )}
              <ReadOnlyField label="Account Created"
                value={profile.date_joined ? new Date(profile.date_joined).toLocaleDateString() : '—'}
                icon={Calendar} />
              <ReadOnlyField label="Last Login"
                value={profile.last_login ? new Date(profile.last_login).toLocaleString() : '—'}
                icon={Calendar} />
            </div>
          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div
            key="security"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
          >
            <form onSubmit={handlePasswordChange} style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)', padding: 28,
              display: 'flex', flexDirection: 'column', gap: 20,
            }}>
              <div>
                <h3 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 700, fontSize: 16, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Lock size={16} /> Change Password
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Use a strong password you don't use anywhere else.</p>
              </div>

              {[
                { key: 'current_password', label: 'Current Password', show: 'current' },
                { key: 'new_password',     label: 'New Password',     show: 'next'    },
                { key: 'confirm_password', label: 'Confirm New Password', show: 'confirm' },
              ].map(fld => (
                <Field key={fld.key} label={fld.label}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw[fld.show] ? 'text' : 'password'}
                      className="oc-input"
                      value={pw[fld.key]}
                      onChange={e => setPw({ ...pw, [fld.key]: e.target.value })}
                      style={{ paddingRight: 40 }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw({ ...showPw, [fld.show]: !showPw[fld.show] })}
                      style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: 'var(--text-tertiary)', padding: 4,
                      }}
                    >
                      {showPw[fld.show] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </Field>
              ))}

              {/* Strength meter */}
              {pw.new_password && (
                <div>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                    {[0, 1, 2, 3, 4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 4, borderRadius: 2,
                        background: i < pwStrength.score ? pwStrength.color : 'var(--border-subtle)',
                        transition: 'all 0.2s',
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: pwStrength.color }}>
                    Strength: {pwStrength.label}
                  </span>
                </div>
              )}

              <div style={{
                background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 'var(--radius-md)', padding: '12px 14px',
                fontSize: 12, color: 'var(--text-secondary)',
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <AlertCircle size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 1 }} />
                <span>After changing your password you'll stay logged in with a new session token. All other sessions will be signed out.</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={changingPw} className="oc-btn oc-btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={14} /> {changingPw ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>

            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 'var(--radius-lg)', padding: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 12,
            }}>
              <div>
                <h4 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                  Sign out of this device
                </h4>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  End your current session on this browser.
                </p>
              </div>
              <button onClick={logout} className="oc-btn oc-btn-danger">Log Out</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;
