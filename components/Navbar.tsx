'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Zap, LayoutDashboard, LogOut, ChevronDown, Menu, X, Compass } from 'lucide-react';

export default function Navbar() {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const navLinks = [
    { href: '/', label: 'Discover', icon: Compass },
    ...(session ? [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] : []),
  ];

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        animate={{
          backgroundColor: scrolled ? 'rgba(7,7,15,0.88)' : 'rgba(7,7,15,0)',
          borderBottomColor: scrolled ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0)',
          backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'blur(0px)',
        }}
        style={{ borderBottomWidth: 1 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <motion.div
                className="w-9 h-9 rounded-xl flex items-center justify-center relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
                whileHover={{ scale: 1.08, rotate: 8 }}
                whileTap={{ scale: 0.93 }}
              >
                <motion.div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15), transparent)' }}
                />
                <Zap size={16} className="text-white relative z-10" />
              </motion.div>
              <span className="font-extrabold text-[17px] tracking-tight">
                Hackathon<span className="gradient-text">Hub</span>
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link key={link.href} href={link.href}>
                    <motion.div
                      className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 ${
                        active ? 'text-white' : 'text-zinc-500 hover:text-zinc-200'
                      }`}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {active && (
                        <motion.div
                          layoutId="nav-pill"
                          className="absolute inset-0 rounded-xl"
                          style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }}
                          transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
                        />
                      )}
                      <link.icon size={14} className="relative z-10" />
                      <span className="relative z-10">{link.label}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            {/* Auth section */}
            <div className="hidden md:flex items-center gap-3">
              {session ? (
                <div className="relative" ref={dropdownRef}>
                  <motion.button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2.5 rounded-full px-3 py-1.5 transition-all duration-200 group"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.09)',
                    }}
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.09)' }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="relative">
                      {session.user?.image ? (
                        <Image
                          src={session.user.image}
                          alt="Avatar"
                          width={26}
                          height={26}
                          className="rounded-full ring-1 ring-violet-500/40"
                        />
                      ) : (
                        <div className="w-[26px] h-[26px] rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
                          {session.user?.name?.[0]}
                        </div>
                      )}
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#07070f]" />
                    </div>
                    <span className="text-sm font-medium text-zinc-200 max-w-[100px] truncate">
                      {session.user?.name?.split(' ')[0]}
                    </span>
                    <motion.div animate={{ rotate: dropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={13} className="text-zinc-500" />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.96 }}
                        transition={{ type: 'spring', duration: 0.25, bounce: 0.1 }}
                        className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
                        style={{ background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        <div className="px-3 py-2.5 border-b border-white/5">
                          <p className="text-xs text-zinc-500 truncate">{session.user?.email}</p>
                        </div>
                        <Link
                          href="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-all"
                        >
                          <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center">
                            <LayoutDashboard size={13} className="text-violet-400" />
                          </div>
                          My Dashboard
                        </Link>
                        <div className="mx-3 border-t border-white/5" />
                        <button
                          onClick={() => { signOut(); setDropdownOpen(false); }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/8 transition-all"
                        >
                          <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
                            <LogOut size={13} className="text-red-400" />
                          </div>
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.button
                  onClick={() => signIn('google')}
                  className="btn-glow flex items-center gap-2 text-white text-sm font-semibold px-5 py-2.5 rounded-full"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/>
                  </svg>
                  Sign in
                </motion.button>
              )}
            </div>

            {/* Mobile toggle */}
            <motion.button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
              whileTap={{ scale: 0.9 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={mobileOpen ? 'x' : 'menu'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden overflow-hidden"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#07070f' }}
            >
              <div className="px-4 py-4 space-y-1">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Link
                      href={link.href}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        pathname === link.href
                          ? 'bg-violet-500/15 text-violet-300'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <link.icon size={15} />
                      {link.label}
                    </Link>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navLinks.length * 0.06 }}
                  className="pt-2 border-t border-white/5"
                >
                  {session ? (
                    <button
                      onClick={() => signOut()}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  ) : (
                    <button
                      onClick={() => signIn('google')}
                      className="flex items-center justify-center gap-2 w-full text-white text-sm font-semibold px-4 py-3 rounded-xl btn-glow"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
                    >
                      Sign in with Google
                    </button>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}
