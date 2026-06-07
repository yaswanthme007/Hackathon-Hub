import axios from 'axios';
import * as cheerio from 'cheerio';
import { supabaseAdmin } from '../supabase';

export async function scrapeMLH(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const db = supabaseAdmin();
    let total = 0;

    // MLH renders their hackathon list server-side on this endpoint
    const res = await axios.get('https://mlh.io/seasons/2025/events', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'text/html',
      },
      timeout: 20000,
    });

    const $ = cheerio.load(res.data as string);
    const events: Array<{
      title: string; url: string; image: string; date: string; location: string; mode: string;
    }> = [];

    // MLH event cards selector (may change if MLH updates their HTML)
    $('.event').each((_, el) => {
      const title = $(el).find('.event-name').text().trim();
      const url = $(el).find('a.event-link').attr('href') || $(el).find('a').first().attr('href') || '';
      const image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || '';
      const dateText = $(el).find('.event-date').text().trim();
      const location = $(el).find('.event-location').text().trim();
      const isOnline = location.toLowerCase().includes('online') || $(el).find('.event-hybrid-notes').length > 0;

      if (title && url) {
        events.push({
          title,
          url: url.startsWith('http') ? url : `https://mlh.io${url}`,
          image: image.startsWith('//') ? `https:${image}` : image,
          date: dateText,
          location,
          mode: isOnline ? 'online' : location ? 'offline' : 'online',
        });
      }
    });

    for (const event of events) {
      await db.from('hackathons').upsert(
        {
          title: event.title,
          source: 'mlh',
          source_url: event.url,
          image_url: event.image || null,
          organizer: 'MLH',
          mode: event.mode as 'online' | 'offline' | 'hybrid',
          location: event.mode !== 'online' ? event.location || null : null,
          tags: ['MLH', 'Student'],
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'source_url', ignoreDuplicates: false }
      );
      total++;
    }

    return { success: true, count: total };
  } catch (err) {
    console.error('[mlh]', err);
    return { success: false, error: String(err) };
  }
}
