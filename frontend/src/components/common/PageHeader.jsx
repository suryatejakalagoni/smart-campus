import React from 'react';
import { Home } from 'lucide-react';
import { motion } from 'framer-motion';

const PageHeader = ({ title, subtitle, moduleName }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8"
    >
      <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
        <Home className="w-3.5 h-3.5" />
        <span className="opacity-50">/</span>
        <span className="font-semibold tracking-wide uppercase text-xs text-indigo-400/80">{moduleName}</span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-['Plus_Jakarta_Sans'] tracking-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="text-slate-400 mt-2 text-sm sm:text-base max-w-2xl">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};

export default PageHeader;
