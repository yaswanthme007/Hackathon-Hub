'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import StatsPanel from '@/components/StatsPanel';
import HackathonCard from '@/components/HackathonCard';
import TrackedHackathonCard from '@/components/TrackedHackathonCard';
import AddHackathonModal from '@/components/AddHackathonModal';
import SkeletonCard from '@/components/SkeletonCard';
import { UserStats, Hackathon, ChatLink, UserTrackedHackathon } from '@/types';
import {
  Loader2, Bookmark, CheckCircle, Zap, ArrowRight,
  Trophy, Star, Flame, Target, Plus, PlusCircle,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface UserHackathonRow {
  status: string;
  hackathon_id: string;
  chat_links: ChatLink[];
  created_at: string;
  hackathons: Hackathon;
}

type DashTab = 'registered' | 'shortlisted' | 'tracked';

function EmptyState({ tab, onAdd }: { tab: DashTab; onAdd?: () => void }) {
  const cfg = {
    registered: {
      color: '#10b981',
      icon: CheckCircle,
      title: 'No registered hackathons yet',
      desc: 'Click the ✓ button on any hackathon card to mark it as registered.',
      cta: 'Browse hackathons',
      href: '/' as const,
    },
    shortlisted: {
      color: '#a78bfa',
      icon: Bookmark,
      title: 'No shortlisted hackathons yet',
      desc: 'Click the bookmark icon on any card to save it for later.',
      cta: 'Browse hackathons',
      href: '/' as const,
    },
    tracked: {
      color: '#38bdf8',
      icon: PlusCircle,
      title: 'No externally tracked hackathons',
      desc: 'Add hackathons from Unstop, Devfolio, or any other platform and track your application status.',
      cta: 'Track a Hackathon',
      href: null as null,
    },
  };
  const c = cfg[tab];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-24 gap-5"
    >
      <motion.div
        className="w-20 h-20 rounded-3xl flex items-center justify-center"
        style={{ background: c.color + '12', border: `1px solid ${c.color}28` }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <c.icon size={32} style={{ color: c.color + '99' }} />
      </motion.div>
      <div className="text-center">
        <p className="text-white font-bold text-lg mb-1">{c.title}</p>
        <p className="text-zinc-500 text-sm max-w-xs">{c.desc}</p>
      </div>
      {c.href ? (
        <Link href={c.href}>
          <motion.div
            className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full"
            style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)', color: '#c4b5fd' }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            {c.cta} <ArrowRight size={14} />
          </motion.div>
        </Link>
      ) : (
        <motion.button
          onClick={onAdd}
          className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full"
          style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.25)', color: '#7dd3fc' }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          <Plus size={14} /> {c.cta}
        </motion.button>
      )}
    </motion.div>
  );
}

