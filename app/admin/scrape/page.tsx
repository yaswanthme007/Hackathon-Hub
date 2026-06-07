'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import {
  Play, RefreshCw, CheckCircle2, XCircle, Loader2,
  Database, Clock, Zap, AlertTriangle,
} from 'lucide-react';

const SOURCES = [
  { id: 'devpost',     label: 'Devpost',      note: 'Public JSON API — most reliable',       color: '#38bdf8' },
  { id: 'devfolio',   label: 'Devfolio',     note: 'Public API endpoint',                   color: '#a78bfa' },
  { id: 'dorahacks',  label: 'DoraHacks',    note: 'Public hackathon listing API',           color: '#34d399' },
  { id: 'mlh',        label: 'MLH',          note: 'HTML scraping — may need updates',      color: '#f87171' },
  { id: 'hackerearth',label: 'HackerEarth',  note: 'Public challenge API',                  color: '#fb923c' },
  { id: 'unstop',     label: 'Unstop',       note: 'Reverse-engineered API — may break',    color: '#fbbf24' },
];

interface ScrapeResult {
  success: boolean;
  count?: number;
  error?: string;
}

type Status = 'idle' | 'running' | 'done' | 'error';

export default function ScrapeAdminPage() {
  const [secret, setSecret] = useState('');
  const [selected, setSelected] = useState<string[]>(SOURCES.map((s) => s.id));
  const [status, setStatus] = useState<Status>('idle');
  const [results, setResults] = useState<Record<string, ScrapeResult>>({});
  const [duration, setDuration] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState('');

  const toggle = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const run = async () => {
    if (!secret) { setError('Enter your SCRAPE_SECRET (same value as in .env.local)'); return; }
    if (selected.length === 0) { setError('Select at least one source'); return; }
    setError('');
    setStatus('running');
    setResults({});
    setDuration(null);
    setTotal(null);

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
        body: JSON.stringify({ sources: selected }),
      });

      if (res.status === 401) { setError('Wrong secret. Check .env.local → SCRAPE_SECRET'); setStatus('error'); return; }

      const data = await res.json();
      setResults(data.results ?? {});
      setDuration(data.duration_ms);
      setTotal(data.total);
      setStatus('done');
    } catch (err) {
      setError(String(err));
      setStatus('error');
    }
  };

  const succeeded = Object.values(results).filter((r) => r.success).length;
  const failed = Object.values(results).filter((r) => !r.success).length;

  return (
    <div className="min-h-screen noise" style={{ background: '#07070f' }}>
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-28 pb-24">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
            style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', color: '#c4b5fd' }}>
            <Database size={11} /> Admin Panel
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Hackathon Scraper</h1>
          <p className="text-zinc-500 text-sm">
            Fetch fresh hackathons from all platforms and upsert them into Supabase.
            Run this manually or set up a daily cron job.
          </p>
        </div>

        {/* Secret input */}
        <div className="mb-6 rounded-2xl p-5" style={{ background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.07)' }}>
          <label className="block text-xs font-semibold text-zinc-400 mb-2">
            SCRAPE_SECRET <span className="text-zinc-600 font-normal">(from your .env.local)</span>
          </label>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="paste your secret key here…"
            className="w-full bg-transparent text-white text-sm outline-none placeholder-zinc-700 py-1"
            onKeyDown={(e) => e.key === 'Enter' && run()}
          />
        </div>

        {/* Source selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-zinc-300">Sources to scrape</p>
            <div className="flex gap-2">
              <button onClick={() => setSelected(SOURCES.map((s) => s.id))} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">All</button>
              <span className="text-zinc-700">·</span>
              <button onClick={() => setSelected([])} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">None</button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SOURCES.map((src) => {
              const sel = selected.includes(src.id);
              const res = results[src.id];
              return (
                <motion.button
                  key={src.id}
                  onClick={() => toggle(src.id)}
                  disabled={status === 'running'}
                  className="flex items-start gap-3 p-4 rounded-2xl text-left transition-all disabled:opacity-60"
                  style={{
                    background: sel ? `${src.color}10` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${sel ? src.color + '35' : 'rgba(255,255,255,0.07)'}`,
                  }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Checkbox */}
                  <div
                    className="mt-0.5 w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-all"
                    style={{ background: sel ? src.color : 'rgba(255,255,255,0.06)', border: `1px solid ${sel ? src.color : 'rgba(255,255,255,0.12)'}` }}
                  >
                    {sel && <CheckCircle2 size={10} className="text-white" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-white">{src.label}</span>
                      {/* Result badge */}
                      <AnimatePresence>
                        {res && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              res.success
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {res.success ? `+${res.count ?? 0}` : 'failed'}
                          </motion.span>
                        )}
                        {status === 'running' && sel && !res && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <Loader2 size={12} className="text-zinc-500 animate-spin" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <p className="text-[11px] text-zinc-600 mt-0.5">{src.note}</p>
                    {res?.error && (
                      <p className="text-[10px] text-red-400/80 mt-1 truncate">{res.error.slice(0, 80)}</p>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2.5 mb-4 px-4 py-3 rounded-xl text-sm text-red-300"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <AlertTriangle size={14} className="flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Run button */}
        <motion.button
          onClick={run}
          disabled={status === 'running'}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-white text-sm transition-all disabled:opacity-60 btn-glow"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          whileHover={{ scale: status === 'running' ? 1 : 1.01 }}
          whileTap={{ scale: status === 'running' ? 1 : 0.98 }}
        >
          {status === 'running' ? (
            <><Loader2 size={16} className="animate-spin" /> Scraping {selected.length} sources…</>
          ) : status === 'done' ? (
            <><RefreshCw size={16} /> Run Again</>
          ) : (
            <><Play size={16} /> Run Scraper ({selected.length} sources)</>
          )}
        </motion.button>

        {/* Results summary */}
        <AnimatePresence>
          {status === 'done' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-2xl p-5"
              style={{ background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Zap size={14} className="text-violet-400" />
                <p className="text-sm font-bold text-white">Scrape Complete</p>
                {duration && (
                  <div className="ml-auto flex items-center gap-1 text-xs text-zinc-500">
                    <Clock size={11} />
                    {(duration / 1000).toFixed(1)}s
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Upserted', value: total ?? 0, color: '#10b981' },
                  { label: 'Sources OK', value: succeeded, color: '#a78bfa' },
                  { label: 'Failed', value: failed, color: failed > 0 ? '#ef4444' : '#52525b' },
                ].map((item) => (
                  <div key={item.label} className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-2xl font-black" style={{ color: item.color }}>{item.value}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>

              {failed > 0 && (
                <div className="text-xs text-zinc-500 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
                  <p className="font-semibold text-red-400 mb-1">Failed sources:</p>
                  {Object.entries(results).filter(([, r]) => !r.success).map(([src, r]) => (
                    <p key={src} className="text-red-300/70">{src}: {r.error?.slice(0, 120)}</p>
                  ))}
                </div>
              )}

              <p className="text-xs text-zinc-600 mt-3 text-center">
                Go to <a href="/" className="text-violet-400 hover:underline">the homepage</a> to see your updated hackathons.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cron setup instructions */}
        <div className="mt-8 rounded-2xl p-5" style={{ background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-sm font-semibold text-zinc-300 mb-3">Auto-run daily (optional)</p>
          <p className="text-xs text-zinc-500 mb-3">
            Add this to your <code className="text-violet-400">SCRAPE_SECRET</code> in .env.local, then trigger from a cron service like{' '}
            <span className="text-zinc-300">GitHub Actions</span>, <span className="text-zinc-300">Vercel Cron</span>, or <span className="text-zinc-300">cron-job.org</span>:
          </p>
          <div className="font-mono text-xs text-zinc-400 rounded-xl p-3 overflow-x-auto" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-zinc-600 mb-1"># POST to your deployed URL daily at 6am</p>
            <p>curl -X POST https://your-app.vercel.app/api/scrape \</p>
            <p>  -H &quot;Authorization: Bearer $SCRAPE_SECRET&quot; \</p>
            <p>  -H &quot;Content-Type: application/json&quot; \</p>
            <p>  -d &apos;{'{}'}&apos;</p>
          </div>
        </div>
      </main>
    </div>
  );
}
