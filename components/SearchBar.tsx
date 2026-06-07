'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Command } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: Props) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && focused) {
        inputRef.current?.blur();
        onChange('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focused, onChange]);

  return (
    <motion.div
      className="relative"
      animate={{ scale: focused ? 1.015 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Glow ring */}
      <AnimatePresence>
        {focused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -inset-[3px] rounded-[20px] pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.5), rgba(56,189,248,0.3))',
              filter: 'blur(6px)',
            }}
          />
        )}
      </AnimatePresence>

      <div
        className="relative flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300"
        style={{
          background: focused ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${focused ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.09)'}`,
        }}
      >
        {/* Search icon */}
        <motion.div animate={{ color: focused ? '#a78bfa' : '#52525b' }} transition={{ duration: 0.2 }}>
          <Search size={18} />
        </motion.div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search hackathons, themes, tech stack..."
          className="flex-1 bg-transparent text-white text-sm placeholder-zinc-600 outline-none"
        />

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <AnimatePresence>
            {value && (
              <motion.button
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                onClick={() => onChange('')}
                className="w-5 h-5 rounded-full flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
                whileTap={{ scale: 0.85 }}
              >
                <X size={12} />
              </motion.button>
            )}
          </AnimatePresence>

          {!focused && !value && (
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-zinc-600 font-medium"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Command size={9} />
              K
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
