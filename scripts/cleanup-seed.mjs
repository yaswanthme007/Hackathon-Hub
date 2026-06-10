// One-off: delete the fake seed hackathons (placeholder source_urls).
// Run with:  node --env-file=.env.local scripts/cleanup-seed.mjs
// Uses the PostgREST REST endpoint directly to avoid the supabase-js realtime
// init that fails on Node < 22.
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const FAKE_URLS = [
  'https://mlh.io/hackmit-2025',
  'https://hackerearth.com/climate-tech',
  'https://hackerearth.com/hackthebox-ctf',
  'https://unstop.com/fintech-sprint',
];

const inList = `(${FAKE_URLS.map((u) => `"${u}"`).join(',')})`;
const endpoint = `${URL}/rest/v1/hackathons?source_url=in.${encodeURIComponent(inList)}`;

const res = await fetch(endpoint, {
  method: 'DELETE',
  headers: {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  },
});

if (!res.ok) {
  console.error(`Cleanup failed: ${res.status} ${await res.text()}`);
  process.exit(1);
}

const deleted = await res.json();
console.log(`Deleted ${deleted.length} seed row(s):`);
for (const r of deleted) console.log(`  - ${r.title}  (${r.source_url})`);
