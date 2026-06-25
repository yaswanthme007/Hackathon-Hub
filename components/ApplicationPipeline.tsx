'use client';

import { motion } from 'framer-motion';
import { ApplicationStatus } from '@/types';

interface Props {
  status: ApplicationStatus;
  onChange?: (status: ApplicationStatus) => void;
  compact?: boolean;
}

type Stage = {
  key: ApplicationStatus;
  label: string;
  shortLabel: string;
  color: string;
};

const STAGES: Stage[] = [
  { key: 'shortlisted',    label: 'Shortlisted',       shortLabel: 'Listed',   color: '#a78bfa' },
  { key: 'applied',        label: 'Applied',           shortLabel: 'Applied',  color: '#38bdf8' },
  { key: 'org_shortlisted',label: 'Org Shortlisted',   shortLabel: 'Org Pick', color: '#fbbf24' },
  { key: 'accepted',       label: 'Accepted',          shortLabel: 'Won',      color: '#10b981' },
  { key: 'rejected',       label: 'Rejected',          shortLabel: 'Closed',   color: '#ef4444' },
];

const ORDER: ApplicationStatus[] = ['shortlisted', 'applied', 'org_shortlisted', 'accepted'];
const STATUS_INDEX: Record<ApplicationStatus, number> = {
  shortlisted:    0,
  applied:        1,
  org_shortlisted:2,
  accepted:       3,
  rejected:       3,
};

export default function ApplicationPipeline({ status, onChange, compact }: Props) {
  const isRejected   = status === 'rejected';
  const currentIndex = STATUS_INDEX[status];

  if (compact) {
    const stage = STAGES.find((s) => s.key === status) || STAGES[1];
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
        style={{ background: stage.color + '18', border: `1px solid ${stage.color}33`, color: stage.color }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: stage.color }} />
        {stage.label}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {ORDER.map((key, i) => {
        const stage   = STAGES.find((s) => s.key === key)!;
        const past    = i < currentIndex && !isRejected;
        const current = status === key;
        const active  = past || current;

        return (
          <div key={key} className="flex items-center gap-1">
            <motion.button
              onClick={() => onChange?.(key)}
              disabled={!onChange}
              className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all"
              style={
                current
                  ? { background: stage.color + '22', border: `1px solid ${stage.color}55`, color: stage.color }
                  : active
                  ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: stage.color + 'bb' }
                  : { background: 'transparent', border: '1px solid transparent', color: '#3f3f46' }
              }
              whileHover={onChange ? { scale: 1.06 } : {}}
              whileTap={onChange ? { scale: 0.94 } : {}}
            >
              {active && (
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? stage.color : '#3f3f46' }} />
              )}
              {stage.shortLabel}
            </motion.button>

            {/* Connector — skip after last stage in the main track */}
            {i < ORDER.length - 1 && (
              <span
                className="text-[8px] leading-none"
                style={{ color: i < currentIndex && !isRejected ? '#52525b' : '#27272a' }}
              >
                →
              </span>
            )}
          </div>
        );
      })}

      {/* Rejected badge alongside accepted */}
      <motion.button
        onClick={() => onChange?.('rejected')}
        disabled={!onChange}
        className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all ml-0.5"
        style={
          isRejected
            ? { background: '#ef444422', border: '1px solid #ef444455', color: '#ef4444' }
            : { background: 'transparent', border: '1px solid transparent', color: '#3f3f46' }
        }
        whileHover={onChange ? { scale: 1.06 } : {}}
        whileTap={onChange ? { scale: 0.94 } : {}}
      >
        {isRejected && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
        Closed
      </motion.button>
    </div>
  );
}
