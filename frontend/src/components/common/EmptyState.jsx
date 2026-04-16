import React from 'react';
import { FiInbox } from 'react-icons/fi';

const EmptyState = ({ message = "No records found", description = "Try adjusting your filters or search query." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-20 card border-dashed border-2 border-slate-700 bg-transparent">
      <div className="bg-slate-800 p-6 rounded-full text-slate-500 mb-6 group-hover:scale-110 transition-transform">
        <FiInbox size={48} />
      </div>
      <h3 className="text-xl font-bold text-white mb-2 uppercase italic tracking-tight">{message}</h3>
      <p className="text-slate-500 text-sm max-w-xs text-center">{description}</p>
    </div>
  );
};

export default EmptyState;
