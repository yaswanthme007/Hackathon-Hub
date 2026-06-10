import axios from 'axios';
import { supabaseAdmin } from '../supabase';

interface DevpostChallenge {
  id: number;
  title: string;
  tagline: string;
  url: string;
  thumbnail_url: string;
  prize_amount: string;
  registrations_count: number;
  organization_name: string;
  submission_period_dates: string;
  open_state: string;
  featured: boolean;
  themes: Array<{ id: number; name: string }>;
  location?: string;
  online_hackathon?: boolean;
}

const HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'Mozilla/5.0 (compatible; HackathonHub/1.0)',
};

function stripHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#36;/g, '$')
    .trim();
  return text || null;
}

/**
 * Devpost gives a human range like "Nov 14 - Dec 15, 2025" or
 * "Dec 02, 2025 - Feb 10, 2026". Parse it into ISO start/end dates so the
 * rows can be sorted/filtered by proximity (otherwise every Devpost row has
 * null dates and looks "far away" / never gets filtered when it ends).
 */
function parseDevpostDates(raw: string | null | undefined): { start: string | null; end: string | null } {
  if (!raw) return { start: null, end: null };
  const parts = raw.split(/\s+-\s+/);
  if (parts.length !== 2) return { start: null, end: null };

  let [left] = parts.map((p) => p.trim());
  const right = parts[1].trim();
  // The year usually appears only on the right side; borrow it for the left.
  const rightYear = right.match(/\b(20\d{2})\b/)?.[1];
  if (rightYear && !/\b20\d{2}\b/.test(left)) left = `${left}, ${rightYear}`;

  let start = Date.parse(left);
  const end = Date.parse(right);

  // Year-crossing range (e.g. "Dec 28 - Jan 05, 2027"): borrowing the right
  // year puts the start after the end. When that happens, the start belongs to
  // the previous year.
  if (!Number.isNaN(start) && !Number.isNaN(end) && start > end) {
    const back = new Date(start);
    back.setFullYear(back.getFullYear() - 1);
    start = back.getTime();
  }

  return {
    start: Number.isNaN(start) ? null : new Date(start).toISOString(),
    end: Number.isNaN(end) ? null : new Date(end).toISOString(),
  };
}

export async function scrapeDevpost(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const pages = [1, 2, 3, 4, 5]; // up to 5 pages = ~250 hackathons
    const db = supabaseAdmin();
    let total = 0;

    for (const page of pages) {
      const url =
        `https://devpost.com/api/hackathons?status[]=upcoming&status[]=open` +
        `&order_by=recently-added&per_page=50&page=${page}`;

      const res = await axios.get(url, { headers: HEADERS, timeout: 15000 });
      const challenges: DevpostChallenge[] = res.data?.hackathons || [];
      if (challenges.length === 0) break;

      // Build one batch and upsert it in a single round-trip (per-row upserts
      // in a loop are what makes the scrape time out on serverless).
      const rows = challenges.map((c) => {
        const { start, end } = parseDevpostDates(c.submission_period_dates);
        return {
          title: c.title,
          description: c.tagline || null,
          image_url: c.thumbnail_url || null,
          source: 'devpost',
          source_url: c.url,
          organizer: c.organization_name || null,
          prize_amount: stripHtml(c.prize_amount),
          tags: c.themes?.map((t) => t.name) || [],
          mode: c.online_hackathon === false ? 'offline' : 'online',
          location: c.location || null,
          participants_count: c.registrations_count || 0,
          start_date: start,
          end_date: end,
          // Devpost has no separate registration deadline; submissions close at end.
          registration_deadline: end,
          updated_at: new Date().toISOString(),
        };
      });

      const { error } = await db
        .from('hackathons')
        .upsert(rows, { onConflict: 'source_url', ignoreDuplicates: false });
      if (error) throw error;
      total += rows.length;

      await new Promise((r) => setTimeout(r, 600)); // polite delay between pages
    }

    return { success: true, count: total };
  } catch (err) {
    console.error('[devpost]', err);
    return { success: false, error: String(err) };
  }
}
