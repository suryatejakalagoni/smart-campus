import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';

const NotFound = () => {
  useEffect(() => { document.title = '404 Not Found | Smart Campus'; }, []);
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      backgroundImage: 'var(--gradient-mesh)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: 24,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <h1 style={{
          fontFamily: '"Plus Jakarta Sans"',
          fontWeight: 800,
          fontSize: 'clamp(80px, 15vw, 140px)',
          lineHeight: 1,
          background: 'var(--gradient-hero)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: 16,
        }}>404</h1>
        <h2 style={{
          fontFamily: '"Plus Jakarta Sans"', fontWeight: 700,
          fontSize: 22, color: 'var(--text-primary)', marginBottom: 12,
        }}>
          This page got lost.
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 380, lineHeight: 1.7, marginBottom: 32 }}>
          Unlike our Lost & Found items, we can't match this one. The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="oc-btn oc-btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
        >
          <Home size={16} />
          Go Home
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
