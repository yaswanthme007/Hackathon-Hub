import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('mode');
  const search = searchParams.get('search');
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 12;
  const offset = (page - 1) * limit;

  const db = getSupabase();
  let query = db.from('hackathons').select('*', { count: 'exact' });

  if (mode && mode !== 'all') query = query.eq('mode', mode);
  if (search) query = query.ilike('title', `%${search}%`);

  if (sort === 'deadline') query = query.order('registration_deadline', { ascending: true, nullsFirst: false });
  else if (sort === 'participants') query = query.order('participants_count', { ascending: false });
  else query = query.order('created_at', { ascending: false });

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ hackathons: data, total: count, page, limit });
}
