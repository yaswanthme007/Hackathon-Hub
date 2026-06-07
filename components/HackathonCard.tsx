'use client';

import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Users, Trophy, Bookmark, CheckCircle, ExternalLink, Globe, Building2, Clock } from 'lucide-react';
import { Hackathon } from '@/types';
import { formatDistanceToNow, isPast, differenceInDays } from 'date-fns';
import Image from 'next/image';
import { useRef, useState, useCallback, useMemo } from 'react';

interface Props {
  hackathon: Hackathon;
  userStatus: 'registered' | 'shortlisted' | null;
  isLoggedIn: boolean;
  onStatusChange: (id: string, status: 'registered' | 'shortlisted' | null) => void;
  onTagClick?: (tag: string) => void;
  index: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.55, delay: i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

// Strip HTML tags from strings (prize amounts from Devpost come as HTML)
function cleanHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim() || null;
}

type PlaceholderTheme = { label: string; color: string; glow: string };

function getPlaceholderTheme(tags: string[], title: string): PlaceholderTheme {
  const text = [...(tags ?? []), title].join(' ').toLowerCase();

  if (/\b(ai|artificial intelligence|machine learning|ml|llm|gpt|nlp|deep learning)\b/.test(text))
    return { label: 'AI · ML', color: '#818cf8', glow: 'rgba(99,102,241,0.18)' };
  if (/\b(web3|blockchain|defi|crypto|nft|dao|solidity|ethereum)\b/.test(text))
    return { label: 'WEB3', color: '#fb923c', glow: 'rgba(249,115,22,0.15)' };
  if (/\b(gaming|game|unity|unreal|indie|pixel)\b/.test(text))
    return { label: 'GAME', color: '#facc15', glow: 'rgba(234,179,8,0.15)' };
  if (/\b(health|medical|biotech|bio|wellness|mental|clinical)\b/.test(text))
    return { label: 'HEALTH', color: '#f472b6', glow: 'rgba(244,114,182,0.15)' };
  if (/\b(design|ui|ux|creative|art|visual|figma)\b/.test(text))
    return { label: 'DESIGN', color: '#c084fc', glow: 'rgba(192,132,252,0.15)' };
  if (/\b(mobile|android|ios|flutter|swift|kotlin|app)\b/.test(text))
    return { label: 'MOBILE', color: '#34d399', glow: 'rgba(52,211,153,0.15)' };
  if (/\b(iot|hardware|embedded|robotics|arduino|raspberry|drone)\b/.test(text))
    return { label: 'IOT', color: '#67e8f9', glow: 'rgba(103,232,249,0.15)' };
  if (/\b(data|analytics|visualization|dashboard|bi|database)\b/.test(text))
    return { label: 'DATA', color: '#60a5fa', glow: 'rgba(96,165,250,0.15)' };
  if (/\b(social|climate|environment|impact|good|sustainability|green)\b/.test(text))
    return { label: 'IMPACT', color: '#4ade80', glow: 'rgba(74,222,128,0.15)' };
  if (/\b(security|cyber|ctf|pentest|infosec|hacking)\b/.test(text))
    return { label: 'SEC', color: '#f87171', glow: 'rgba(248,113,113,0.15)' };
  if (/\b(web|frontend|backend|api|javascript|typescript|react|node|next|vue)\b/.test(text))
    return { label: 'WEB', color: '#38bdf8', glow: 'rgba(56,189,248,0.15)' };
  if (/\b(education|edtech|learning|student|university|open ended|beginner)\b/.test(text))
    return { label: 'EDU', color: '#a3e635', glow: 'rgba(163,230,53,0.15)' };
  if (/\b(enterprise|devops|cloud|saas|b2b|startup)\b/.test(text))
    return { label: 'CLOUD', color: '#94a3b8', glow: 'rgba(148,163,184,0.15)' };

  return { label: 'HACK', color: '#a1a1aa', glow: 'rgba(161,161,170,0.12)' };
}

function PlaceholderImage({ tags, title }: { tags: string[]; title: string }) {
  const theme = useMemo(() => getPlaceholderTheme(tags, title), [tags, title]);
  return (
    <div className="w-full h-full relative overflow-hidden" style={{ background: '#080808' }}>
      <div className="absolute inset-0"
        style={{ background: `radial-gradient(ellipse at 50% 75%, ${theme.glow} 0%, transparent 65%)` }} />
      <div className="absolute inset-0 dot-grid opacity-20" />
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ y: [0, -7, 0], opacity: [0.45, 0.72, 0.45] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span
          className="text-[26px] font-black tracking-[0.22em] select-none"
          style={{ color: theme.color, textShadow: `0 0 80px ${theme.glow}` }}
        >
          {theme.label}
        </span>
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/50 to-transparent" />
    </div>
  );
}

