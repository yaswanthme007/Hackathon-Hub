import { NextResponse } from 'next/server';
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
    .select('status, hackathon_id, created_at, hackathons(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const registered = data?.filter((d) => d.status === 'registered') || [];
  const shortlisted = data?.filter((d) => d.status === 'shortlisted') || [];

  return NextResponse.json({
    stats: { registered: registered.length, shortlisted: shortlisted.length, total: data?.length || 0 },
    registered,
    shortlisted,
  });
}
