'use client';

import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Users, Trophy, Bookmark, CheckCircle, ExternalLink, Globe, Building2, Clock } from 'lucide-react';
import { Hackathon } from '@/types';
import { formatDistanceToNow, isPast, differenceInDays } from 'date-fns';
import Image from 'next/image';
import { useRef, useState, useCallback } from 'react';

interface Props {
  hackathon: Hackathon;
  userStatus: 'registered' | 'shortlisted' | null;
  isLoggedIn: boolean;
  onStatusChange: (id: string, status: 'registered' | 'shortlisted' | null) => void;
  index: number;
}

const sourceBadge: Record<string, { classes: string; dot: string }> = {
  devpost:     { classes: 'bg-sky-500/15 text-sky-300 border-sky-500/25',      dot: 'bg-sky-400' },
  mlh:         { classes: 'bg-red-500/15 text-red-300 border-red-500/25',       dot: 'bg-red-400' },
  hackerearth: { classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25', dot: 'bg-emerald-400' },
  unstop:      { classes: 'bg-orange-500/15 text-orange-300 border-orange-500/25',    dot: 'bg-orange-400' },
  devfolio:    { classes: 'bg-purple-500/15 text-purple-300 border-purple-500/25',    dot: 'bg-purple-400' },
};
const defaultBadge = { classes: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/25', dot: 'bg-zinc-400' };

const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.5, delay: i * 0.055, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

function Ripple({ x, y }: { x: number; y: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: x - 20, top: y - 20, width: 40, height: 40, background: 'rgba(255,255,255,0.2)' }}
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: 5, opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    />
  );
}

function ActionBtn({
  active, activeColor, icon: Icon, iconFill, label, onClick,
}: {
  active: boolean;
  activeColor: string;
  icon: React.ElementType;
  iconFill?: boolean;
  label: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const handleClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const id = Date.now();
    setRipples((r) => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 600);
    onClick(e);
  };

  return (
    <motion.button
      onClick={handleClick}
      title={label}
      className="relative overflow-hidden p-2 rounded-xl border transition-all duration-200"
      style={
        active
          ? { background: activeColor + '22', borderColor: activeColor + '66', color: activeColor }
          : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#52525b' }
      }
      whileHover={{ scale: 1.13, borderColor: active ? undefined : activeColor + '55', color: active ? undefined : activeColor }}
      whileTap={{ scale: 0.88 }}
    >
      <AnimatePresence>
        {active && (
          <motion.div
            className="absolute inset-0 rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: activeColor + '18' }}
          />
        )}
      </AnimatePresence>
      <Icon size={14} fill={iconFill && active ? 'currentColor' : 'none'} className="relative z-10" />
      {ripples.map((rp) => <Ripple key={rp.id} x={rp.x} y={rp.y} />)}
    </motion.button>
  );
}

