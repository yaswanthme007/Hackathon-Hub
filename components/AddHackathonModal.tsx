'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link2, PenLine, Loader2, Globe, Building2, Sparkles } from 'lucide-react';
import { UserTrackedHackathon, ApplicationStatus } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (item: UserTrackedHackathon) => void;
}

const PLATFORMS = [
  { value: 'unstop',      label: 'Unstop' },
  { value: 'devfolio',    label: 'Devfolio' },
  { value: 'devpost',     label: 'Devpost' },
  { value: 'hackerearth', label: 'HackerEarth' },
  { value: 'dorahacks',   label: 'DoraHacks' },
  { value: 'mlh',         label: 'MLH' },
  { value: 'kaggle',      label: 'Kaggle' },
  { value: 'lablab',      label: 'LabLab' },
  { value: 'other',       label: 'Other' },
];

const STATUSES: { value: ApplicationStatus; label: string; color: string }[] = [
  { value: 'shortlisted',    label: 'Shortlisted',     color: '#a78bfa' },
  { value: 'applied',        label: 'Applied',         color: '#38bdf8' },
  { value: 'org_shortlisted',label: 'Org Shortlisted', color: '#fbbf24' },
  { value: 'accepted',       label: 'Accepted',        color: '#10b981' },
  { value: 'rejected',       label: 'Rejected',        color: '#ef4444' },
];

interface FormData {
  title: string;
  url: string;
  organizer: string;
  platform: string;
  registration_deadline: string;
  end_date: string;
  prize_amount: string;
  mode: 'online' | 'offline' | 'hybrid';
  location: string;
  application_status: ApplicationStatus;
  notes: string;
}

