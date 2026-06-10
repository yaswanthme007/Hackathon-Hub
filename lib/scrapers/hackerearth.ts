import axios from 'axios';
import { supabaseAdmin } from '../supabase';

interface HEChallenge {
  title: string;
  url: string;
  cover_image: string;
  description: string;
  start_utc_timestamp: string;
  end_utc_timestamp: string;
  organization_name: string;
  prize: string;
  type: string;
  status: string;
  tags: string[];
  total_participants: number;
  // Location fields (present for in-person hackathons)
  city?: string;
  country?: string;
  location?: string;
  event_type?: string; // 'online', 'offline', 'hybrid'
  is_online?: boolean;
}

export async function scrapeHackerEarth(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const db = supabaseAdmin();
    let total = 0;
    const limit = 80;
    let offset = 0;

    while (true) {
      const res = await axios.get('https://www.hackerearth.com/api/v3/challenges/', {
        params: {
          type: 'hackathon',
          status: 'ongoing,upcoming',
          limit,
          offset,
        },
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; HackathonHub/1.0)',
        },
        timeout: 15000,
      });

      const challenges: HEChallenge[] = res.data?.objects || res.data?.results || [];
      if (challenges.length === 0) break;

      // Build one batch per page and upsert in a single round-trip — per-row
      // awaited upserts are what make the scrape time out on serverless.
      const rows = challenges
        .filter((c) => c.title && c.url)
        .map((c) => {
          const sourceUrl = c.url.startsWith('http') ? c.url : `https://www.hackerearth.com${c.url}`;

          let mode: 'online' | 'offline' | 'hybrid' = 'online';
          let location: string | null = null;

          if (c.event_type === 'offline') {
            mode = 'offline';
          } else if (c.event_type === 'hybrid') {
            mode = 'hybrid';
          } else if (c.is_online === false) {
            mode = 'offline';
          }

          if (mode !== 'online') {
            location = [c.city, c.country].filter(Boolean).join(', ') || c.location || null;
          }

          return {
            title: c.title,
            description: c.description?.replace(/<[^>]+>/g, '').slice(0, 400) || null,
            image_url: c.cover_image || null,
            source: 'hackerearth',
            source_url: sourceUrl,
            organizer: c.organization_name || 'HackerEarth',
            prize_amount: c.prize || null,
            tags: c.tags || [],
            mode,
            location,
            participants_count: c.total_participants || 0,
            start_date: c.start_utc_timestamp || null,
            end_date: c.end_utc_timestamp || null,
            updated_at: new Date().toISOString(),
          };
        });

      if (rows.length > 0) {
        const { error } = await db
          .from('hackathons')
          .upsert(rows, { onConflict: 'source_url', ignoreDuplicates: false });
        if (error) throw error;
        total += rows.length;
      }

      if (challenges.length < limit) break;
      offset += limit;
      if (offset >= 400) break; // cap at ~400 total

      await new Promise((r) => setTimeout(r, 700));
    }

    return { success: true, count: total };
  } catch (err) {
    console.error('[hackerearth]', err);
    return { success: false, error: String(err) };
  }
}
