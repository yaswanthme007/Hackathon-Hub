'use client';

import { motion } from 'framer-motion';

export default function SkeletonCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Image skeleton */}
      <div className="h-44 skeleton" />

      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="space-y-1.5">
          <div className="skeleton h-4 rounded w-4/5" />
          <div className="skeleton h-3.5 rounded w-3/5" />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <div className="skeleton h-3 rounded w-full" />
          <div className="skeleton h-3 rounded w-5/6" />
        </div>

        {/* Tags */}
        <div className="flex gap-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-5 rounded-full w-16" />
          ))}
        </div>

        {/* Meta */}
        <div className="space-y-1.5">
          <div className="skeleton h-3 rounded w-2/3" />
          <div className="flex justify-between">
            <div className="skeleton h-3 rounded w-1/3" />
            <div className="skeleton h-3 rounded w-1/4" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1.5 border-t border-white/5">
          <div className="skeleton h-9 rounded-xl flex-1" />
          <div className="skeleton h-9 w-9 rounded-xl" />
          <div className="skeleton h-9 w-9 rounded-xl" />
        </div>
      </div>
    </motion.div>
  );
}
