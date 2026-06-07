import axios from 'axios';
import { supabaseAdmin } from '../supabase';

interface UnstopCompetition {
  uid: string;
  title: string;
  short_description: string;
  cover_image: string;
  organisation_title: string;
  prizes: string;
  registrations_count: number;
  application_deadline: string;
  start_date: string;
  end_date: string;
  is_online: boolean;
  type: string; // 'offline', 'online', 'hybrid'
  city: string;
  country: string;
  tags: Array<{ name: string }>;
  slug: string;
}

const HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'User-Agent': 'Mozilla/5.0 (compatible; HackathonHub/1.0)',
  Referer: 'https://unstop.com/hackathons',
  Origin: 'https://unstop.com',
};

function extractList(data: unknown): UnstopCompetition[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    // Try common Unstop response shapes
    for (const key of ['data', 'results', 'opportunities', 'hackathons', 'competitions']) {
      const val = d[key];
      if (Array.isArray(val) && val.length > 0) return val;
      if (val && typeof val === 'object') {
        const inner = extractList(val);
        if (inner.length > 0) return inner;
      }
    }
  }
  return [];
}

export async function scrapeUnstop(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const db = supabaseAdmin();
    let total = 0;

    // Try primary Unstop API endpoint
    const res = await axios.post(
      'https://unstop.com/api/public/opportunity/search-result',
      {
        opportunity: 'hackathon',
        page: 1,
        size: 80,
        filters: { status: ['open', 'upcoming'] },
      },
      { headers: HEADERS, timeout: 20000 }
    );

    const competitions = extractList(res.data);

    for (const c of competitions) {
      if (!c.title) continue;

      const sourceUrl = `https://unstop.com/hackathons/${c.slug || c.uid}`;
      const tags = c.tags?.map((t) => t.name) || [];

      // Detect mode: prefer explicit type field, fall back to is_online
      let mode: 'online' | 'offline' | 'hybrid' = 'online';
      if (c.type === 'offline' || c.type === 'in-person') {
        mode = 'offline';
      } else if (c.type === 'hybrid') {
        mode = 'hybrid';
      } else if (c.is_online === false) {
        mode = 'offline';
      }

      const location = mode !== 'online'
        ? [c.city, c.country].filter(Boolean).join(', ') || null
        : null;

      await db.from('hackathons').upsert(
        {
          title: c.title,
          description: c.short_description || null,
          image_url: c.cover_image || null,
          source: 'unstop',
          source_url: sourceUrl,
          organizer: c.organisation_title || null,
          prize_amount: c.prizes || null,
          tags,
          mode,
          location,
          participants_count: c.registrations_count || 0,
          registration_deadline: c.application_deadline || null,
          start_date: c.start_date || null,
          end_date: c.end_date || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'source_url', ignoreDuplicates: false }
      );
      total++;
    }

    return { success: true, count: total };
  } catch (err) {
    console.error('[unstop]', err);
    return { success: false, error: String(err) };
  }
}