const EMPTY: FormData = {
  title: '', url: '', organizer: '', platform: 'other',
  registration_deadline: '', end_date: '',
  prize_amount: '', mode: 'online', location: '',
  application_status: 'applied', notes: '',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full text-[13px] px-3 py-2 rounded-xl outline-none text-zinc-200 placeholder-zinc-700 transition-colors";
const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' };
const inputFocusStyle = { border: '1px solid rgba(124,58,237,0.5)', background: 'rgba(124,58,237,0.05)' };

function TextInput({ value, onChange, placeholder, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...rest}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={inputCls}
      style={focused ? { ...inputStyle, ...inputFocusStyle } : inputStyle}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

export default function AddHackathonModal({ open, onClose, onSaved }: Props) {
  const [mode, setMode] = useState<'url' | 'manual'>('url');
  const [urlInput, setUrlInput] = useState('');
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [form, setForm] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [urlFetched, setUrlFetched] = useState(false);

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleFetchUrl = useCallback(async () => {
    const url = urlInput.trim();
    if (!url) return;
    setFetching(true);
    setFetchError('');
    try {
      const res = await fetch(`/api/hackathons/fetch-url?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!res.ok) {
        setFetchError(data.error || 'Could not fetch URL');
        setForm((f) => ({ ...f, url }));
      } else {
        setForm((f) => ({
          ...f,
          url,
          title:       data.title       || f.title,
          organizer:   data.organizer   || f.organizer,
          platform:    data.platform    || f.platform,
          end_date:    data.end_date    ? data.end_date.slice(0, 10) : f.end_date,
          location:    data.location    || f.location,
        }));
        setUrlFetched(true);
      }
    } finally { setFetching(false); }
  }, [urlInput]);

  const handleSubmit = useCallback(async () => {
    if (!form.title.trim()) { setSaveError('Title is required'); return; }
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/user/tracked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          registration_deadline: form.registration_deadline || null,
          end_date:              form.end_date || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSaveError(data.error || 'Failed to save'); return; }
      onSaved(data.data);
      setForm(EMPTY);
      setUrlInput('');
      setUrlFetched(false);
      setMode('url');
      onClose();
    } finally { setSaving(false); }
  }, [form, onSaved, onClose]);

  const handleClose = () => {
    if (saving) return;
    setForm(EMPTY);
    setUrlInput('');
    setFetchError('');
    setSaveError('');
    setUrlFetched(false);
    setMode('url');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-lg rounded-3xl pointer-events-auto overflow-hidden"
              style={{ background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div>
                  <h2 className="text-lg font-black text-white">Track Hackathon</h2>
                  <p className="text-[12px] text-zinc-600 mt-0.5">Add a hackathon from any platform</p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#71717a' }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">
                {/* Mode tabs */}
                <div
                  className="flex p-1 rounded-2xl gap-1"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  {([
                    { key: 'url' as const, icon: Link2, label: 'Paste URL' },
                    { key: 'manual' as const, icon: PenLine, label: 'Manual Entry' },
                  ]).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setMode(tab.key)}
                      className="flex-1 flex items-center justify-center gap-2 text-[12px] font-semibold py-2 rounded-xl transition-all"
                      style={mode === tab.key
                        ? { background: 'rgba(124,58,237,0.25)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.35)' }
                        : { background: 'transparent', color: '#52525b', border: '1px solid transparent' }}
                    >
                      <tab.icon size={12} /> {tab.label}
                    </button>
                  ))}
                </div>

                {/* URL mode */}
                {mode === 'url' && (
                  <div className="flex flex-col gap-3">
                    <Field label="Hackathon URL">
                      <div className="flex gap-2">
                        <TextInput
                          value={urlInput}
                          onChange={(e) => { setUrlInput(e.target.value); setUrlFetched(false); }}
                          placeholder="https://unstop.com/hackathons/..."
                          onKeyDown={(e) => e.key === 'Enter' && handleFetchUrl()}
                        />
                        <motion.button
                          onClick={handleFetchUrl}
                          disabled={fetching || !urlInput.trim()}
                          className="flex items-center gap-1.5 px-4 rounded-xl text-[12px] font-bold text-white whitespace-nowrap disabled:opacity-40"
                          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', flexShrink: 0 }}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                        >
                          {fetching ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                          {fetching ? 'Fetching…' : 'Auto-fill'}
                        </motion.button>
                      </div>
                      {fetchError && <p className="text-[11px] text-red-400 mt-1.5">{fetchError} — you can fill details manually below.</p>}
                    </Field>

                    {(urlFetched || fetchError) && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[11px] text-zinc-600"
                      >
                        {urlFetched ? '✓ Details auto-filled — review and edit below.' : 'Fill in the details manually:'}
                      </motion.p>
                    )}
                  </div>
                )}

                {/* Form fields (shown after URL fetch or in manual mode) */}
                <AnimatePresence>
                  {(mode === 'manual' || urlFetched || fetchError) && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col gap-4"
                    >
                      <Field label="Title *">
                        <TextInput value={form.title} onChange={set('title')} placeholder="Hackathon name" />
                      </Field>

                      {mode === 'manual' && (
                        <Field label="URL (optional)">
                          <TextInput value={form.url} onChange={set('url')} placeholder="https://..." />
                        </Field>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Platform">
                          <select
                            value={form.platform}
                            onChange={set('platform')}
                            className={inputCls}
                            style={inputStyle}
                          >
                            {PLATFORMS.map((p) => (
                              <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Mode">
                          <div className="flex gap-1">
                            {(['online', 'offline', 'hybrid'] as const).map((m) => (
                              <button
                                key={m}
                                onClick={() => setForm((f) => ({ ...f, mode: m }))}
                                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all capitalize"
                                style={form.mode === m
                                  ? { background: 'rgba(124,58,237,0.25)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.35)' }
                                  : { background: 'rgba(255,255,255,0.04)', color: '#52525b', border: '1px solid rgba(255,255,255,0.07)' }}
                              >
                                {m === 'offline' ? <Building2 size={9} /> : <Globe size={9} />}
                                {m === 'offline' ? 'In-Person' : m.charAt(0).toUpperCase() + m.slice(1)}
                              </button>
                            ))}
                          </div>
                        </Field>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Organizer">
                          <TextInput value={form.organizer} onChange={set('organizer')} placeholder="Company / org" />
                        </Field>
                        <Field label="Prize">
                          <TextInput value={form.prize_amount} onChange={set('prize_amount')} placeholder="$10,000" />
                        </Field>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Deadline">
                          <TextInput type="date" value={form.registration_deadline} onChange={set('registration_deadline')} />
                        </Field>
                        <Field label="End Date">
                          <TextInput type="date" value={form.end_date} onChange={set('end_date')} />
                        </Field>
                      </div>

                      {(form.mode === 'offline' || form.mode === 'hybrid') && (
                        <Field label="Location">
                          <TextInput value={form.location} onChange={set('location')} placeholder="City, Country" />
                        </Field>
                      )}

                      <Field label="Status">
                        <div className="flex flex-wrap gap-1.5">
                          {STATUSES.map((s) => (
                            <button
                              key={s.value}
                              onClick={() => setForm((f) => ({ ...f, application_status: s.value }))}
                              className="text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all"
                              style={form.application_status === s.value
                                ? { background: s.color + '22', border: `1px solid ${s.color}55`, color: s.color }
                                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#52525b' }}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </Field>

                      <Field label="Notes (optional)">
                        <textarea
                          value={form.notes}
                          onChange={set('notes')}
                          placeholder="Team members, ideas, links…"
                          rows={2}
                          className={inputCls + ' resize-none'}
                          style={inputStyle}
                        />
                      </Field>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div
                className="px-6 py-4 flex items-center justify-between gap-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
              >
                {saveError && <p className="text-[11px] text-red-400 flex-1">{saveError}</p>}
                <div className="flex gap-2 ml-auto">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 rounded-xl text-[12px] font-semibold"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#71717a' }}
                  >
                    Cancel
                  </button>
                  <motion.button
                    onClick={handleSubmit}
                    disabled={saving || !form.title.trim()}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-[12px] font-bold text-white disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {saving ? <Loader2 size={12} className="animate-spin" /> : null}
                    {saving ? 'Saving…' : 'Save Hackathon'}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
