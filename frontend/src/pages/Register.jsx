import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { GraduationCap, BookOpen, Shield } from 'lucide-react';

const roles = [
  { value: 'student', label: 'Student', icon: <GraduationCap size={22} />, color: 'var(--success)' },
  { value: 'faculty', label: 'Faculty', icon: <BookOpen size={22} />, color: 'var(--accent-secondary)' },
  { value: 'admin',   label: 'Admin',   icon: <Shield size={22} />,       color: 'var(--accent-primary)' },
];

const Register = () => {
  const [formData, setFormData] = useState({
    username: '', email: '', password: '',
    confirm_password: '', role: 'student',
    roll_number: '', department: '', phone: '',
  });
  const [loading, setLoading]     = useState(false);
  const [pwStrength, setPwStrength] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { document.title = 'Register | Smart Campus'; }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const calcStrength = (pw) => {
    let s = 0;
    if (pw.length >= 6)  s += 25;
    if (pw.length >= 10) s += 25;
    if (/[A-Z]/.test(pw)) s += 25;
    if (/[^a-zA-Z0-9]/.test(pw)) s += 25;
    return s;
  };

  const handlePasswordChange = (e) => {
    handleChange(e);
    setPwStrength(calcStrength(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      return toast.error('Passwords do not match');
    }
    setLoading(true);
    try {
      await api.post('auth/register/', formData);
      toast.success('Account created! Welcome aboard.');
      await login(formData.username, formData.password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.username?.[0] || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const strengthColor = pwStrength < 50 ? 'var(--danger)' : pwStrength < 75 ? 'var(--warning)' : 'var(--success)';
  const strengthLabel = pwStrength < 50 ? 'Weak' : pwStrength < 75 ? 'Medium' : 'Strong';

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-center p-12 relative overflow-hidden"
        style={{ width: '45%' }}
      >
        <div className="login-mesh absolute inset-0" />
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3 mb-8">
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'var(--gradient-hero)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 800, color: 'white',
              fontFamily: '"Plus Jakarta Sans"',
            }}>SC</div>
            <span style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 700, fontSize: 16, color: 'rgba(255,255,255,0.9)' }}>
              Smart Campus
            </span>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              fontFamily: '"Plus Jakarta Sans"', fontWeight: 800,
              fontSize: 42, color: 'white', lineHeight: 1.1,
            }}
          >
            Join the Future<br />
            <span className="gradient-text">of Campus Life</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.7, maxWidth: 340 }}
          >
            Create your account and get instant access to schedules, leave management, queue booking, and more.
          </motion.p>

          <div className="flex flex-col gap-3 pt-4">
            {['Real-time notifications', 'AI-powered matching', 'Paperless workflows'].map((f, i) => (
              <motion.div
                key={f}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'var(--success-glow)', border: '1px solid var(--success)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--success)', fontSize: 10, flexShrink: 0,
                }}>✓</div>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{f}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div
        className="flex-1 flex items-center justify-center p-6 overflow-y-auto"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: 500, paddingTop: 40, paddingBottom: 40 }}
        >
          <div className="mb-8">
            <h2 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 26, marginBottom: 6 }}>
              Create your account
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Fill in the details to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selector */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 10 }}>
                I am a...
              </label>
              <div className="grid grid-cols-3 gap-3">
                {roles.map((r) => (
                  <motion.button
                    key={r.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: r.value })}
                    whileTap={{ scale: 0.96 }}
                    style={{
                      padding: '14px 8px',
                      borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${formData.role === r.value ? r.color : 'var(--border-subtle)'}`,
                      background: formData.role === r.value ? `${r.color}18` : 'var(--bg-tertiary)',
                      color: formData.role === r.value ? r.color : 'var(--text-tertiary)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      cursor: 'pointer', transition: 'all 0.2s',
                      boxShadow: formData.role === r.value ? `0 0 12px ${r.color}30` : 'none',
                    }}
                  >
                    {r.icon}
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{r.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Username *</label>
                <input name="username" type="text" required className="oc-input"
                  placeholder="your_username" value={formData.username} onChange={handleChange} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Email *</label>
                <input name="email" type="email" required className="oc-input"
                  placeholder="you@college.edu" value={formData.email} onChange={handleChange} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Password *</label>
                <input name="password" type="password" required className="oc-input"
                  placeholder="••••••••" value={formData.password} onChange={handlePasswordChange} />
                {formData.password && (
                  <div>
                    <div style={{ height: 3, background: 'var(--bg-tertiary)', borderRadius: 99, overflow: 'hidden' }}>
                      <motion.div
                        animate={{ width: `${pwStrength}%` }}
                        style={{ height: '100%', background: strengthColor, borderRadius: 99, transition: 'all 0.4s' }}
                      />
                    </div>
                    <p style={{ fontSize: 11, color: strengthColor, marginTop: 3 }}>{strengthLabel} password</p>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Confirm Password *</label>
                <input name="confirm_password" type="password" required className="oc-input"
                  placeholder="••••••••" value={formData.confirm_password} onChange={handleChange} />
              </div>
              {formData.role === 'student' && (
                <div className="flex flex-col gap-1.5">
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Roll Number *</label>
                  <input name="roll_number" type="text" required className="oc-input"
                    placeholder="24B81A0501" value={formData.roll_number} onChange={handleChange} />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Department *</label>
                <input name="department" type="text" required className="oc-input"
                  placeholder="CSE, ECE, MECH…" value={formData.department} onChange={handleChange} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Phone Number *</label>
                <input name="phone" type="tel" required className="oc-input"
                  placeholder="+91 9876543210" value={formData.phone} onChange={handleChange} />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className="oc-btn oc-btn-primary w-full"
              style={{ height: 48, fontSize: 15, marginTop: 8 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Creating account...
                </span>
              ) : 'Create Account'}
            </motion.button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
