import axios from 'axios';
import { supabaseAdmin } from '../supabase';

interface DoraHack {
  key: string;
  title: string;
  description: string;
  cover_image_url: string;
  prize_pool: number;
  currency: string;
  organizer_name: string;
  registration_deadline: string;
  hacker_registration_open_at: string;
  voting_starts_at: string;
  voting_ends_at: string;
  registrant_count: number;
  tags: string[];
  location: string;
  event_type: string; // 'online', 'offline', 'hybrid'
  status: string;
}

export async function scrapeDoraHacks(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const db = supabaseAdmin();
    let total = 0;

    // DoraHacks public API
    const res = await axios.get('https://dorahacks.io/api/hackathon/list', {
      params: { limit: 50, offset: 0, status: 'open,upcoming' },
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; HackathonHub/1.0)',
      },
      timeout: 15000,
    });

    const hackathons: DoraHack[] = res.data?.data || res.data?.hackathons || res.data || [];

    for (const h of hackathons) {
      if (!h.key && !h.title) continue;

      const mode = h.event_type === 'offline' ? 'offline' : h.event_type === 'hybrid' ? 'hybrid' : 'online';
      const prizeText = h.prize_pool ? `${h.currency || '$'}${Number(h.prize_pool).toLocaleString()}` : null;
      const sourceUrl = `https://dorahacks.io/hackathon/${h.key}`;

      await db.from('hackathons').upsert(
        {
          title: h.title,
          description: h.description?.slice(0, 500) || null,
          image_url: h.cover_image_url || null,
          source: 'dorahacks',
          source_url: sourceUrl,
          organizer: h.organizer_name || null,
          prize_amount: prizeText,
          tags: h.tags || [],
          mode,
          location: mode !== 'online' ? h.location || null : null,
          participants_count: h.registrant_count || 0,
          registration_deadline: h.registration_deadline || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'source_url', ignoreDuplicates: false }
      );
      total++;
    }

    return { success: true, count: total };
  } catch (err) {
    console.error('[dorahacks]', err);
    return { success: false, error: String(err) };
  }
}
