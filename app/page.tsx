'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Navbar from '@/components/Navbar';
import HackathonCard from '@/components/HackathonCard';
import SkeletonCard from '@/components/SkeletonCard';
import SearchBar from '@/components/SearchBar';
import FilterBar from '@/components/FilterBar';
import AnimatedNumber from '@/components/AnimatedNumber';
import { Hackathon, FilterMode, SortBy, DeadlineFilter } from '@/types';
import { AlertCircle, ArrowRight, Trophy, Globe, Sparkles, Zap, X, Loader2, LayoutGrid } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

// Aceternity-style spotlight that follows cursor across the full page
function Spotlight() {
  const mx = useMotionValue(50);
  const my = useMotionValue(30);
  const sx = useSpring(mx, { stiffness: 12, damping: 20 });
  const sy = useSpring(my, { stiffness: 12, damping: 20 });
  const bg = useTransform([sx, sy], (v: number[]) =>
    `radial-gradient(1000px circle at ${v[0]}% ${v[1]}%, rgba(255,255,255,0.048) 0%, transparent 50%)`
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mx.set((e.clientX / window.innerWidth) * 100);
      my.set((e.clientY / window.innerHeight) * 100);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [mx, my]);

  return <motion.div className="fixed inset-0 pointer-events-none z-0" style={{ background: bg }} />;
}

// Small tight cursor glow for precise element tracking
function CursorGlow() {
  const x = useMotionValue(-600);
  const y = useMotionValue(-600);
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
        width: 320, height: 320,
        x: useTransform(springX, (v) => v - 160),
        y: useTransform(springY, (v) => v - 160),
        background: 'radial-gradient(circle, rgba(255,255,255,0.055) 0%, transparent 70%)',
      }}
    />
  );
}

