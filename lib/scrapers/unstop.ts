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
  city: string;
  country: string;
  tags: Array<{ name: string }>;
  type: string;
  slug: string;
}

export async function scrapeUnstop(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const db = supabaseAdmin();
    let total = 0;

    // Unstop public competitions API
    const res = await axios.post(
      'https://unstop.com/api/public/opportunity/search-result',
      {
        opportunity: 'hackathon',
        status: 'open',
        page: 1,
        size: 60,
        filters: { status: ['open', 'upcoming'] },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; HackathonHub/1.0)',
          Referer: 'https://unstop.com/hackathons',
        },
        timeout: 20000,
      }
    );

    const data = res.data?.data?.data || res.data?.data || [];
    const competitions: UnstopCompetition[] = Array.isArray(data) ? data : [];

    for (const c of competitions) {
      if (!c.title) continue;
      const sourceUrl = `https://unstop.com/hackathons/${c.slug || c.uid}`;
      const tags = c.tags?.map((t) => t.name) || [];

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
          mode: c.is_online ? 'online' : 'offline',
          location: !c.is_online ? [c.city, c.country].filter(Boolean).join(', ') || null : null,
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
