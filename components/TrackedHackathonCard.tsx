'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExternalLink, Trash2, Calendar, Trophy, Globe, Building2,
  MapPin, Clock,
} from 'lucide-react';
import { UserTrackedHackathon, ChatLink, ApplicationStatus } from '@/types';
import { differenceInDays, isPast } from 'date-fns';
import ApplicationPipeline from './ApplicationPipeline';
import ChatLinksPanel from './ChatLinksPanel';

interface Props {
  item: UserTrackedHackathon;
  index: number;
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: Partial<UserTrackedHackathon>) => void;
}

const PLATFORM_LABELS: Record<string, string> = {
  unstop:      'Unstop',
  devfolio:    'Devfolio',
  devpost:     'Devpost',
  hackerearth: 'HackerEarth',
  dorahacks:   'DoraHacks',
  mlh:         'MLH',
  kaggle:      'Kaggle',
  lablab:      'LabLab',
  other:       'External',
};

const cardVariants = {
  hidden:  { opacity: 0, y: 24, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.5, delay: i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

export default function TrackedHackathonCard({ item, index, onDelete, onUpdate }: Props) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deadline    = item.registration_deadline || item.end_date;
  const isDeadlinePast = deadline ? isPast(new Date(deadline)) : false;
  const daysLeft    = deadline && !isDeadlinePast ? differenceInDays(new Date(deadline), new Date()) : null;
  const isUrgent    = daysLeft !== null && daysLeft <= 3;

  const handleStatusChange = useCallback(async (status: ApplicationStatus) => {
    onUpdate(item.id, { application_status: status });
    setSaving(true);
    try {
      await fetch(`/api/user/tracked/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_status: status }),
      });
    } finally { setSaving(false); }
  }, [item.id, onUpdate]);

  const handleChatLinksUpdate = useCallback(async (links: ChatLink[]) => {
    onUpdate(item.id, { chat_links: links });
    setSaving(true);
    try {
      await fetch(`/api/user/tracked/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_links: links }),
      });
    } finally { setSaving(false); }
  }, [item.id, onUpdate]);

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    await fetch(`/api/user/tracked/${item.id}`, { method: 'DELETE' });
    onDelete(item.id);
  }, [item.id, onDelete, confirmDelete]);

  const platformLabel = PLATFORM_LABELS[item.platform] || item.platform || 'External';

  const deadlineStyle = (() => {
    if (isDeadlinePast)                               return { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)',  color: '#f87171' };
    if (daysLeft !== null && daysLeft <= 3)           return { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)',   color: '#fca5a5' };
    if (daysLeft !== null && daysLeft <= 7)           return { bg: 'rgba(245,158,11,0.09)',border: 'rgba(245,158,11,0.28)', color: '#fcd34d' };
    return { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', color: '#71717a' };
  })();

  const deadlineLabel = deadline
    ? isDeadlinePast ? 'Closed'
    : daysLeft === 0  ? 'Closes today!'
    : daysLeft !== null && daysLeft <= 30 ? `${daysLeft}d left`
    : new Date(deadline).toLocaleDateString('en', { month: 'short', day: 'numeric' })
    : null;

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, scale: 0.95, y: -12 }}
      className="relative group"
    >
      <div
        className="relative rounded-2xl overflow-hidden glass-card"
        style={{ borderColor: item.application_status === 'accepted' ? 'rgba(16,185,129,0.3)'
               : item.application_status === 'rejected'  ? 'rgba(239,68,68,0.2)'
               : undefined }}
      >
        {/* Status accent */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: item.application_status === 'accepted' ? '#10b981'
              : item.application_status === 'rejected'  ? '#ef4444'
              : item.application_status === 'org_shortlisted' ? '#fbbf24'
              : item.application_status === 'applied'   ? '#38bdf8'
              : '#a78bfa',
          }}
        />

        <div className="p-4 flex flex-col gap-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span
                  className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#71717a' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                  {platformLabel}
                </span>
                <span
                  className="inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#52525b' }}
                >
                  {item.mode === 'offline' ? <Building2 size={8} /> : <Globe size={8} />}
                  {item.mode === 'offline' ? 'In-Person' : item.mode.charAt(0).toUpperCase() + item.mode.slice(1)}
                </span>
              </div>

              <h3 className="font-bold text-[14px] leading-snug text-white/85 line-clamp-2 group-hover:text-white transition-colors">
                {item.title}
              </h3>
              {item.organizer && (
                <p className="text-[11px] text-zinc-700 mt-0.5">by {item.organizer}</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {item.url && (
                <motion.a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#52525b' }}
                  whileHover={{ scale: 1.1, color: '#a1a1aa' }}
                  whileTap={{ scale: 0.9 }}
                  title="Open hackathon link"
                >
                  <ExternalLink size={11} />
                </motion.a>
              )}
              <motion.button
                onClick={handleDelete}
                disabled={deleting}
                onMouseLeave={() => setConfirmDelete(false)}
                className="p-1.5 rounded-lg transition-colors"
                style={confirmDelete
                  ? { background: 'rgba(239,68,68,0.15)', color: '#ef4444' }
                  : { background: 'rgba(255,255,255,0.04)', color: '#52525b' }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title={confirmDelete ? 'Click again to confirm delete' : 'Delete'}
              >
                <Trash2 size={11} />
              </motion.button>
            </div>
          </div>

          {/* Prize */}
          {item.prize_amount && (
            <div
              className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl"
              style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)' }}
            >
              <Trophy size={10} className="text-amber-500 flex-shrink-0" />
              <span className="text-[12px] font-black text-amber-400">{item.prize_amount}</span>
            </div>
          )}

          {/* Meta */}
          <div className="flex flex-wrap gap-1.5">
            {deadlineLabel && (
              <motion.div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: deadlineStyle.bg, border: `1px solid ${deadlineStyle.border}`, color: deadlineStyle.color }}
                animate={isUrgent && !isDeadlinePast ? { opacity: [1, 0.55, 1] } : {}}
                transition={{ duration: 1.6, repeat: Infinity }}
              >
                {item.end_date ? <Calendar size={8} /> : <Clock size={8} />}
                {deadlineLabel}
              </motion.div>
            )}
            {item.location && (
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium truncate max-w-[130px]"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#71717a' }}
              >
                <MapPin size={8} />
                <span className="truncate">{item.location}</span>
              </div>
            )}
          </div>

          {/* Application status pipeline */}
          <div>
            <p className="text-[9px] text-zinc-700 font-semibold uppercase tracking-wider mb-1.5">
              Application status {saving && <span className="normal-case text-zinc-800">· saving…</span>}
            </p>
            <ApplicationPipeline
              status={item.application_status}
              onChange={handleStatusChange}
            />
          </div>

          {/* Tags */}
          {item.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
              {item.tags.length > 4 && <span className="tag">+{item.tags.length - 4}</span>}
            </div>
          )}
        </div>

        {/* Chat links panel */}
        <ChatLinksPanel
          chatLinks={item.chat_links || []}
          onUpdate={handleChatLinksUpdate}
          saving={saving}
        />
      </div>

      {/* Delete flash */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -bottom-6 left-0 right-0 text-center text-[10px] text-red-500"
          >
            Click again to confirm delete
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
