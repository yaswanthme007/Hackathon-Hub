import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { parse } from 'node-html-parser';

export const dynamic = 'force-dynamic';

function detectPlatform(hostname: string): string {
  if (hostname.includes('unstop.com'))      return 'unstop';
  if (hostname.includes('devfolio.co'))     return 'devfolio';
  if (hostname.includes('devpost.com'))     return 'devpost';
  if (hostname.includes('hackerearth.com')) return 'hackerearth';
  if (hostname.includes('dorahacks.io'))    return 'dorahacks';
  if (hostname.includes('mlh.io'))          return 'mlh';
  if (hostname.includes('kaggle.com'))      return 'kaggle';
  if (hostname.includes('lablab.ai'))       return 'lablab';
  return 'other';
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

  let parsed: URL;
  try { parsed = new URL(url); } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  const platform = detectPlatform(parsed.hostname);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Could not fetch page (HTTP ${res.status})`, platform },
        { status: 422 },
      );
    }

    const html = await res.text();
    const root = parse(html);

    const getMeta = (prop: string) =>
      root.querySelector(`meta[property="${prop}"]`)?.getAttribute('content') ||
      root.querySelector(`meta[name="${prop}"]`)?.getAttribute('content') ||
      null;

    const rawTitle   = getMeta('og:title')       || root.querySelector('title')?.text || null;
    const rawDesc    = getMeta('og:description') || getMeta('description')            || null;
    const image_url  = getMeta('og:image')                                             || null;
    const siteName   = getMeta('og:site_name')                                         || null;

    let start_date: string | null = null;
    let end_date:   string | null = null;
    let location:   string | null = null;
    let organizer:  string | null = null;

    for (const script of root.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const ld   = JSON.parse(script.text);
        const entry = Array.isArray(ld) ? ld[0] : ld;
        const type  = entry['@type'];
        if (type === 'Event' || type === 'Hackathon' || type === 'SportsEvent') {
          start_date = (entry.startDate as string) || null;
          end_date   = (entry.endDate   as string) || null;
          if (entry.location?.name)   location  = entry.location.name  as string;
          if (entry.organizer?.name)  organizer = entry.organizer.name as string;
          break;
        }
      } catch { /* ignore malformed JSON-LD */ }
    }

    // Unstop: try to parse date from page text when JSON-LD has nothing
    if (platform === 'unstop' && !end_date) {
      organizer = organizer || siteName || 'Unstop';
      const dateMatches = html.match(/(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*,?\s+\d{4})/gi);
      if (dateMatches?.length) {
        try { end_date = new Date(dateMatches[dateMatches.length - 1]).toISOString(); } catch { /* ignore */ }
      }
    }

    const title = rawTitle
      ?.replace(/\s*[-|–|•|·]\s*(Unstop|Devfolio|Devpost|HackerEarth|DoraHacks|Kaggle|MLH)\b.*/i, '')
      ?.replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim() || null;

    const description = rawDesc
      ?.replace(/&amp;/g, '&').replace(/&#39;/g, "'").slice(0, 600) || null;

    return NextResponse.json({ title, description, image_url, organizer, start_date, end_date, location, platform });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch', platform },
      { status: 422 },
    );
  }
}
