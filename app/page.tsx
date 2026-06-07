'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import Navbar from '@/components/Navbar';
import HackathonCard from '@/components/HackathonCard';
import SkeletonCard from '@/components/SkeletonCard';
import SearchBar from '@/components/SearchBar';
import FilterBar from '@/components/FilterBar';
import AnimatedNumber from '@/components/AnimatedNumber';
import { Hackathon, FilterMode, SortBy } from '@/types';
import { Zap, ChevronLeft, ChevronRight, AlertCircle, ArrowRight, Trophy, Globe, Sparkles } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

function CursorGlow() {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const springX = useSpring(x, { stiffness: 80, damping: 20 });
  const springY = useSpring(y, { stiffness: 80, damping: 20 });

  useEffect(() => {
    const move = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [x, y]);

  return (
    <motion.div
      className="fixed pointer-events-none z-0 rounded-full"
      style={{
        width: 600, height: 600,
        x: useTransform(springX, (v) => v - 300),
        y: useTransform(springY, (v) => v - 300),
        background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)',
      }}
    />
  );
}

function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid */}
      <div className="absolute inset-0 grid-bg opacity-60" />

      {/* Orbs */}
      <div
        className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] orb"
        style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] orb orb-delay"
        style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] orb"
        style={{ background: 'radial-gradient(circle, rgba(244,63,94,0.05) 0%, transparent 70%)', animationDelay: '-3s' }}
      />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-violet-400/40"
          style={{
            left: `${15 + i * 14}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 3 + i * 0.7, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
        />
      ))}

      {/* Gradient fade at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-[#07070f]" />
    </div>
  );
}

const SOURCE_LOGOS = ['Devpost', 'MLH', 'HackerEarth', 'Unstop', 'Devfolio', 'DoraHacks'];

export default function HomePage() {
  const { data: session } = useSession();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [userStatusMap, setUserStatusMap] = useState<Record<string, 'registered' | 'shortlisted'>>({});
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<FilterMode>('all');
  const [sort, setSort] = useState<SortBy>('newest');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const debouncedSearch = useDebounce(search, 380);
  const gridRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.ceil(total / 12);

  const fetchHackathons = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(page), sort,
        ...(mode !== 'all' && { mode }),
        ...(debouncedSearch && { search: debouncedSearch }),
      });
      const res = await fetch(`/api/hackathons?${params}`);
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      setHackathons(data.hackathons || []);
      setTotal(data.total || 0);
    } catch {
      setError('Could not load hackathons. Make sure Supabase is configured.');
    } finally {
      setLoading(false);
    }
  }, [page, sort, mode, debouncedSearch]);

  useEffect(() => { setPage(1); }, [debouncedSearch, mode, sort]);
  useEffect(() => { fetchHackathons(); }, [fetchHackathons]);

  useEffect(() => {
    if (!session?.user) { setUserStatusMap({}); return; }
    fetch('/api/user/status')
      .then((r) => r.json())
      .then((d) => setUserStatusMap(d.statusMap || {}))
      .catch(() => {});
  }, [session]);

  const handleStatusChange = useCallback(async (hackathonId: string, status: 'registered' | 'shortlisted' | null) => {
    if (!session?.user) return;
    const prev = { ...userStatusMap };
    if (status === null) {
      const next = { ...userStatusMap };
      delete next[hackathonId];
      setUserStatusMap(next);
    } else {
      setUserStatusMap((m) => ({ ...m, [hackathonId]: status }));
    }
    try {
      if (status === null) {
        await fetch('/api/user/status', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hackathon_id: hackathonId }) });
      } else {
        await fetch('/api/user/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hackathon_id: hackathonId, status }) });
      }
    } catch { setUserStatusMap(prev); }
  }, [session, userStatusMap]);

  const scrollToGrid = () => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const statItems = [
    { icon: Trophy, value: total, suffix: '', label: 'Live Hackathons', color: '#f59e0b' },
    { icon: Globe, value: 6, suffix: '+', label: 'Sources', color: '#38bdf8' },
    { icon: Sparkles, value: 500, suffix: 'K+', label: 'In Prizes', color: '#a78bfa' },
  ];

  return (
    <div className="min-h-screen noise" style={{ background: '#07070f' }}>
      <CursorGlow />
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-4 pt-20 pb-10 overflow-hidden">
        <HeroBackground />

        <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center gap-6">
          {/* Eyebrow badge */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', color: '#c4b5fd' }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-violet-400"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            Live • Aggregating from {SOURCE_LOGOS.join(', ')} & more
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {['Discover', 'Every Hackathon,'].map((line, li) => (
              <motion.span
                key={li}
                className="block"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + li * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                {li === 0 ? (
                  <>{line}{' '}</>
                ) : (
                  <span className="gradient-text">{line}</span>
                )}
              </motion.span>
            ))}
            <motion.span
              className="block"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              One Place.
            </motion.span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48, duration: 0.6 }}
            className="text-zinc-400 text-lg max-w-2xl leading-relaxed"
          >
            Browse hackathons from every major platform. Sign in to shortlist, track registrations, and never miss a deadline.
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.58, duration: 0.6 }}
            className="w-full max-w-2xl"
          >
            <SearchBar value={search} onChange={setSearch} />
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.68, duration: 0.6 }}
            className="flex items-center gap-3 flex-wrap justify-center"
          >
            <motion.button
              onClick={scrollToGrid}
              className="flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-full btn-glow text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              Browse Hackathons <ArrowRight size={15} />
            </motion.button>

            {!session && (
              <motion.button
                onClick={() => signIn('google')}
                className="flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-full text-zinc-300 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                whileHover={{ scale: 1.04, backgroundColor: 'rgba(255,255,255,0.09)' }}
                whileTap={{ scale: 0.96 }}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"/>
                </svg>
                Sign in free
              </motion.button>
            )}
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex items-center gap-8 sm:gap-12 pt-4"
          >
            {statItems.map((s, i) => (
              <motion.div
                key={s.label}
                className="flex flex-col items-center gap-1"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85 + i * 0.08 }}
              >
                <div className="flex items-center gap-1.5">
                  <s.icon size={14} style={{ color: s.color }} />
                  <span className="text-2xl font-black text-white tracking-tight">
                    <AnimatedNumber value={s.value} />{s.suffix}
                  </span>
                </div>
                <span className="text-[11px] text-zinc-600 font-medium">{s.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.button
          onClick={scrollToGrid}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-zinc-600 hover:text-zinc-400 transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          whileHover={{ y: 2 }}
        >
          <span className="text-[10px] font-medium tracking-widest uppercase">Scroll</span>
          <motion.div
            className="w-[1px] h-8 bg-gradient-to-b from-zinc-600 to-transparent"
            animate={{ scaleY: [1, 0.5, 1], opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.button>
      </section>

      {/* ── Source logos marquee ── */}
      <div className="py-8 overflow-hidden border-y" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.015)' }}>
        <div className="flex items-center">
          <motion.div
            className="flex items-center gap-16 pr-16 whitespace-nowrap"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            {[...SOURCE_LOGOS, ...SOURCE_LOGOS].map((logo, i) => (
              <span key={i} className="text-sm font-semibold text-zinc-600 tracking-wide uppercase">
                {logo}
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Hackathon grid ── */}
      <main
        ref={gridRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 pb-24"
      >
        {/* Section header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <motion.h2
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-2xl font-black text-white tracking-tight"
            >
              Latest Hackathons
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="text-sm text-zinc-500 mt-1"
            >
              Updated live from multiple platforms
            </motion.p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-7">
          <FilterBar mode={mode} sort={sort} onModeChange={setMode} onSortChange={setSort} total={total} />
        </div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skeletons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} index={i} />
              ))}
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-28 gap-5"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertCircle size={28} className="text-red-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold mb-1">Failed to load</p>
                <p className="text-zinc-500 text-sm max-w-xs">{error}</p>
              </div>
              <motion.button
                onClick={fetchHackathons}
                className="text-sm text-violet-400 hover:text-violet-300 px-4 py-2 rounded-xl border border-violet-500/20 hover:bg-violet-500/10 transition-all"
                whileTap={{ scale: 0.96 }}
              >
                Try again
              </motion.button>
            </motion.div>
          ) : hackathons.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-28 gap-4"
            >
              <motion.div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Zap size={28} className="text-violet-400/60" />
              </motion.div>
              <p className="text-white font-semibold">No hackathons found</p>
              <p className="text-zinc-600 text-sm">Try different filters or clear your search</p>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {hackathons.map((h, i) => (
                <HackathonCard
                  key={h.id}
                  hackathon={h}
                  userStatus={userStatusMap[h.id] || null}
                  isLoggedIn={!!session}
                  onStatusChange={handleStatusChange}
                  index={i}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-2 mt-12"
          >
            <motion.button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft size={15} /> Prev
            </motion.button>

            <div className="flex items-center gap-1.5 px-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page + i - 2;
                if (p < 1 || p > totalPages) return null;
                return (
                  <motion.button
                    key={p}
                    onClick={() => setPage(p)}
                    className="w-9 h-9 rounded-xl text-xs font-bold transition-all"
                    style={p === page
                      ? { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', border: 'none' }
                      : { background: 'rgba(255,255,255,0.04)', color: '#71717a', border: '1px solid rgba(255,255,255,0.07)' }
                    }
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                  >
                    {p}
                  </motion.button>
                );
              })}
            </div>

            <motion.button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
              whileTap={{ scale: 0.95 }}
            >
              Next <ChevronRight size={15} />
            </motion.button>
          </motion.div>
        )}

        {/* Auth CTA */}
        {!session && !loading && hackathons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            className="mt-20"
          >
            <div
              className="relative max-w-xl mx-auto text-center rounded-3xl p-10 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(56,189,248,0.06))', border: '1px solid rgba(124,58,237,0.2)' }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />
              <motion.div
                className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.35)' }}
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Zap size={22} className="text-violet-400" />
              </motion.div>
              <h3 className="text-xl font-black text-white mb-2">Track your hackathon journey</h3>
              <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                Sign in free to shortlist opportunities, mark registrations, and get a personal progress dashboard.
              </p>
              <motion.button
                onClick={() => signIn('google')}
                className="btn-glow inline-flex items-center gap-2.5 text-white font-semibold px-7 py-3 rounded-full"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                Get started — it&apos;s free
                <ArrowRight size={15} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