function Ripple({ x, y }: { x: number; y: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: x - 20, top: y - 20, width: 40, height: 40, background: 'rgba(255,255,255,0.15)' }}
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
          ? { background: activeColor + '18', borderColor: activeColor + '55', color: activeColor }
          : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#52525b' }
      }
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.88 }}
    >
      <AnimatePresence>
        {active && (
          <motion.div
            className="absolute inset-0 rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: activeColor + '12' }}
          />
        )}
      </AnimatePresence>
      <Icon size={13} fill={iconFill && active ? 'currentColor' : 'none'} className="relative z-10" />
      {ripples.map((rp) => <Ripple key={rp.id} x={rp.x} y={rp.y} />)}
    </motion.button>
  );
}

export default function HackathonCard({ hackathon, userStatus, isLoggedIn, onStatusChange, onTagClick, index }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const glowX = useTransform(mouseX, [-0.5, 0.5], [20, 80]);
  const glowY = useTransform(mouseY, [-0.5, 0.5], [20, 80]);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [3, -3]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-3, 3]), { stiffness: 300, damping: 30 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => { mouseX.set(0); mouseY.set(0); }, [mouseX, mouseY]);

  const isDeadlinePast = hackathon.registration_deadline ? isPast(new Date(hackathon.registration_deadline)) : false;
  const daysLeft = hackathon.registration_deadline && !isDeadlinePast
    ? differenceInDays(new Date(hackathon.registration_deadline), new Date()) : null;
  const isUrgent = daysLeft !== null && daysLeft <= 3;

  const deadlineText = hackathon.registration_deadline
    ? isDeadlinePast ? 'Closed'
    : formatDistanceToNow(new Date(hackathon.registration_deadline), { addSuffix: true })
    : null;

  const sourceLabel = hackathon.source?.toUpperCase() ?? 'OTHER';
  const prizeAmount = cleanHtml(hackathon.prize_amount);

  return (
    <motion.div
      ref={cardRef}
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 900, transformStyle: 'preserve-3d' }}
      className="relative group cursor-default"
    >
      {/* Mouse-follow glow */}
      <motion.div
        className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255,255,255,0.07) 0%, transparent 60%)`,
          zIndex: 0,
        }}
      />

      <div
        className="relative h-full rounded-2xl overflow-hidden glass-card"
        style={{ zIndex: 1 }}
      >
        {/* Status accent line */}
        <AnimatePresence>
          {userStatus && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ scaleX: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className={`absolute top-0 left-0 right-0 h-[2px] origin-left z-10 ${
                userStatus === 'registered' ? 'bg-emerald-400' : 'bg-white/50'
              }`}
            />
          )}
        </AnimatePresence>

        {/* Image area */}
        <div className="relative h-44 overflow-hidden">
          {hackathon.image_url ? (
            <>
              <Image
                src={hackathon.image_url}
                alt={hackathon.title}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/50 to-transparent" />
            </>
          ) : (
            <PlaceholderImage tags={hackathon.tags ?? []} title={hackathon.title} />
          )}

          {/* Top badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06 + 0.2 }}
              className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider"
              style={{ background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.12)', color: '#a1a1aa', backdropFilter: 'blur(8px)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
              {sourceLabel}
            </motion.span>

            <motion.span
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06 + 0.25 }}
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full"
              style={{ background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.10)', color: '#a1a1aa', backdropFilter: 'blur(8px)' }}
            >
              {hackathon.mode === 'offline' ? <Building2 size={9} /> : <Globe size={9} />}
              {hackathon.mode === 'offline' ? 'In-Person' : hackathon.mode?.charAt(0).toUpperCase() + hackathon.mode?.slice(1)}
            </motion.span>
          </div>

          {/* Urgency badge */}
          {isUrgent && (
            <motion.div
              className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-[10px] font-bold px-2.5 py-1 rounded-full deadline-urgent"
              style={{ background: 'rgba(239,68,68,0.9)', backdropFilter: 'blur(8px)' }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Clock size={9} />
              {daysLeft === 0 ? 'Closes today!' : `${daysLeft}d left!`}
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-3.5">

          {/* Title & organizer */}
          <div>
            <h3 className="font-bold text-[14px] leading-snug text-white/85 line-clamp-2 group-hover:text-white transition-colors duration-200">
              {hackathon.title}
            </h3>
            {hackathon.organizer && (
              <p className="text-[11px] text-zinc-700 mt-1">by {hackathon.organizer}</p>
            )}
          </div>

          {/* Tags — clickable */}
          {hackathon.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {hackathon.tags.slice(0, 3).map((tag, tagIndex) => (
                <motion.button
                  key={tag}
                  className="tag"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.06 + 0.22 + tagIndex * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
                  whileHover={{ scale: 1.08, backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.22)', color: '#fff' }}
                  whileTap={{ scale: 0.93 }}
                  onClick={(e) => { e.stopPropagation(); onTagClick?.(tag); }}
                  style={{ cursor: onTagClick ? 'pointer' : 'default' }}
                >
                  {tag}
                </motion.button>
              ))}
              {hackathon.tags.length > 3 && (
                <span className="tag" style={{ cursor: 'default' }}>+{hackathon.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Prize — standalone prominent row */}
          {prizeAmount && (
            <motion.div
              className="flex items-center gap-2 py-2.5 px-3 rounded-xl"
              style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)' }}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06 + 0.3 }}
              whileHover={{ backgroundColor: 'rgba(245,158,11,0.11)', borderColor: 'rgba(245,158,11,0.25)' }}
            >
              <Trophy size={12} className="text-amber-500 flex-shrink-0" />
              <span className="text-sm font-black text-amber-400 tracking-tight">{prizeAmount}</span>
              <span className="text-[10px] text-amber-700 ml-auto font-medium">Prize Pool</span>
            </motion.div>
          )}

          {/* Meta */}
          <div className="space-y-2">
            {deadlineText && (
              <div className="flex items-center gap-2">
                <Calendar size={11} className={`flex-shrink-0 ${isDeadlinePast ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-zinc-600'}`} />
                <span className={`text-[11px] font-medium ${isDeadlinePast ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-zinc-500'}`}>
                  {isDeadlinePast ? 'Registration closed' : `Closes ${deadlineText}`}
                </span>
              </div>
            )}
            {hackathon.location && (
              <div className="flex items-center gap-2">
                <MapPin size={11} className="text-zinc-600 flex-shrink-0" />
                <span className="text-[11px] text-zinc-500 truncate">{hackathon.location}</span>
              </div>
            )}
            {hackathon.participants_count > 0 && (
              <div className="flex items-center gap-2">
                <Users size={11} className="text-zinc-600 flex-shrink-0" />
                <span className="text-[11px] text-zinc-500">
                  {hackathon.participants_count >= 1000
                    ? `${(hackathon.participants_count / 1000).toFixed(1)}k participants`
                    : `${hackathon.participants_count} participants`}
                </span>
              </div>
            )}
          </div>

          {/* Deadline progress bar */}
          {!isDeadlinePast && hackathon.registration_deadline && (
            <div className="h-px rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${isUrgent ? 'bg-red-500' : 'bg-white/20'}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(4, Math.min(100, 100 - (daysLeft ?? 0) * 2))}%` }}
                transition={{ duration: 0.9, delay: index * 0.06 + 0.35, ease: 'easeOut' }}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-0.5 border-t border-white/[0.05]">
            <motion.a
              href={hackathon.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-semibold py-2.5 px-3 rounded-xl transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#e4e4e7' }}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.13)', borderColor: 'rgba(255,255,255,0.25)', color: '#fff', scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
            >
              <ExternalLink size={10} /> Register
            </motion.a>

            {isLoggedIn ? (
              <>
                <ActionBtn
                  active={userStatus === 'shortlisted'} activeColor="#ffffff"
                  icon={Bookmark} iconFill
                  label={userStatus === 'shortlisted' ? 'Remove shortlist' : 'Shortlist'}
                  onClick={(e) => { e.preventDefault(); onStatusChange(hackathon.id, userStatus === 'shortlisted' ? null : 'shortlisted'); }}
                />
                <ActionBtn
                  active={userStatus === 'registered'} activeColor="#10b981"
                  icon={CheckCircle}
                  label={userStatus === 'registered' ? 'Unmark registered' : 'Mark registered'}
                  onClick={(e) => { e.preventDefault(); onStatusChange(hackathon.id, userStatus === 'registered' ? null : 'registered'); }}
                />
              </>
            ) : (
              <p className="text-[10px] text-zinc-700 font-medium whitespace-nowrap">Sign in to track</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
