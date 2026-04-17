import React from 'react';
import { motion } from 'framer-motion';
import { PackageOpen } from 'lucide-react';

const EmptyState = ({ 
  icon: Icon = PackageOpen, 
  title = "No items yet", 
  message = "Check back later or add a new item to get started.",
  actionLabel,
  onAction
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-5 shadow-[var(--shadow-glow-indigo)]">
        <Icon className="w-8 h-8 text-indigo-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-bold text-white mb-2 font-['Plus_Jakarta_Sans']">{title}</h3>
      <p className="text-slate-400 text-sm max-w-xs mb-6 leading-relaxed">
        {message}
      </p>
      
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="oc-button-primary group relative overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-2">
            {actionLabel}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
        </button>
      )}
    </motion.div>
  );
};

export default EmptyState;