function AchievementBadge({ icon: Icon, label, color, unlocked }: {
  icon: React.ElementType; label: string; color: string; unlocked: boolean;
}) {
  return (
    <motion.div className="flex flex-col items-center gap-1.5" whileHover={{ scale: 1.05 }}>
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300"
        style={unlocked
          ? { background: color + '20', border: `1px solid ${color}40` }
          : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <Icon size={18} style={{ color: unlocked ? color : '#3f3f46' }} />
      </div>
      <span className={`text-[10px] font-medium ${unlocked ? 'text-zinc-400' : 'text-zinc-700'}`}>{label}</span>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats]           = useState<UserStats>({ registered: 0, shortlisted: 0, tracked: 0, total: 0 });
  const [registered, setRegistered] = useState<UserHackathonRow[]>([]);
  const [shortlisted, setShortlisted] = useState<UserHackathonRow[]>([]);
  const [tracked, setTracked]       = useState<UserTrackedHackathon[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState<DashTab>('registered');
  const [userStatusMap, setUserStatusMap] = useState<Record<string, 'registered' | 'shortlisted'>>({});
  const [chatLinksMap, setChatLinksMap]   = useState<Record<string, ChatLink[]>>({});
  const [savingChatFor, setSavingChatFor] = useState<string | null>(null);
  const [modalOpen, setModalOpen]   = useState(false);

  const loadData = useCallback(() => {
    if (!session) return;
    setLoading(true);
    fetch('/api/user/stats')
      .then((r) => r.json())
      .then((d) => {
        setStats(d.stats || { registered: 0, shortlisted: 0, tracked: 0, total: 0 });
        setRegistered(d.registered || []);
        setShortlisted(d.shortlisted || []);
        setTracked(d.tracked || []);

        const statusMap: Record<string, 'registered' | 'shortlisted'> = {};
        const linksMap:  Record<string, ChatLink[]> = {};
        [...(d.registered || []), ...(d.shortlisted || [])].forEach((row: UserHackathonRow) => {
          statusMap[row.hackathon_id] = row.status as 'registered' | 'shortlisted';
          linksMap[row.hackathon_id]  = row.chat_links || [];
        });
        setUserStatusMap(statusMap);
        setChatLinksMap(linksMap);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleStatusChange = useCallback(async (hackathonId: string, newStatus: 'registered' | 'shortlisted' | null) => {
    if (!session) return;
    const prev = { ...userStatusMap };
    if (newStatus === null) {
      const next = { ...userStatusMap };
      delete next[hackathonId];
      setUserStatusMap(next);
      setRegistered((r) => r.filter((h) => h.hackathon_id !== hackathonId));
      setShortlisted((r) => r.filter((h) => h.hackathon_id !== hackathonId));
      setStats((s) => ({
        ...s,
        registered:  prev[hackathonId] === 'registered'  ? s.registered  - 1 : s.registered,
        shortlisted: prev[hackathonId] === 'shortlisted' ? s.shortlisted - 1 : s.shortlisted,
        total: s.total - 1,
      }));
    } else {
      setUserStatusMap((m) => ({ ...m, [hackathonId]: newStatus }));
    }
    try {
      if (newStatus === null) {
        await fetch('/api/user/status', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hackathon_id: hackathonId }) });
      } else {
        await fetch('/api/user/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hackathon_id: hackathonId, status: newStatus }) });
      }
    } catch { setUserStatusMap(prev); }
  }, [session, userStatusMap]);

  const handleChatLinksUpdate = useCallback(async (hackathonId: string, links: ChatLink[]) => {
    setChatLinksMap((m) => ({ ...m, [hackathonId]: links }));
    setSavingChatFor(hackathonId);
    try {
      await fetch('/api/user/chat-links', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hackathon_id: hackathonId, chat_links: links }),
      });
    } finally { setSavingChatFor(null); }
  }, []);

  const handleTrackedUpdate = useCallback((id: string, patch: Partial<UserTrackedHackathon>) => {
    setTracked((items) => items.map((t) => t.id === id ? { ...t, ...patch } : t));
  }, []);

  const handleTrackedDelete = useCallback((id: string) => {
    setTracked((items) => items.filter((t) => t.id !== id));
    setStats((s) => ({ ...s, tracked: s.tracked - 1, total: s.total - 1 }));
  }, []);

  const handleTrackedSaved = useCallback((item: UserTrackedHackathon) => {
    setTracked((items) => [item, ...items]);
    setStats((s) => ({ ...s, tracked: s.tracked + 1, total: s.total + 1 }));
  }, []);

  /* ── Loading screen ── */
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#07070f' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Loader2 size={28} className="text-violet-400" />
        </motion.div>
      </div>
    );
  }

  /* ── Not signed in ── */
  if (!session) {
    return (
      <div className="min-h-screen" style={{ background: '#07070f' }}>
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[88vh] gap-7 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.2))', border: '1px solid rgba(124,58,237,0.3)' }}
          >
            <Zap size={30} className="text-violet-400" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center">
            <h2 className="text-2xl font-black text-white mb-2">Your Dashboard</h2>
            <p className="text-zinc-400 text-sm max-w-xs">Sign in to track registrations, shortlists, and your hackathon journey.</p>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => signIn('google')}
            className="btn-glow flex items-center gap-2.5 text-white font-semibold px-7 py-3.5 rounded-full"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            Sign in with Google
          </motion.button>
        </div>
      </div>
    );
  }

  const achievements = [
    { icon: Star,   label: 'First Hack', color: '#f59e0b', unlocked: stats.total >= 1 },
    { icon: Flame,  label: 'On Fire',    color: '#ef4444', unlocked: stats.registered >= 3 },
    { icon: Target, label: 'Focused',    color: '#38bdf8', unlocked: stats.shortlisted >= 5 },
    { icon: Trophy, label: 'Champion',   color: '#a78bfa', unlocked: stats.registered >= 10 },
  ];

  const TABS: { key: DashTab; label: string; icon: React.ElementType; count: number; color: string }[] = [
    { key: 'registered',  label: 'Registered', icon: CheckCircle, count: stats.registered,  color: '#10b981' },
    { key: 'shortlisted', label: 'Shortlisted', icon: Bookmark,    count: stats.shortlisted, color: '#a78bfa' },
    { key: 'tracked',     label: 'Applied',     icon: PlusCircle,  count: stats.tracked,     color: '#38bdf8' },
  ];

  const activeRegistered  = registered;
  const activeShortlisted = shortlisted;

  return (
    <div className="min-h-screen noise" style={{ background: '#07070f' }}>
      <Navbar />

      {/* Dashboard header */}
      <div className="relative pt-20 pb-10 overflow-hidden" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute top-0 left-1/4 w-96 h-40 bg-violet-500/8 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex-shrink-0"
            >
              {session.user?.image ? (
                <Image
                  src={session.user.image}
                  alt="Avatar"
                  width={64}
                  height={64}
                  className="rounded-2xl"
                  style={{ boxShadow: '0 0 0 2px rgba(124,58,237,0.4), 0 8px 32px rgba(0,0,0,0.4)' }}
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                >
                  {session.user?.name?.[0]}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[#07070f]" />
            </motion.div>

            {/* Name */}
            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }}>
              <h1 className="text-2xl font-black text-white">{session.user?.name?.split(' ')[0]}&apos;s Dashboard</h1>
              <p className="text-zinc-500 text-sm mt-0.5">{session.user?.email}</p>
            </motion.div>

            {/* Right side: Track button + Achievements */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="sm:ml-auto flex items-center gap-4 flex-wrap"
            >
              {/* Track Hackathon button */}
              <motion.button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 text-[13px] font-bold px-4 py-2.5 rounded-2xl text-white"
                style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.25), rgba(14,165,233,0.15))', border: '1px solid rgba(56,189,248,0.35)' }}
                whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(56,189,248,0.2)' }}
                whileTap={{ scale: 0.96 }}
              >
                <Plus size={14} />
                Track Hackathon
              </motion.button>

              <div className="hidden sm:flex items-center gap-3">
                <span className="text-xs text-zinc-600 font-medium">Achievements</span>
                <div className="flex items-center gap-2">
                  {achievements.map((a) => <AchievementBadge key={a.label} {...a} />)}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <StatsPanel stats={stats} />
        </motion.div>

        {/* Progress bar */}
        {stats.total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mb-8 rounded-2xl p-5"
            style={{ background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-zinc-300">Progress Breakdown</p>
              <span className="text-xs text-zinc-600">{stats.total} total tracked</span>
            </div>
            <div className="flex gap-0.5 h-2.5 rounded-full overflow-hidden bg-white/5">
              {stats.registered > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.registered / stats.total) * 100}%` }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-400"
                />
              )}
              {stats.shortlisted > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.shortlisted / stats.total) * 100}%` }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                  className="bg-gradient-to-r from-violet-500 to-indigo-500"
                />
              )}
              {stats.tracked > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.tracked / stats.total) * 100}%` }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                  className="bg-gradient-to-r from-sky-500 to-cyan-400"
                />
              )}
            </div>
            <div className="flex items-center gap-5 mt-3 flex-wrap">
              {[
                { color: 'bg-emerald-500', label: 'Registered',     count: stats.registered  },
                { color: 'bg-violet-500',  label: 'Shortlisted',    count: stats.shortlisted },
                { color: 'bg-sky-500',     label: 'Applied/Ext',    count: stats.tracked     },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  <span className="text-xs text-zinc-500">{item.label}</span>
                  <span className="text-xs font-bold text-zinc-300">{item.count}</span>
                  <span className="text-xs text-zinc-700">
                    ({stats.total ? Math.round((item.count / stats.total) * 100) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="flex items-center gap-1 p-1 rounded-2xl w-fit mb-7"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {TABS.map((tab) => (
            <motion.button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{ color: activeTab === tab.key ? '#fff' : '#52525b' }}
              whileHover={{ color: activeTab === tab.key ? '#fff' : '#a1a1aa' }}
              whileTap={{ scale: 0.97 }}
            >
              {activeTab === tab.key && (
                <motion.div
                  layoutId="dash-tab"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <tab.icon size={14} className="relative z-10" style={{ color: activeTab === tab.key ? tab.color : 'inherit' }} />
              <span className="relative z-10">{tab.label}</span>
              <motion.span
                layout
                className="relative z-10 text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center"
                style={activeTab === tab.key
                  ? { background: tab.color + '25', color: tab.color }
                  : { background: 'rgba(255,255,255,0.04)', color: '#52525b' }}
              >
                {tab.count}
              </motion.span>
            </motion.button>
          ))}
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} index={i} />)}
            </motion.div>
          ) : activeTab === 'tracked' ? (
            tracked.length === 0 ? (
              <EmptyState key="empty-tracked" tab="tracked" onAdd={() => setModalOpen(true)} />
            ) : (
              <motion.div
                key="tracked"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {/* Add another button */}
                <motion.button
                  onClick={() => setModalOpen(true)}
                  className="rounded-2xl flex flex-col items-center justify-center gap-3 py-12 transition-all"
                  style={{ background: 'rgba(56,189,248,0.04)', border: '2px dashed rgba(56,189,248,0.2)', color: '#38bdf8' }}
                  whileHover={{ scale: 1.02, borderColor: 'rgba(56,189,248,0.4)', background: 'rgba(56,189,248,0.08)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus size={22} />
                  <span className="text-[12px] font-semibold">Track Another</span>
                </motion.button>

                <AnimatePresence>
                  {tracked.map((item, i) => (
                    <TrackedHackathonCard
                      key={item.id}
                      item={item}
                      index={i}
                      onDelete={handleTrackedDelete}
                      onUpdate={handleTrackedUpdate}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )
          ) : (activeTab === 'registered' ? activeRegistered : activeShortlisted).length === 0 ? (
            <EmptyState key={`empty-${activeTab}`} tab={activeTab} />
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {(activeTab === 'registered' ? activeRegistered : activeShortlisted).map((row, i) => (
                <HackathonCard
                  key={row.hackathon_id}
                  hackathon={row.hackathons}
                  userStatus={userStatusMap[row.hackathon_id] || null}
                  isLoggedIn={true}
                  onStatusChange={handleStatusChange}
                  index={i}
                  chatLinks={chatLinksMap[row.hackathon_id] || []}
                  onChatLinksUpdate={handleChatLinksUpdate}
                  chatLinksSaving={savingChatFor === row.hackathon_id}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AddHackathonModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleTrackedSaved}
      />
    </div>
  );
}
