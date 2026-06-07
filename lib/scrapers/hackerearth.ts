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
  type: string; // 'HACKATHON'
  status: string; // 'ONGOING', 'UPCOMING'
  tags: string[];
  total_participants: number;
}

export async function scrapeHackerEarth(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const db = supabaseAdmin();
    let total = 0;

    // HackerEarth has a public challenges listing API
    const res = await axios.get('https://www.hackerearth.com/api/v3/challenges/', {
      params: {
        type: 'hackathon',
        status: 'ongoing,upcoming',
        limit: 80,
        offset: 0,
      },
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; HackathonHub/1.0)',
      },
      timeout: 15000,
    });

    const challenges: HEChallenge[] = res.data?.objects || res.data?.results || [];

    for (const c of challenges) {
      if (!c.title || !c.url) continue;
      const sourceUrl = c.url.startsWith('http') ? c.url : `https://www.hackerearth.com${c.url}`;

      await db.from('hackathons').upsert(
        {
          title: c.title,
          description: c.description?.replace(/<[^>]+>/g, '').slice(0, 400) || null,
          image_url: c.cover_image || null,
          source: 'hackerearth',
          source_url: sourceUrl,
          organizer: c.organization_name || 'HackerEarth',
          prize_amount: c.prize || null,
          tags: c.tags || [],
          mode: 'online',
          participants_count: c.total_participants || 0,
          start_date: c.start_utc_timestamp || null,
          end_date: c.end_utc_timestamp || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'source_url', ignoreDuplicates: false }
      );
      total++;
    }

    return { success: true, count: total };
  } catch (err) {
    console.error('[hackerearth]', err);
    return { success: false, error: String(err) };
  }
}