export default function HackathonCard({ hackathon, userStatus, isLoggedIn, onStatusChange, index }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [4, -4]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-4, 4]), { stiffness: 300, damping: 30 });
  const glowX = useTransform(mouseX, [-0.5, 0.5], [0, 100]);
  const glowY = useTransform(mouseY, [-0.5, 0.5], [0, 100]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  const isDeadlinePast = hackathon.registration_deadline ? isPast(new Date(hackathon.registration_deadline)) : false;
  const daysLeft = hackathon.registration_deadline && !isDeadlinePast
    ? differenceInDays(new Date(hackathon.registration_deadline), new Date())
    : null;
  const isUrgent = daysLeft !== null && daysLeft <= 3;

  const deadlineText = hackathon.registration_deadline
    ? isDeadlinePast ? 'Closed'
    : formatDistanceToNow(new Date(hackathon.registration_deadline), { addSuffix: true })
    : null;

  const badge = sourceBadge[hackathon.source] ?? defaultBadge;

  const gradients = [
    'from-violet-900/60 via-indigo-900/40 to-blue-900/60',
    'from-rose-900/60 via-pink-900/40 to-purple-900/60',
    'from-emerald-900/60 via-teal-900/40 to-cyan-900/60',
    'from-amber-900/60 via-orange-900/40 to-red-900/60',
    'from-sky-900/60 via-blue-900/40 to-indigo-900/60',
  ];
  const gradientIndex = hackathon.id ? hackathon.id.charCodeAt(0) % gradients.length : 0;

  return (
    <motion.div
      ref={cardRef}
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 800, transformStyle: 'preserve-3d' }}
      className="relative group cursor-default"
    >
      {/* Glow layer */}
      <motion.div
        className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${glowX.get()}% ${glowY.get()}%, rgba(124,58,237,0.25), transparent 60%)`,
          zIndex: -1,
        }}
      />

      <div
        className="relative h-full rounded-2xl overflow-hidden transition-all duration-300 group-hover:shadow-[0_24px_60px_-8px_rgba(0,0,0,0.6),0_0_0_1px_rgba(124,58,237,0.25)]"
        style={{ background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Status accent line */}
        <AnimatePresence>
          {userStatus && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ scaleX: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className={`absolute top-0 left-0 right-0 h-[2.5px] origin-left z-10 ${
                userStatus === 'registered'
                  ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500'
                  : 'bg-gradient-to-r from-violet-400 via-purple-400 to-blue-500'
              }`}
            />
          )}
        </AnimatePresence>

        {/* Image / Hero area */}
        <div className="relative h-44 overflow-hidden">
          {hackathon.image_url ? (
            <>
              <Image
                src={hackathon.image_url}
                alt={hackathon.title}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e1a] via-[#0e0e1a]/40 to-transparent" />
            </>
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradients[gradientIndex]} flex items-center justify-center`}>
              <motion.div
                className="float"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Trophy size={36} className="text-white/20" />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e1a] via-transparent to-transparent" />
              {/* Dot grid decoration */}
              <div className="absolute inset-0 dot-grid opacity-30" />
            </div>
          )}

          {/* Badges row */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.055 + 0.2 }}
              className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border uppercase tracking-wider ${badge.classes}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
              {hackathon.source}
            </motion.span>

            <motion.span
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.055 + 0.25 }}
              className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full backdrop-blur-md ${
                hackathon.mode === 'online'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : hackathon.mode === 'offline'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
              }`}
            >
              {hackathon.mode === 'offline' ? <Building2 size={10} /> : <Globe size={10} />}
              {hackathon.mode === 'offline' ? 'In-Person' : hackathon.mode.charAt(0).toUpperCase() + hackathon.mode.slice(1)}
            </motion.span>
          </div>

          {/* Urgent deadline overlay */}
          {isUrgent && (
            <motion.div
              className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-red-500/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm deadline-urgent"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Clock size={10} />
              {daysLeft === 0 ? 'Closes today!' : `${daysLeft}d left!`}
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-3">
          {/* Title & organizer */}
          <div>
            <h3 className="font-bold text-[14.5px] leading-snug text-white/90 line-clamp-2 group-hover:text-white transition-colors duration-200 mb-0.5">
              {hackathon.title}
            </h3>
            {hackathon.organizer && (
              <p className="text-[11px] text-zinc-500 font-medium">by {hackathon.organizer}</p>
            )}
          </div>

          {/* Description */}
          {hackathon.description && (
            <p className="text-[12px] text-zinc-400 line-clamp-2 leading-relaxed">
              {hackathon.description}
            </p>
          )}

          {/* Tags */}
          {hackathon.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {hackathon.tags.slice(0, 3).map((tag) => (
                <motion.span
                  key={tag}
                  className="tag"
                  whileHover={{ scale: 1.06 }}
                >
                  {tag}
                </motion.span>
              ))}
              {hackathon.tags.length > 3 && (
                <span className="tag">+{hackathon.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {deadlineText && (
              <div className="flex items-center gap-1.5 col-span-2">
                <Calendar size={11} className={isDeadlinePast ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-violet-400'} />
                <span className={`text-[11px] font-medium ${isDeadlinePast ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-zinc-400'}`}>
                  {isDeadlinePast ? 'Registration closed' : `Closes ${deadlineText}`}
                </span>
              </div>
            )}

            {hackathon.location && (
              <div className="flex items-center gap-1.5 col-span-2">
                <MapPin size={11} className="text-orange-400 flex-shrink-0" />
                <span className="text-[11px] text-zinc-400 truncate">{hackathon.location}</span>
              </div>
            )}

            {hackathon.participants_count > 0 && (
              <div className="flex items-center gap-1.5">
                <Users size={11} className="text-sky-400" />
                <span className="text-[11px] text-zinc-400">
                  {hackathon.participants_count >= 1000
                    ? `${(hackathon.participants_count / 1000).toFixed(1)}k`
                    : hackathon.participants_count}
                </span>
              </div>
            )}

            {hackathon.prize_amount && (
              <div className="flex items-center gap-1.5 justify-end">
                <Trophy size={11} className="text-amber-400" />
                <span className="text-[11px] font-bold text-amber-400">{hackathon.prize_amount}</span>
              </div>
            )}
          </div>

          {/* Deadline urgency bar */}
          {!isDeadlinePast && hackathon.registration_deadline && (
            <div className="h-0.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${isUrgent ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-violet-500 to-blue-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(5, Math.min(100, 100 - (daysLeft ?? 0) * 2))}%` }}
                transition={{ duration: 0.8, delay: index * 0.055 + 0.3, ease: 'easeOut' }}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1.5 border-t border-white/[0.05]">
            <motion.a
              href={hackathon.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-semibold py-2 px-3 rounded-xl transition-all duration-200 btn-glow"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(99,102,241,0.15))',
                border: '1px solid rgba(124,58,237,0.3)',
                color: '#c4b5fd',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
            >
              <ExternalLink size={11} />
              Register
            </motion.a>

            {isLoggedIn ? (
              <>
                <ActionBtn
                  active={userStatus === 'shortlisted'}
                  activeColor="#7c3aed"
                  icon={Bookmark}
                  iconFill
                  label={userStatus === 'shortlisted' ? 'Remove shortlist' : 'Shortlist'}
                  onClick={(e) => { e.preventDefault(); onStatusChange(hackathon.id, userStatus === 'shortlisted' ? null : 'shortlisted'); }}
                />
                <ActionBtn
                  active={userStatus === 'registered'}
                  activeColor="#10b981"
                  icon={CheckCircle}
                  label={userStatus === 'registered' ? 'Unmark registered' : 'Mark registered'}
                  onClick={(e) => { e.preventDefault(); onStatusChange(hackathon.id, userStatus === 'registered' ? null : 'registered'); }}
                />
              </>
            ) : (
              <div className="flex items-center gap-1 text-[10px] text-zinc-600 font-medium">
                Sign in to track
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