// Aceternity Text Generate Effect — words blur-in one by one
function BlurIn({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <span className={className}>
      {text.split(' ').map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, filter: 'blur(14px)', y: 16 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{ delay: delay + i * 0.1, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block mr-[0.28em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

const SOURCE_LOGOS = ['Devpost', 'Unstop', 'HackerEarth'];

export default function HomePage() {
  const { data: session } = useSession();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [userStatusMap, setUserStatusMap] = useState<Record<string, 'registered' | 'shortlisted'>>({});
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [mode, setMode] = useState<FilterMode>('all');
  const [sort, setSort] = useState<SortBy>('deadline');
  const [deadline, setDeadline] = useState<DeadlineFilter>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const debouncedSearch = useDebounce(search, 380);
  const gridRef = useRef<HTMLDivElement>(null);

  const fetchHackathons = useCallback(async (pageNum: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(pageNum), sort,
        ...(mode !== 'all' && { mode }),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(activeTag && { tag: activeTag }),
        ...(deadline !== 'all' && { deadline }),
      });
      const res = await fetch(`/api/hackathons?${params}`);
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      const items: Hackathon[] = data.hackathons || [];
      setHackathons((prev) => append ? [...prev, ...items] : items);
      setTotal(data.total || 0);
    } catch {
      setError('Could not load hackathons. Make sure Supabase is configured.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sort, mode, debouncedSearch, activeTag, deadline]);

  // When filters change → reset list and fetch page 1
  useEffect(() => {
    setPage(1);
    setHackathons([]);
    fetchHackathons(1, false);
  }, [fetchHackathons]);

  // Clear tag filter when user types in search box
  useEffect(() => { setActiveTag(''); }, [debouncedSearch]);

  const loadMore = useCallback(() => {
    const next = page + 1;
    setPage(next);
    fetchHackathons(next, true);
  }, [page, fetchHackathons]);

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

  const handleTagClick = useCallback((tag: string) => {
    setSearch('');
    setActiveTag(tag);
    setPage(1);
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const scrollToGrid = () => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="min-h-screen noise" style={{ background: '#000' }}>
      <Spotlight />
      <CursorGlow />
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative min-h-[95vh] flex flex-col items-center justify-center px-4 pt-20 pb-12 overflow-hidden">

        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 grid-bg" />
          {/* White orbs */}
          <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] orb"
            style={{ background: 'radial-gradient(ellipse, rgba(255,255,255,0.05) 0%, transparent 70%)' }} />
          <div className="absolute top-[5%] left-[-8%] w-[400px] h-[400px] orb orb-delay"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)' }} />
          <div className="absolute top-[15%] right-[-8%] w-[350px] h-[350px] orb"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)', animationDelay: '-3s' }} />
          {/* Floating particles — varied sizes */}
          {[...Array(16)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: i % 4 === 0 ? 2 : 1,
                height: i % 4 === 0 ? 2 : 1,
                left: `${5 + i * 5.8}%`,
                top: `${10 + (i % 6) * 15}%`,
              }}
              animate={{
                y: [0, -(10 + (i % 4) * 5), 0],
                opacity: [0.08, i % 3 === 0 ? 0.65 : 0.35, 0.08],
                scale: [1, i % 4 === 0 ? 2.2 : 1.5, 1],
              }}
              transition={{
                duration: 3 + i * 0.4,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.22,
              }}
            />
          ))}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent to-black" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center gap-7">

          {/* Eyebrow — spinning border badge */}
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="border-spin rounded-full"
          >
            <div
              className="relative inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: '#a1a1aa' }}
            >
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                animate={{ opacity: [1, 0.3, 1], scale: [1, 1.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              Live • {SOURCE_LOGOS.join(' · ')} & more
            </div>
          </motion.div>

          {/* Headline — Aceternity word-by-word blur-in */}
          <div className="space-y-0.5">
            <h1 className="block text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] text-white">
              <BlurIn text="Discover Every" delay={0.08} />
            </h1>
            <h1 className="block text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] gradient-text">
              <BlurIn text="Hackathon," delay={0.28} />
            </h1>
            <h1 className="block text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] text-white">
              <BlurIn text="One Place." delay={0.44} />
            </h1>
          </div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, filter: 'blur(6px)', y: 12 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            transition={{ delay: 0.62, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-zinc-500 text-lg max-w-xl leading-relaxed"
          >
            Browse hackathons from Devpost, Unstop & HackerEarth — all in one place. Sign in to track your journey.
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6 }}
            className="w-full max-w-2xl"
          >
            <SearchBar value={search} onChange={setSearch} />
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.6 }}
            className="flex items-center gap-3 flex-wrap justify-center"
          >
            <motion.button
              onClick={scrollToGrid}
              className="btn-white flex items-center gap-2 text-black text-sm font-bold px-7 py-3.5 rounded-full"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              Browse Hackathons <ArrowRight size={14} />
            </motion.button>

            {!session && (
              <motion.button
                onClick={() => signIn('google')}
                className="btn-ghost flex items-center gap-2 text-sm font-semibold px-6 py-3.5 rounded-full"
                whileHover={{ scale: 1.04 }}
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

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.78, duration: 0.6 }}
            className="flex items-center gap-10 pt-2"
          >
            {[
              { icon: Trophy, value: total, suffix: '', label: 'Live Hackathons' },
              { icon: Globe, value: 3, suffix: '', label: 'Sources' },
              { icon: Sparkles, value: 500, suffix: 'K+', label: 'In Prizes' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                className="flex flex-col items-center gap-1"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.82 + i * 0.08 }}
              >
                <div className="flex items-center gap-1.5">
                  <s.icon size={13} className="text-zinc-600" />
                  <span className="text-2xl font-black text-white tracking-tight counter">
                    <AnimatedNumber value={s.value} />{s.suffix}
                  </span>
                </div>
                <span className="text-[11px] text-zinc-700 font-medium">{s.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.button
          onClick={scrollToGrid}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-zinc-800 hover:text-zinc-600 transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          whileHover={{ y: 2 }}
        >
          <span className="text-[9px] font-semibold tracking-[0.2em] uppercase">Scroll</span>
          <motion.div
            className="w-px h-8 bg-gradient-to-b from-zinc-700 to-transparent"
            animate={{ scaleY: [1, 0.4, 1], opacity: [0.8, 0.2, 0.8] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
        </motion.button>
      </section>

      {/* ── Source marquee ── */}
      <div className="py-6 overflow-hidden"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
        <div className="flex items-center overflow-hidden">
          <div className="flex items-center gap-16 pr-16 whitespace-nowrap marquee">
            {[...SOURCE_LOGOS, ...SOURCE_LOGOS].map((logo, i) => (
              <span key={i} className="text-xs font-bold text-zinc-800 tracking-[0.15em] uppercase select-none">
                {logo}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Hackathon grid ── */}
      <main ref={gridRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 pb-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <motion.h2
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-2xl font-black text-white tracking-tight"
            >
              Latest Hackathons
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="text-sm text-zinc-700 mt-1"
            >
              Updated live from multiple platforms
            </motion.p>
          </div>
        </div>

        <div className="mb-7 space-y-3">
          <FilterBar mode={mode} sort={sort} deadline={deadline} onModeChange={setMode} onSortChange={setSort} onDeadlineChange={setDeadline} total={total} />
          <AnimatePresence>
            {activeTag && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex items-center gap-2"
              >
                <span className="text-[11px] text-zinc-600">Tag:</span>
                <motion.button
                  onClick={() => { setActiveTag(''); setPage(1); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#e4e4e7' }}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff' }}
                  whileTap={{ scale: 0.94 }}
                >
                  {activeTag}
                  <X size={10} className="opacity-60" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="skeletons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} index={i} />)}
            </motion.div>
          ) : error ? (
            <motion.div key="error" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-28 gap-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <AlertCircle size={26} className="text-red-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold mb-1">Failed to load</p>
                <p className="text-zinc-600 text-sm max-w-xs">{error}</p>
              </div>
              <motion.button onClick={() => fetchHackathons(1, false)}
                className="text-sm text-zinc-400 hover:text-white px-4 py-2 rounded-xl transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.96 }}>
                Try again
              </motion.button>
            </motion.div>
          ) : hackathons.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-28 gap-4">
              <motion.div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                animate={{ rotate: [0, 4, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity }}>
                <Zap size={26} className="text-zinc-600" />
              </motion.div>
              <p className="text-white font-semibold">No hackathons found</p>
              <p className="text-zinc-600 text-sm">Try different filters or clear your search</p>
            </motion.div>
          ) : (
            <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {hackathons.map((h, i) => (
                <HackathonCard
                  key={h.id} hackathon={h}
                  userStatus={userStatusMap[h.id] || null}
                  isLoggedIn={!!session}
                  onStatusChange={handleStatusChange}
                  onTagClick={handleTagClick}
                  index={i}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Load More */}
        {!loading && hackathons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-4 mt-14"
          >
            {/* Progress bar */}
            <div className="w-48 h-px rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                className="h-full rounded-full bg-white/30"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (hackathons.length / total) * 100)}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>

            <p className="text-xs text-zinc-600">
              Showing <span className="text-white font-semibold">{hackathons.length}</span> of{' '}
              <span className="text-white font-semibold">{total}</span> hackathons
            </p>

            {hackathons.length < total && (
              <motion.button
                onClick={loadMore}
                disabled={loadingMore}
                className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#e4e4e7' }}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.22)', color: '#fff', scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                {loadingMore ? (
                  <><Loader2 size={14} className="animate-spin" /> Loading…</>
                ) : (
                  <><LayoutGrid size={14} /> Load {Math.min(24, total - hackathons.length)} more</>
                )}
              </motion.button>
            )}

            {hackathons.length >= total && total > 0 && (
              <p className="text-[11px] text-zinc-700">You&apos;ve seen all {total} hackathons</p>
            )}
          </motion.div>
        )}

        {/* Auth CTA */}
        {!session && !loading && hackathons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-24"
          >
            <div className="relative max-w-2xl mx-auto rounded-3xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}>

              {/* Animated top edge shimmer */}
              <motion.div
                className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
              />

              <div className="px-10 py-12 flex flex-col sm:flex-row items-center gap-8">
                {/* Left — icon + text */}
                <div className="flex-1 text-center sm:text-left">
                  {/* Icon row with stagger */}
                  <div className="flex items-center gap-2 mb-5 justify-center sm:justify-start">
                    {([Trophy, Zap, Sparkles] as React.ElementType[]).map((Icon, i) => (
                      <motion.div
                        key={i}
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.15 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] }}
                        whileHover={{ scale: 1.15, borderColor: 'rgba(255,255,255,0.25)' }}
                      >
                        <Icon size={15} className="text-zinc-500" />
                      </motion.div>
                    ))}
                  </div>

                  <motion.h3
                    className="text-2xl font-black text-white mb-2 tracking-tight"
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  >
                    Track your journey
                  </motion.h3>
                  <motion.p
                    className="text-zinc-600 text-sm leading-relaxed"
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.28, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  >
                    Shortlist hackathons, mark registrations, and watch your progress on a personal dashboard.
                  </motion.p>
                </div>

                {/* Right — CTA */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.32, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="flex-shrink-0"
                >
                  <motion.button
                    onClick={() => signIn('google')}
                    className="btn-white flex items-center gap-2.5 text-black font-bold px-7 py-4 rounded-2xl whitespace-nowrap"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#000"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#000"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#000"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#000"/>
                    </svg>
                    Sign in free
                    <ArrowRight size={14} />
                  </motion.button>
                  <p className="text-[10px] text-zinc-800 text-center mt-2">No credit card needed</p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
