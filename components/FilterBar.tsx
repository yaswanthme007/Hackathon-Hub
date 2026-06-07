'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Building2, Layers, Wifi, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { FilterMode, SortBy } from '@/types';
import { useState } from 'react';

interface Props {
  mode: FilterMode;
  sort: SortBy;
  onModeChange: (mode: FilterMode) => void;
  onSortChange: (sort: SortBy) => void;
  total: number;
}

const modes: { value: FilterMode; label: string; icon: React.ElementType }[] = [
  { value: 'all',     label: 'All',       icon: Layers },
  { value: 'online',  label: 'Online',    icon: Globe },
  { value: 'offline', label: 'In-Person', icon: Building2 },
  { value: 'hybrid',  label: 'Hybrid',    icon: Wifi },
];

const sorts: { value: SortBy; label: string }[] = [
  { value: 'newest',       label: 'Newest' },
  { value: 'deadline',     label: 'Deadline Soon' },
  { value: 'prize',        label: 'Highest Prize' },
  { value: 'participants', label: 'Most Popular' },
];

export default function FilterBar({ mode, sort, onModeChange, onSortChange, total }: Props) {
  const [sortOpen, setSortOpen] = useState(false);
  const currentSort = sorts.find((s) => s.value === sort)!;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      {/* Mode pills */}
      <div
        className="flex items-center gap-0.5 p-1 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {modes.map((m) => {
          const active = mode === m.value;
          return (
            <motion.button
              key={m.value}
              onClick={() => onModeChange(m.value)}
              className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors duration-200"
              style={{ color: active ? '#fff' : '#52525b' }}
              whileHover={{ color: active ? '#fff' : '#a1a1aa' }}
              whileTap={{ scale: 0.95 }}
            >
              {active && (
                <motion.div
                  layoutId="filter-pill"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.14)' }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <m.icon size={11} className="relative z-10" />
              <span className="relative z-10 hidden sm:inline">{m.label}</span>
              <span className="relative z-10 sm:hidden">{m.label.split('-')[0]}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <AnimatePresence mode="wait">
          <motion.span
            key={total}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="text-xs text-zinc-600 hidden sm:block"
          >
            <span className="text-white font-semibold">{total}</span> hackathons
          </motion.span>
        </AnimatePresence>

        <div className="relative">
          <motion.button
            onClick={() => setSortOpen(!sortOpen)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-500 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
            whileTap={{ scale: 0.96 }}
          >
            <SlidersHorizontal size={11} />
            <span className="hidden sm:inline">{currentSort.label}</span>
            <span className="sm:hidden">Sort</span>
            <motion.div animate={{ rotate: sortOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={11} />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {sortOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ type: 'spring', duration: 0.2, bounce: 0.1 }}
                className="absolute right-0 top-full mt-2 w-44 rounded-2xl overflow-hidden z-40 shadow-[0_24px_64px_rgba(0,0,0,0.8)]"
                style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {sorts.map((s, i) => (
                  <motion.button
                    key={s.value}
                    onClick={() => { onSortChange(s.value); setSortOpen(false); }}
                    className="flex items-center justify-between w-full px-4 py-2.5 text-xs font-medium transition-all"
                    style={{ color: s.value === sort ? '#fff' : '#71717a' }}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff' }}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    {s.label}
                    {s.value === sort && (
                      <motion.div
                        layoutId="sort-check"
                        className="w-1.5 h-1.5 rounded-full bg-white"
                      />
                    )}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
