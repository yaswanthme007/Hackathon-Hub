import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const db = supabaseAdmin();

  const { data, error } = await db
    .from('user_tracked_hackathons')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tracked: data || [] });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const body = await req.json();
  const {
    title, url, organizer, platform, registration_deadline, start_date, end_date,
    prize_amount, mode, location, tags, description, image_url, application_status, notes,
  } = body;

  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from('user_tracked_hackathons')
    .insert({
      user_id:               userId,
      title:                 title.trim(),
      url:                   url?.trim()            || null,
      organizer:             organizer?.trim()      || null,
      platform:              platform               || 'other',
      registration_deadline: registration_deadline  || null,
      start_date:            start_date             || null,
      end_date:              end_date               || null,
      prize_amount:          prize_amount?.trim()   || null,
      mode:                  mode                   || 'online',
      location:              location?.trim()       || null,
      tags:                  Array.isArray(tags) ? tags : [],
      description:           description?.trim()    || null,
      image_url:             image_url?.trim()      || null,
      application_status:    application_status     || 'applied',
      chat_links:            [],
      notes:                 notes?.trim()          || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
