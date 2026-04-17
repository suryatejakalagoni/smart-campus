import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const DEMO_CREDS = [
  { role: 'admin',   username: 'admin',    password: 'admin123'   },
  { role: 'student', username: 'student1', password: 'student123' },
  { role: 'faculty', username: 'faculty1', password: 'faculty123' },
];

const ROLE_COLORS = {
  admin:   '#f59e0b',
  student: '#10b981',
  faculty: '#a78bfa',
};

const featureCards = [
  { icon: '⚡', title: 'AI Scheduling',  sub: 'Conflict-free timetables' },
  { icon: '🎟️', title: 'Live Queue',     sub: 'Skip the wait digitally' },
  { icon: '🔍', title: 'Smart Matching', sub: 'Lost & Found in seconds' },
];

const Login = () => {
  const [username, setUsername]   = useState('');
  const [password, setPassword]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [shake, setShake]         = useState(false);
  const { login }                 = useAuth();
  const navigate                  = useNavigate();

  useEffect(() => { document.title = 'Sign In | Smart Campus'; }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(username, password);
      toast.success(`Welcome back, ${user.username}!`);
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'faculty') navigate('/faculty/dashboard');
      else navigate('/dashboard');
    } catch {
      setError('Invalid username or password');
      setShake(true);
    } finally {
      setLoading(false);
    }
  };

  // Remove shake class after animation finishes so it can re-trigger
  useEffect(() => {
    if (!shake) return;
    const t = setTimeout(() => setShake(false), 500);
    return () => clearTimeout(t);
  }, [shake]);

  const fillDemo = (cred) => {
    setUsername(cred.username);
    setPassword(cred.password);
    setError('');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-primary)' }}>
      {/* ── Left Panel ── */}
      <div
        style={{
          width: '55%', minHeight: '100vh',
          display: 'none', flexDirection: 'column', justifyContent: 'space-between',
          padding: 48, position: 'relative', overflow: 'hidden',
        }}
        className="lg-panel"
      >
        {/* Animated mesh */}
        <div className="login-mesh" style={{ position: 'absolute', inset: 0 }} />

        {/* Particle dot grid overlay */}
        <div className="login-particle-grid" style={{ position: 'absolute', inset: 0 }} />

        {/* Noise overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.35, pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'var(--gradient-hero)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, color: 'white',
            fontFamily: '"Plus Jakarta Sans"',
            boxShadow: 'var(--shadow-glow-indigo)',
          }}>SC</div>
          <span style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 700, fontSize: 16, color: 'rgba(255,255,255,0.9)' }}>
            Smart Campus
          </span>
        </div>

        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            style={{
              fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 52,
              lineHeight: 1.1, color: 'white', marginBottom: 16,
              textShadow: '0 0 60px rgba(99,102,241,0.3)',
            }}
          >
            SMART<br />
            <span className="gradient-text">CAMPUS</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            style={{ color: 'var(--text-secondary)', fontSize: 17, maxWidth: 380, lineHeight: 1.7, marginBottom: 32 }}
          >
            Intelligent Campus Resource Management — built for the modern academic institution.
          </motion.p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {featureCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
                style={{ animation: `floatBob ${3 + i * 0.4}s ease-in-out infinite`, animationDelay: `${i * 0.5}s` }}
              >
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 12,
                  background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)',
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

        <p style={{ position: 'relative', zIndex: 10, color: 'var(--text-tertiary)', fontSize: 12 }}>
          © 2025 Smart Campus. All rights reserved.
        </p>
      </div>

      {/* ── Right: Form Panel ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 32, background: 'var(--bg-secondary)', minHeight: '100vh',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: 400 }}
        >
          {/* Mobile logo */}
          <div className="lg-hidden" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: 'var(--gradient-hero)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800, color: 'white', fontFamily: '"Plus Jakarta Sans"',
            }}>SC</div>
            <span style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
              Smart Campus
            </span>
          </div>

          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 28, color: 'var(--text-primary)', marginBottom: 8 }}>
              Welcome back
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Sign in to your campus account</p>
          </div>

          {/* Form — shake wrapper */}
          <div className={shake ? 'animate-shake' : ''}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Username</label>
                <input
                  type="text" required className="oc-input"
                  placeholder="e.g. student1"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ fontSize: 15, padding: '12px 14px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Password</label>
                <input
                  type="password" required className="oc-input"
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
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.25)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 14px',
                      fontSize: 13, color: 'var(--danger)',
                    }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={loading}
                className="oc-btn oc-btn-primary"
                style={{ height: 48, fontSize: 15, marginTop: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                    <span style={{
                      width: 16, height: 16, borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      animation: 'spin 0.7s linear infinite',
                      display: 'inline-block',
                    }} />
                    Signing in…
                  </span>
                ) : 'Sign In'}
              </motion.button>
            </form>
          </div>

          {/* ── Demo Credentials — syntax-highlighted code block ── */}
          <div style={{
            marginTop: 24,
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)',
            background: '#0d0d14',
            boxShadow: 'var(--shadow-md)',
          }}>
            {/* Editor chrome bar */}
            <div style={{
              padding: '8px 14px',
              background: '#161622',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {['#ef4444', '#f59e0b', '#22c55e'].map((c) => (
                  <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.8 }} />
                ))}
              </div>
              <span style={{ fontSize: 10, fontFamily: '"JetBrains Mono"', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em' }}>
                campus.config.ts
              </span>
              <div style={{ width: 42 }} />
            </div>

            {/* Code body */}
            <div style={{ padding: '14px 0', fontFamily: '"JetBrains Mono"', fontSize: 12 }}>
              <div style={{ padding: '0 16px', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>[</div>
              {DEMO_CREDS.map((c, i) => (
                <button
                  key={c.role}
                  onClick={() => fillDemo(c)}
                  title={`Click to fill ${c.role} credentials`}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '4px 16px 4px 28px',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.07)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ color: 'rgba(255,255,255,0.25)' }}>{'{ '}</span>
                  <span style={{ color: '#7dd3fc' }}>"role"</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>: </span>
                  <span style={{ color: ROLE_COLORS[c.role] }}>"{c.role}"</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>, </span>
                  <span style={{ color: '#7dd3fc' }}>"user"</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>: </span>
                  <span style={{ color: '#86efac' }}>"{c.username}"</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>, </span>
                  <span style={{ color: '#7dd3fc' }}>"pass"</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>: </span>
                  <span style={{ color: '#fca5a5' }}>"{c.password}"</span>
                  <span style={{ color: 'rgba(255,255,255,0.25)' }}>{' }'}{i < DEMO_CREDS.length - 1 ? ',' : ''}</span>
                </button>
              ))}
              <div style={{ padding: '0 16px', color: 'rgba(255,255,255,0.3)' }}>]</div>
            </div>

            <div style={{
              padding: '7px 14px',
              background: '#161622',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: '"JetBrains Mono"',
            }}>
              ↑ click any row to auto-fill credentials
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

      {/* Responsive CSS for the left panel */}
      <style>{`
        @media (min-width: 1024px) {
          .lg-panel { display: flex !important; }
          .lg-hidden { display: none !important; }
        }
        .login-particle-grid {
          background-image: radial-gradient(circle, rgba(99,102,241,0.25) 1px, transparent 1px);
          background-size: 32px 32px;
          animation: particleDrift 20s linear infinite;
          opacity: 0.4;
        }
        @keyframes particleDrift {
          0%   { background-position: 0 0; }
          100% { background-position: 64px 64px; }
        }
      `}</style>
    </div>
  );
};

export default Login;
