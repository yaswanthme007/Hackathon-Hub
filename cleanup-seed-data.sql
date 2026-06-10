-- One-time cleanup: remove the fake sample hackathons that were seeded at
-- setup. They have placeholder source_urls that the scrapers can never
-- match/update, so they linger as junk (and the MLH one will never refresh now
-- that the MLH scraper is removed). Already run once on 2026-06-10; kept for the
-- record. Real scraped rows have full source_urls and are unaffected.
DELETE FROM hackathons
WHERE source_url IN (
  'https://mlh.io/hackmit-2025',
  'https://hackerearth.com/climate-tech',
  'https://hackerearth.com/hackthebox-ctf',
  'https://unstop.com/fintech-sprint'
);
