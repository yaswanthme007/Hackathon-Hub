'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, Trash2, ExternalLink, Bot, Sparkles, Link2 } from 'lucide-react';
import { ChatLink } from '@/types';

interface Props {
  chatLinks: ChatLink[];
  onUpdate: (links: ChatLink[]) => void;
  saving?: boolean;
}

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  chatgpt: Sparkles,
  claude:  Bot,
  other:   Link2,
};

const PLATFORM_COLORS: Record<string, string> = {
  chatgpt: '#10a37f',
  claude:  '#d97706',
  other:   '#a1a1aa',
};

function detectPlatform(url: string): ChatLink['platform'] {
  if (url.includes('chat.openai.com') || url.includes('chatgpt.com')) return 'chatgpt';
  if (url.includes('claude.ai'))                                       return 'claude';
  return 'other';
}

export default function ChatLinksPanel({ chatLinks, onUpdate, saving }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding]     = useState(false);
  const [newUrl, setNewUrl]     = useState('');
  const [newLabel, setNewLabel] = useState('');

  const handleAdd = () => {
    const trimmed = newUrl.trim();
    if (!trimmed) return;
    let url = trimmed;
    if (!url.startsWith('http')) url = 'https://' + url;

    const link: ChatLink = {
      id:       crypto.randomUUID(),
      url,
      label:    newLabel.trim() || 'Chat',
      platform: detectPlatform(url),
    };
    onUpdate([...chatLinks, link]);
    setNewUrl('');
    setNewLabel('');
    setAdding(false);
  };

  const handleRemove = (id: string) => {
    onUpdate(chatLinks.filter((l) => l.id !== id));
  };

  return (
    <div className="border-t mt-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
      {/* Toggle row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-[11px] font-semibold transition-colors"
        style={{ color: expanded ? '#a1a1aa' : '#52525b' }}
      >
        <MessageSquare size={11} />
        <span>Chat Links</span>
        {chatLinks.length > 0 && (
          <span
            className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#a1a1aa' }}
          >
            {chatLinks.length}
          </span>
        )}
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-auto text-[9px]"
        >
          ▼
        </motion.span>
        {saving && <span className="text-[9px] text-zinc-600 ml-1">saving…</span>}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 flex flex-col gap-1.5">
              {chatLinks.map((link) => {
                const Icon  = PLATFORM_ICONS[link.platform];
                const color = PLATFORM_COLORS[link.platform];
                return (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 group/link"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <Icon size={10} style={{ color, flexShrink: 0 }} />
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-[11px] font-medium truncate hover:underline"
                      style={{ color: '#a1a1aa' }}
                    >
                      {link.label}
                    </a>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-0 group-hover/link:opacity-100 transition-opacity"
                    >
                      <ExternalLink size={9} style={{ color: '#52525b' }} />
                    </a>
                    <button
                      onClick={() => handleRemove(link.id)}
                      className="opacity-0 group-hover/link:opacity-100 transition-opacity"
                    >
                      <Trash2 size={9} style={{ color: '#ef4444' }} />
                    </button>
                  </motion.div>
                );
              })}

              <AnimatePresence>
                {adding ? (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex flex-col gap-1.5"
                  >
                    <input
                      autoFocus
                      placeholder="Paste chat link URL…"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
                      className="w-full text-[11px] px-2.5 py-1.5 rounded-xl outline-none text-zinc-300 placeholder-zinc-700"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}
                    />
                    <input
                      placeholder="Label (e.g. Team planning)"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
                      className="w-full text-[11px] px-2.5 py-1.5 rounded-xl outline-none text-zinc-300 placeholder-zinc-700"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}
                    />
                    <div className="flex gap-1.5">
                      <button
                        onClick={handleAdd}
                        className="flex-1 text-[11px] font-semibold py-1 rounded-lg text-white"
                        style={{ background: 'rgba(124,58,237,0.4)', border: '1px solid rgba(124,58,237,0.4)' }}
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setAdding(false)}
                        className="flex-1 text-[11px] font-semibold py-1 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.05)', color: '#71717a' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <button
                    onClick={() => setAdding(true)}
                    className="flex items-center gap-1.5 text-[11px] font-medium py-1 transition-colors"
                    style={{ color: '#52525b' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#a1a1aa')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#52525b')}
                  >
                    <Plus size={10} />
                    Add chat link
                  </button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
