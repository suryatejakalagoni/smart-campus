import React from 'react';

export const SkeletonLine = ({ className = "h-4 w-full" }) => (
  <div className={`bg-slate-800 animate-pulse rounded ${className}`} />
);

export const SkeletonCard = () => (
  <div className="card p-6 space-y-4">
    <div className="flex justify-between items-start">
      <SkeletonLine className="h-10 w-10 rounded-lg" />
      <SkeletonLine className="h-5 w-20 rounded-full" />
    </div>
    <div className="space-y-2">
      <SkeletonLine className="h-6 w-3/4" />
      <SkeletonLine className="h-4 w-1/2" />
    </div>
    <div className="flex gap-2">
       <SkeletonLine className="h-8 flex-1 rounded-xl" />
       <SkeletonLine className="h-8 flex-1 rounded-xl" />
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="card overflow-hidden">
    <div className="h-14 bg-slate-800 animate-pulse border-b border-slate-700" />
    <div className="divide-y divide-slate-800">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="p-6 flex gap-4">
          <SkeletonLine className="h-4 w-24" />
          <SkeletonLine className="h-4 flex-1" />
          <SkeletonLine className="h-4 w-32" />
        </div>
      ))}
    </div>
  </div>
);
