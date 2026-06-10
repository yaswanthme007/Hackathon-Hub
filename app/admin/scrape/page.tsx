'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { Play, RefreshCw, CheckCircle2, Loader2, Database, Clock, Zap, AlertTriangle, Terminal } from 'lucide-react';

const SOURCES = [
  { id: 'devpost',      label: 'Devpost',      note: 'Public JSON API — most reliable' },
  { id: 'unstop',      label: 'Unstop',       note: 'Reverse-engineered API — may break' },
  { id: 'hackerearth', label: 'HackerEarth',  note: 'Public challenge API' },
];

interface ScrapeResult { success: boolean; count?: number; error?: string; }
type Status = 'idle' | 'running' | 'done' | 'error';

export default function ScrapeAdminPage() {
  const [secret, setSecret]   = useState('');
  const [selected, setSelected] = useState<string[]>(SOURCES.map((s) => s.id));
  const [status, setStatus]   = useState<Status>('idle');
  const [results, setResults] = useState<Record<string, ScrapeResult>>({});
  const [duration, setDuration] = useState<number | null>(null);
  const [total, setTotal]     = useState<number | null>(null);
  const [error, setError]     = useState('');

  const toggle = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const run = async () => {
    if (!secret)           { setError('Enter your SCRAPE_SECRET'); return; }
    if (!selected.length)  { setError('Select at least one source'); return; }
    setError(''); setStatus('running'); setResults({}); setDuration(null); setTotal(null);
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
        body: JSON.stringify({ sources: selected }),
      });
      if (res.status === 401) { setError('Wrong secret — check SCRAPE_SECRET in .env.local'); setStatus('error'); return; }
      const data = await res.json();
      setResults(data.results ?? {}); setDuration(data.duration_ms); setTotal(data.total); setStatus('done');
    } catch (err) { setError(String(err)); setStatus('error'); }
  };

  const succeeded = Object.values(results).filter((r) => r.success).length;
  const failed    = Object.values(results).filter((r) => !r.success).length;

  return (
    <div className="min-h-screen noise" style={{ background: '#000' }}>
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 pt-28 pb-24">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#71717a' }}>
            <Database size={10} /> Admin
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Scraper</h1>
          <p className="text-zinc-600 text-sm leading-relaxed">
            Pull live hackathons from all platforms into Supabase. Takes ~30–60 seconds.
          </p>
        </motion.div>

        {/* Secret */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-4 rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="px-4 py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Secret Key</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <span className="text-zinc-700 text-xs font-mono select-none">Bearer</span>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && run()}
              placeholder="paste SCRAPE_SECRET here…"
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-zinc-800 font-mono"
            />
            {secret && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <CheckCircle2 size={14} className="text-emerald-500" />
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Sources */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mb-4 rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Sources</span>
            <div className="flex items-center gap-3">
              <button onClick={() => setSelected(SOURCES.map((s) => s.id))}
                className="text-[11px] text-zinc-600 hover:text-white transition-colors font-medium">All</button>
              <span className="text-zinc-800">·</span>
              <button onClick={() => setSelected([])}
                className="text-[11px] text-zinc-600 hover:text-white transition-colors font-medium">None</button>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.01)' }}>
            {SOURCES.map((src, i) => {
              const sel = selected.includes(src.id);
              const res = results[src.id];
              const isLast = i === SOURCES.length - 1;
              return (
                <motion.button
                  key={src.id}
                  onClick={() => status !== 'running' && toggle(src.id)}
                  disabled={status === 'running'}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 text-left transition-all disabled:cursor-default ${!isLast ? 'border-b' : ''}`}
                  style={{
                    borderColor: 'rgba(255,255,255,0.05)',
                    background: sel ? 'rgba(255,255,255,0.04)' : 'transparent',
                  }}
                  whileHover={status !== 'running' ? { backgroundColor: 'rgba(255,255,255,0.05)' } : {}}
                  whileTap={status !== 'running' ? { scale: 0.995 } : {}}
                >
                  {/* Checkbox */}
                  <div className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-all"
                    style={{
                      background: sel ? '#fff' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${sel ? '#fff' : 'rgba(255,255,255,0.12)'}`,
                    }}>
                    {sel && <CheckCircle2 size={10} className="text-black" />}
                  </div>

                  {/* Label + note */}
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-semibold transition-colors ${sel ? 'text-white' : 'text-zinc-500'}`}>
                      {src.label}
                    </span>
                    <span className="text-[11px] text-zinc-700 ml-2">{src.note}</span>
                  </div>

                  {/* Status badge */}
                  <AnimatePresence mode="wait">
                    {status === 'running' && sel && !res ? (
                      <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Loader2 size={13} className="text-zinc-600 animate-spin" />
                      </motion.div>
                    ) : res ? (
                      <motion.span
                        key="result"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          res.success ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                        }`}
                      >
                        {res.success ? `+${res.count ?? 0}` : 'failed'}
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2.5 mb-4 px-4 py-3 rounded-xl text-sm text-red-400"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
            >
              <AlertTriangle size={13} className="flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Run button */}
        <motion.button
          onClick={run}
          disabled={status === 'running'}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 mb-4"
          style={{ background: status === 'running' ? 'rgba(255,255,255,0.06)' : '#fff', color: status === 'running' ? '#71717a' : '#000' }}
          whileHover={status !== 'running' ? { scale: 1.01 } : {}}
          whileTap={status !== 'running' ? { scale: 0.98 } : {}}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
        >
          {status === 'running' ? (
            <><Loader2 size={15} className="animate-spin" /> Scraping {selected.length} sources…</>
          ) : status === 'done' ? (
            <><RefreshCw size={15} /> Run Again</>
          ) : (
            <><Play size={15} /> Run Scraper ({selected.length} source{selected.length !== 1 ? 's' : ''})</>
          )}
        </motion.button>

        {/* Results */}
        <AnimatePresence>
          {status === 'done' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 rounded-2xl overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center justify-between px-4 py-2.5 border-b"
                style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center gap-2">
                  <Zap size={11} className="text-zinc-500" />
                  <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Result</span>
                </div>
                {duration && (
                  <div className="flex items-center gap-1 text-[11px] text-zinc-700">
                    <Clock size={10} /> {(duration / 1000).toFixed(1)}s
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3" style={{ background: 'rgba(255,255,255,0.01)' }}>
                {[
                  { label: 'Upserted', value: total ?? 0, color: '#10b981' },
                  { label: 'Sources OK', value: succeeded, color: '#fff' },
                  { label: 'Failed', value: failed, color: failed > 0 ? '#ef4444' : '#3f3f46' },
                ].map((item) => (
                  <div key={item.label} className="text-center py-5 px-3"
                    style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-2xl font-black mb-0.5" style={{ color: item.color }}>{item.value}</p>
                    <p className="text-[10px] text-zinc-700 font-medium uppercase tracking-wider">{item.label}</p>
                  </div>
                ))}
              </div>

              {failed > 0 && (
                <div className="px-4 py-3 border-t" style={{ borderColor: 'rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.04)' }}>
                  {Object.entries(results).filter(([, r]) => !r.success).map(([src, r]) => (
                    <p key={src} className="text-[11px] text-red-400/70">
                      <span className="font-semibold text-red-400">{src}:</span> {r.error?.slice(0, 100)}
                    </p>
                  ))}
                </div>
              )}

              <div className="px-4 py-3 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <a href="/" className="text-[11px] text-zinc-600 hover:text-white transition-colors">
                  View hackathons on homepage →
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cron */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-2 px-4 py-2.5 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <Terminal size={10} className="text-zinc-600" />
            <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Auto-run daily</span>
            <span className="text-[10px] text-zinc-800 ml-auto">optional</span>
          </div>
          <div className="p-4" style={{ background: 'rgba(255,255,255,0.01)' }}>
            <p className="text-xs text-zinc-600 mb-3 leading-relaxed">
              Use <span className="text-zinc-400 font-medium">cron-job.org</span>, <span className="text-zinc-400 font-medium">GitHub Actions</span>, or <span className="text-zinc-400 font-medium">Vercel Cron</span> to POST daily:
            </p>
            <div className="rounded-xl p-4 overflow-x-auto font-mono text-[11px] leading-relaxed"
              style={{ background: '#000', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-zinc-700 mb-2">{'# run daily at 6am UTC'}</p>
              <p className="text-zinc-400">curl -X POST \</p>
              <p className="text-zinc-400 pl-4">https://hackathon-hub-ten.vercel.app/api/scrape \</p>
              <p className="text-zinc-400 pl-4">{'-H "Authorization: Bearer $SCRAPE_SECRET" \\'}</p>
              <p className="text-zinc-400 pl-4">{'-H "Content-Type: application/json" \\'}</p>
              <p className="text-zinc-400 pl-4">{"-d '{}'"}</p>
            </div>
          </div>
        </motion.div>

      </main>
    </div>
  );
}
