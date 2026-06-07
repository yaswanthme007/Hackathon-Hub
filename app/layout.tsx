import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HackathonHub — Discover & Track Hackathons',
  description: 'Discover hackathons from Devpost, MLH, HackerEarth, and more. Track your registrations and shortlists.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0a0a0f] text-white antialiased min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
