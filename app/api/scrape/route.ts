import { NextRequest, NextResponse } from 'next/server';
import { scrapeDevpost } from '@/lib/scrapers/devpost';
import { scrapeUnstop } from '@/lib/scrapers/unstop';
import { scrapeHackerEarth } from '@/lib/scrapers/hackerearth';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min — scraping takes time

const SCRAPERS: Record<string, () => Promise<{ success: boolean; count?: number; error?: string }>> = {
  devpost: scrapeDevpost,
  unstop: scrapeUnstop,
  hackerearth: scrapeHackerEarth,
};

function authorized(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const secret = process.env.SCRAPE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return auth === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { sources?: string[] };
  const sources = body.sources ?? Object.keys(SCRAPERS);

  const results: Record<string, { success: boolean; count?: number; error?: string }> = {};
  const startedAt = Date.now();

  for (const source of sources) {
    if (!SCRAPERS[source]) {
      results[source] = { success: false, error: 'Unknown scraper' };
      continue;
    }
    console.log(`[scrape] starting ${source}`);
    results[source] = await SCRAPERS[source]();
    console.log(`[scrape] ${source}:`, results[source]);
  }

  const totalInserted = Object.values(results).reduce((s, r) => s + (r.count ?? 0), 0);
  return NextResponse.json({
    results,
    total: totalInserted,
    duration_ms: Date.now() - startedAt,
  });
}

// Lightweight status check
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ scrapers: Object.keys(SCRAPERS), status: 'ready' });
}
