'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Bookmark, TrendingUp, PlusCircle } from 'lucide-react';
import { UserStats } from '@/types';
import AnimatedNumber from './AnimatedNumber';

interface Props { stats: UserStats }

const cards = [
  {
    key: 'registered' as keyof UserStats,
    label: 'Registered',
    sub: 'Hackathons applied to',
    icon: CheckCircle,
    glow: 'rgba(16,185,129,0.15)',
    border: 'rgba(16,185,129,0.2)',
    iconBg: 'rgba(16,185,129,0.15)',
    iconColor: '#10b981',
    ring: 'rgba(16,185,129,0.4)',
  },
  {
    key: 'shortlisted' as keyof UserStats,
    label: 'Shortlisted',
    sub: 'Saved for later',
    icon: Bookmark,
    glow: 'rgba(124,58,237,0.15)',
    border: 'rgba(124,58,237,0.2)',
    iconBg: 'rgba(124,58,237,0.15)',
    iconColor: '#a78bfa',
    ring: 'rgba(124,58,237,0.4)',
  },
  {
    key: 'tracked' as keyof UserStats,
    label: 'Manually Tracked',
    sub: 'From other platforms',
    icon: PlusCircle,
    glow: 'rgba(56,189,248,0.15)',
    border: 'rgba(56,189,248,0.2)',
    iconBg: 'rgba(56,189,248,0.15)',
    iconColor: '#38bdf8',
    ring: 'rgba(56,189,248,0.4)',
  },
  {
    key: 'total' as keyof UserStats,
    label: 'Total Tracked',
    sub: 'Across all hackathons',
    icon: TrendingUp,
    glow: 'rgba(245,158,11,0.15)',
    border: 'rgba(245,158,11,0.2)',
    iconBg: 'rgba(245,158,11,0.15)',
    iconColor: '#f59e0b',
    ring: 'rgba(245,158,11,0.4)',
  },
];

export default function StatsPanel({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-2xl p-5 overflow-hidden group hover:scale-[1.02] transition-transform duration-300"
          style={{
            background: `linear-gradient(135deg, ${card.glow}, rgba(14,14,26,0.8))`,
            border: `1px solid ${card.border}`,
          }}
        >
          <div
            className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 opacity-50 group-hover:opacity-80"
            style={{ background: card.glow, transform: 'translate(40%, -40%)' }}
          />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <motion.div
                className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: card.iconBg, border: `1px solid ${card.ring}` }}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <card.icon size={18} style={{ color: card.iconColor }} />
              </motion.div>
              <p className="text-3xl font-black text-white tracking-tight leading-none mb-1">
                <AnimatedNumber value={stats[card.key]} />
              </p>
              <p className="text-xs font-semibold text-zinc-300">{card.label}</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">{card.sub}</p>
            </div>
            <div className="flex items-end gap-0.5 h-12 opacity-30">
              {[3, 6, 4, 8, 5, 9, 7].map((h, j) => (
                <motion.div
                  key={j}
                  className="w-1.5 rounded-full"
                  style={{ background: card.iconColor, height: `${h * 5}%` }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: i * 0.08 + j * 0.04, duration: 0.4 }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
