import axios from 'axios';
import { supabaseAdmin } from '../supabase';

interface DevfolioHackathon {
  slug: string;
  name: string;
  tagline: string;
  cover_image: string;
  starts_at: string;
  ends_at: string;
  registration_deadline: string;
  prize_amount: number;
  total_applications: number;
  is_online: boolean;
  hybrid?: boolean;       // some hackathons have both online + in-person tracks
  city: string;
  country: string;
  tags: string[];
  status: string; // 'open', 'upcoming', 'closed'
}

export async function scrapeDevfolio(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const db = supabaseAdmin();
    let total = 0;
    let offset = 0;
    const limit = 40;

    while (true) {
      // Devfolio public search API
      const res = await axios.get('https://api.devfolio.co/api/search/hackathons', {
        params: { offset, limit, status: 'open,upcoming' },
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; HackathonHub/1.0)',
        },
        timeout: 15000,
      });

      const hackathons: DevfolioHackathon[] = res.data?.results || res.data?.hackathons || [];
      if (hackathons.length === 0) break;

      for (const h of hackathons) {
        if (!['open', 'upcoming'].includes(h.status)) continue;

        await db.from('hackathons').upsert(
          {
            title: h.name,
            description: h.tagline || null,
            image_url: h.cover_image || null,
            source: 'devfolio',
            source_url: `https://${h.slug}.devfolio.co`,
            prize_amount: h.prize_amount ? `$${h.prize_amount.toLocaleString()}` : null,
            tags: h.tags || [],
            mode: h.hybrid ? 'hybrid' : h.is_online ? 'online' : 'offline',
            location: (!h.is_online || h.hybrid) ? [h.city, h.country].filter(Boolean).join(', ') || null : null,
            participants_count: h.total_applications || 0,
            registration_deadline: h.registration_deadline || null,
            start_date: h.starts_at || null,
            end_date: h.ends_at || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'source_url', ignoreDuplicates: false }
        );
        total++;
      }

      if (hackathons.length < limit) break;
      offset += limit;
      if (offset > 200) break; // cap at ~200 hackathons

      await new Promise((r) => setTimeout(r, 700));
    }

    return { success: true, count: total };
  } catch (err) {
    console.error('[devfolio]', err);
    return { success: false, error: String(err) };
  }
}
