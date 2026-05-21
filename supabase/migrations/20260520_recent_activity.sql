-- Recent activity column on user_collections.
-- Stores up to MAX_ACTIVITY_ENTRIES entries client-side; the server just holds
-- whatever the client writes. Default empty array so existing rows don't break.

alter table public.user_collections
  add column if not exists recent_activity jsonb not null default '[]'::jsonb;

-- No RLS changes needed: the existing policies already cover all columns
-- (auth.uid() = user_id for select/insert/update/delete).
