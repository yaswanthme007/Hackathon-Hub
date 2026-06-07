import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode     = searchParams.get('mode');
  const search   = searchParams.get('search');
  const tag      = searchParams.get('tag');
  const sort     = searchParams.get('sort') || 'newest';
  const deadline = searchParams.get('deadline') || 'all';
  const page     = parseInt(searchParams.get('page') || '1');
  const limit    = 12;
  const offset   = (page - 1) * limit;

  const db  = getSupabase();
  let query = db.from('hackathons').select('*', { count: 'exact' });

  // Mode filter — "In-Person" shows offline + hybrid since both have physical components
  if (mode === 'offline') {
    query = query.or('mode.eq.offline,mode.eq.hybrid');
  } else if (mode && mode !== 'all') {
    query = query.eq('mode', mode);
  }

  // Text search on title
  if (search) query = query.ilike('title', `%${search}%`);

  // Exact tag filter
  if (tag) query = query.contains('tags', [tag]);

  // Deadline range filter
  const now = new Date().toISOString();
  if (deadline === 'today') {
    const d3 = new Date(Date.now() + 3 * 86_400_000).toISOString();
    query = query.gte('registration_deadline', now).lte('registration_deadline', d3);
  } else if (deadline === 'week') {
    const d7 = new Date(Date.now() + 7 * 86_400_000).toISOString();
    query = query.gte('registration_deadline', now).lte('registration_deadline', d7);
  } else if (deadline === 'month') {
    const d30 = new Date(Date.now() + 30 * 86_400_000).toISOString();
    query = query.gte('registration_deadline', now).lte('registration_deadline', d30);
  }

  // Sort
  if (sort === 'deadline')     query = query.order('registration_deadline', { ascending: true,  nullsFirst: false });
  else if (sort === 'participants') query = query.order('participants_count',    { ascending: false });
  else                          query = query.order('created_at',              { ascending: false });

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ hackathons: data, total: count, page, limit });
}
