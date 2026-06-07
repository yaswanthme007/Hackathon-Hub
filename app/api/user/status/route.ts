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
    .from('user_hackathons')
    .select('hackathon_id, status')
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const statusMap: Record<string, string> = {};
  data?.forEach((row) => { statusMap[row.hackathon_id] = row.status; });
  return NextResponse.json({ statusMap });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const { hackathon_id, status } = await req.json();

  if (!hackathon_id || !['registered', 'shortlisted'].includes(status)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data, error } = await db
    .from('user_hackathons')
    .upsert({ user_id: userId, hackathon_id, status }, { onConflict: 'user_id,hackathon_id' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const { hackathon_id } = await req.json();

  const db = supabaseAdmin();
  const { error } = await db
    .from('user_hackathons')
    .delete()
    .eq('user_id', userId)
    .eq('hackathon_id', hackathon_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
