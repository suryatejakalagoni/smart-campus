import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const featureCards = [
  { icon: '⚡', title: 'AI Scheduling', sub: 'Conflict-free timetables' },
  { icon: '🎟️', title: 'Live Queue', sub: 'Skip the wait digitally' },
  { icon: '🔍', title: 'Smart Matching', sub: 'Lost & Found in seconds' },
];

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  // Set page title
  useEffect(() => { document.title = 'Sign In | Smart Campus'; }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(username, password);
      toast.success(`Welcome back, ${user.username}!`, {
        style: {
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-subtle)',
          borderLeft: '3px solid var(--success)',
        },
      });
      if (user.role === 'admin') navigate('/admin/dashboard');
      else navigate('/dashboard');
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {/* ── Left Panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ width: '55%', minHeight: '100vh' }}
      >
        {/* Animated mesh background */}
        <div className="login-mesh absolute inset-0" />
        
        {/* Noise overlay */}
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
          opacity: 0.4, pointerEvents: 'none',
        }} />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'var(--gradient-hero)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 800, color: 'white', fontFamily: '"Plus Jakarta Sans"',
              boxShadow: 'var(--shadow-glow-indigo)',
            }}>SC</div>
            <span style={{
              fontFamily: '"Plus Jakarta Sans"', fontWeight: 700, fontSize: 16,
              color: 'rgba(255,255,255,0.9)',
            }}>Smart Campus</span>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            style={{
              fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 52,
              lineHeight: 1.1, color: 'white',
              textShadow: '0 0 60px rgba(99,102,241,0.3)',
            }}
          >
            SMART<br />
            <span className="gradient-text">CAMPUS</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            style={{ color: 'var(--text-secondary)', fontSize: 17, maxWidth: 380, lineHeight: 1.7 }}
          >
            Intelligent Campus Resource Management — built for the modern academic institution.
          </motion.p>

          {/* Floating Feature Cards */}
          <div className="flex flex-col gap-3 pt-4">
            {featureCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.15, duration: 0.5 }}
                style={{
                  animation: `floatBob ${3 + i * 0.4}s ease-in-out infinite`,
                  animationDelay: `${i * 0.5}s`,
                }}
              >
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 12,
                  background: 'rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12, padding: '12px 18px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }}>
                  <span style={{ fontSize: 22 }}>{card.icon}</span>
                  <div>
                    <p style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 700, fontSize: 13, color: 'white' }}>{card.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{card.sub}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="relative z-10" style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
          © 2025 Smart Campus. All rights reserved.
        </p>
      </div>

      {/* ── Right: Form Panel ── */}
      <div
        className="flex-1 flex items-center justify-center p-8"
        style={{ background: 'var(--bg-secondary)', minHeight: '100vh' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: 400 }}
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--gradient-hero)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 14,
              fontWeight: 800, color: 'white', fontFamily: '"Plus Jakarta Sans"',
            }}>SC</div>
            <span style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
              Smart Campus
            </span>
          </div>

          <div className="mb-8">
            <h2 style={{
              fontFamily: '"Plus Jakarta Sans"', fontWeight: 800,
              fontSize: 30, color: 'var(--text-primary)', marginBottom: 8,
            }}>
              Welcome back
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
              Sign in to your campus account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Username</label>
              <input
                type="text"
                required
                className="oc-input"
                placeholder="e.g. student1"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ fontSize: 15, padding: '12px 14px' }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Password</label>
              <input
                type="password"
                required
                className="oc-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ fontSize: 15, padding: '12px 14px' }}
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    background: 'var(--danger-glow)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    fontSize: 13, color: 'var(--danger)',
                    boxShadow: 'var(--danger-glow)',
                  }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

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
                  Signing in...
                </span>
              ) : 'Sign In'}
            </motion.button>
          </form>

          {/* Demo Credentials */}
          <div style={{
            marginTop: 24,
            padding: '14px 16px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
              Demo Credentials
            </p>
            <div className="space-y-1">
              {[
                { label: 'Admin', creds: 'admin / admin123' },
                { label: 'Student', creds: 'student1 / student123' },
                { label: 'Faculty', creds: 'faculty1 / faculty123' },
              ].map(({ label, creds }) => (
                <div key={label} className="flex justify-between">
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{label}</span>
                  <span style={{ fontSize: 12, fontFamily: '"JetBrains Mono"', color: 'var(--text-secondary)' }}>{creds}</span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
