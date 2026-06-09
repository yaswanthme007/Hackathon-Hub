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

export async function scrapeDevpost(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const pages = [1, 2, 3, 4, 5]; // fetch up to 5 pages = ~250 hackathons
    let total = 0;
    const db = supabaseAdmin();

    for (const page of pages) {
      const url =
        `https://devpost.com/api/hackathons?status[]=upcoming&status[]=open` +
        `&order_by=recently-added&per_page=50&page=${page}`;

      const res = await axios.get(url, { headers: HEADERS, timeout: 15000 });
      const challenges: DevpostChallenge[] = res.data?.hackathons || [];
      if (challenges.length === 0) break;

      for (const c of challenges) {
        const tags = c.themes?.map((t) => t.name) || [];
        const mode = c.online_hackathon === false ? 'offline' : 'online';

        await db.from('hackathons').upsert(
          {
            title: c.title,
            description: c.tagline || null,
            image_url: c.thumbnail_url || null,
            source: 'devpost',
            source_url: c.url,
            organizer: c.organization_name || null,
            prize_amount: stripHtml(c.prize_amount),
            tags,
            mode,
            location: c.location || null,
            participants_count: c.registrations_count || 0,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'source_url', ignoreDuplicates: false }
        );
        total++;
      }

      // polite delay between pages
      await new Promise((r) => setTimeout(r, 800));
    }

    return { success: true, count: total };
  } catch (err) {
    console.error('[devpost]', err);
    return { success: false, error: String(err) };
  }
}
