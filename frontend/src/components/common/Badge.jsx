import React from 'react';

const Badge = ({ status, children }) => {
  const getColors = (s) => {
    switch (s?.toLowerCase()) {
      case 'approved':
      case 'completed':
      case 'present':
      case 'found':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'pending':
      case 'booked':
      case 'late':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'rejected':
      case 'cancelled':
      case 'absent':
      case 'lost':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'in_progress':
      case 'open':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getColors(status)}`}>
      {children || status}
    </span>
  );
};

export default Badge;
