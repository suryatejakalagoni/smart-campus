import React from 'react';
import { motion } from 'framer-motion';

// ────────────────────────────────────────────
// Card — glassmorphism elevated surface
// ────────────────────────────────────────────
export const Card = ({ children, className = '', glow = false, padding = 'p-6', onClick, style }) => (
  <motion.div
    className={`oc-card ${padding} ${glow ? 'glow' : ''} ${className}`}
    whileHover={{ y: -2, transition: { duration: 0.2 } }}
    onClick={onClick}
    style={style}
  >
    {children}
  </motion.div>
);

// ────────────────────────────────────────────
// Button
// ────────────────────────────────────────────
export const Button = ({
  children, onClick, type = 'button', variant = 'primary',
  size = 'md', loading = false, disabled = false, className = '', icon,
}) => {
  const variants = {
    primary:   'oc-btn oc-btn-primary',
    secondary: 'oc-btn oc-btn-secondary',
    danger:    'oc-btn oc-btn-danger',
    ghost:     'oc-btn oc-btn-ghost',
  };
  const sizes = {
    sm: 'py-1.5 px-3 text-xs',
    md: 'py-2.5 px-5',
    lg: 'py-3 px-7 text-base',
  };
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${variants[variant]} ${sizes[size]} ${className}`}
      whileTap={{ scale: 0.97 }}
    >
      {loading ? (
        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
      ) : icon ? (
        <>
          {icon}
          {children && <span>{children}</span>}
        </>
      ) : (
        children
      )}
    </motion.button>
  );
};

// ────────────────────────────────────────────
// Status Badge
// ────────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const s = (status || 'unknown').toLowerCase().replace(/\s+/g, '_');
  return <span className={`oc-badge oc-badge-${s}`}>{status?.replace(/_/g, ' ')}</span>;
};

// ────────────────────────────────────────────
// Input
// ────────────────────────────────────────────
export const Input = ({ label, error, className = '', ...props }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && (
      <label style={{
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--text-secondary)',
        letterSpacing: '0.01em',
      }}>
        {label}
      </label>
    )}
    <input className="oc-input" {...props} />
    {error && (
      <span style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</span>
    )}
  </div>
);

// ────────────────────────────────────────────
// Select
// ────────────────────────────────────────────
export const Select = ({ label, children, error, className = '', ...props }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && (
      <label style={{
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--text-secondary)',
      }}>
        {label}
      </label>
    )}
    <select className="oc-input" {...props}>
      {children}
    </select>
    {error && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</span>}
  </div>
);

// ────────────────────────────────────────────
// Skeleton
// ────────────────────────────────────────────
export const Skeleton = ({ height = 20, width = '100%', className = '' }) => (
  <div
    className={`oc-skeleton ${className}`}
    style={{ height, width }}
  />
);

export const SkeletonCard = () => (
  <div className="oc-card p-6 space-y-4">
    <Skeleton height={16} width="40%" />
    <Skeleton height={32} width="60%" />
    <Skeleton height={12} width="30%" />
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="oc-table-wrapper">
    <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
      <Skeleton height={16} width="200px" />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} style={{
        display: 'flex', gap: 16, padding: '14px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        opacity: 1 - i * 0.12,
      }}>
        <Skeleton height={14} width="15%" />
        <Skeleton height={14} width="25%" />
        <Skeleton height={14} width="20%" />
        <Skeleton height={14} width="15%" />
        <Skeleton height={14} width="10%" />
      </div>
    ))}
  </div>
);

// ────────────────────────────────────────────
// Empty State
// ────────────────────────────────────────────
export const EmptyState = ({ icon, message, description, action, actionLabel }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="oc-card p-16 flex flex-col items-center justify-center text-center"
  >
    {icon && (
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'var(--accent-primary-glow)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20, color: 'var(--accent-primary)', fontSize: 32,
      }}>
        {icon}
      </div>
    )}
    <h3 style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
      {message}
    </h3>
    {description && (
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 320 }}>
        {description}
      </p>
    )}
    {action && (
      <Button onClick={action} className="mt-6">{actionLabel || 'Get Started'}</Button>
    )}
  </motion.div>
);

// ────────────────────────────────────────────
// Modal
// ────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, maxWidth = '520px' }) => {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, zIndex: 500,
      }}
      onClick={onClose}
    >
      <motion.div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-hover)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          width: '100%', maxWidth,
          maxHeight: '90vh', overflowY: 'auto',
        }}
        initial={{ opacity: 0, scale: 0.93, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 700, fontSize: 18 }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="oc-btn oc-btn-ghost"
            style={{ padding: '6px', borderRadius: 'var(--radius-md)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {/* Body */}
        <div style={{ padding: '24px' }}>{children}</div>
      </motion.div>
    </div>
  );
};

// ────────────────────────────────────────────
// Section Header
// ────────────────────────────────────────────
export const SectionHeader = ({ title, subtitle, action }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
    <div>
      <h1 style={{
        fontFamily: "'Plus Jakarta Sans'", fontSize: 28,
        fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2,
      }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>{subtitle}</p>
      )}
    </div>
    {action && <div>{action}</div>}
  </div>
);
