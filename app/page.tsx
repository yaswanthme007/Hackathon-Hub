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
import { Hackathon, FilterMode, SortBy } from '@/types';
import { ChevronLeft, ChevronRight, AlertCircle, ArrowRight, Trophy, Globe, Sparkles, Zap } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

function CursorGlow() {
  const x = useMotionValue(-600);
  const y = useMotionValue(-600);
  const springX = useSpring(x, { stiffness: 60, damping: 18 });
  const springY = useSpring(y, { stiffness: 60, damping: 18 });

  useEffect(() => {
    const move = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [x, y]);

  return (
    <motion.div
      className="fixed pointer-events-none z-0 rounded-full"
      style={{
        width: 500, height: 500,
        x: useTransform(springX, (v) => v - 250),
        y: useTransform(springY, (v) => v - 250),
        background: 'radial-gradient(circle, rgba(255,255,255,0.033) 0%, transparent 70%)',
      }}
    />
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

  return (
    <div className="min-h-screen noise" style={{ background: '#000' }}>
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
          {/* Floating particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-px h-px rounded-full bg-white"
              style={{ left: `${10 + i * 11}%`, top: `${15 + (i % 4) * 20}%` }}
              animate={{ y: [0, -16, 0], opacity: [0.15, 0.5, 0.15], scale: [1, 1.5, 1] }}
              transition={{ duration: 3.5 + i * 0.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
            />
          ))}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent to-black" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center gap-7">

          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa' }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-white"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
            Live • {SOURCE_LOGOS.join(', ')} & more
          </motion.div>

          {/* Headline */}
          <div className="space-y-1">
            {['Discover Every', 'Hackathon,', 'One Place.'].map((line, li) => (
              <motion.h1
                key={li}
                className={`block text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] ${
                  li === 1 ? 'gradient-text' : 'text-white'
                }`}
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + li * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                {line}
              </motion.h1>
            ))}
          </div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="text-zinc-500 text-lg max-w-xl leading-relaxed"
          >
            Browse hackathons from every major platform. Sign in to shortlist, track registrations, and never miss a deadline.
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
              { icon: Globe, value: 6, suffix: '+', label: 'Sources' },
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

        <div className="mb-7">
          <FilterBar mode={mode} sort={sort} onModeChange={setMode} onSortChange={setSort} total={total} />
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
              <motion.button onClick={fetchHackathons}
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
                  index={i}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-2 mt-12">
            <motion.button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft size={14} /> Prev
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
                      ? { background: '#fff', color: '#000', border: 'none' }
                      : { background: 'rgba(255,255,255,0.04)', color: '#52525b', border: '1px solid rgba(255,255,255,0.07)' }
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
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              whileTap={{ scale: 0.95 }}
            >
              Next <ChevronRight size={14} />
            </motion.button>
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
