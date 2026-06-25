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

  const [{ data: uhData, error: uhErr }, { data: trackedData, error: trackedErr }] = await Promise.all([
    db.from('user_hackathons')
      .select('status, hackathon_id, chat_links, created_at, hackathons(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    db.from('user_tracked_hackathons')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ]);

  if (uhErr)      return NextResponse.json({ error: uhErr.message },      { status: 500 });
  if (trackedErr) return NextResponse.json({ error: trackedErr.message }, { status: 500 });

  const registered  = uhData?.filter((d) => d.status === 'registered')  || [];
  const shortlisted = uhData?.filter((d) => d.status === 'shortlisted') || [];
  const tracked     = trackedData || [];

  return NextResponse.json({
    stats: {
      registered:  registered.length,
      shortlisted: shortlisted.length,
      tracked:     tracked.length,
      total:       (uhData?.length || 0) + tracked.length,
    },
    registered,
    shortlisted,
    tracked,
  });
}
