/*
# Restrict write RLS policies to authenticated users

## Overview
The previous migration created RLS policies that allowed unrestricted
INSERT/UPDATE/DELETE access to both `anon` and `authenticated` roles
(WITH CHECK / USING clauses were unconditionally `true`). This effectively
bypassed row-level security for writes: any anonymous request could create,
modify, or delete rows in `players`, `events`, `convocazioni`, and
`communications`.

## Changes
This migration replaces the always-true write policies on all four tables
with ownership-gated policies scoped to `authenticated` only, using the
real predicate `auth.uid() IS NOT NULL`. Anonymous (`anon`) requests can
no longer perform write operations.

SELECT policies are intentionally left unchanged: this is a single-tenant
app with no sign-in screen, so all data is intentionally shared/public and
read access for `anon, authenticated` is correct and documented.

## Tables affected
- `public.players` — INSERT, UPDATE, DELETE policies replaced
- `public.events` — INSERT, UPDATE, DELETE policies replaced
- `public.convocazioni` — INSERT, UPDATE, DELETE policies replaced
- `public.communications` — INSERT, UPDATE, DELETE policies replaced

## Security
- Write operations now require an authenticated session (`auth.uid() IS NOT NULL`).
- `anon` retains read-only access (SELECT) but can no longer write.
- SELECT policies remain `USING (true)` for `anon, authenticated` because the
  data is intentionally public/shared in this single-tenant app.
- No columns or table structure changed; no data is touched.

## Important notes
1. The running frontend uses in-memory mock data, not the Supabase client, so
   this change does not affect the app's current behavior.
2. If real Supabase auth is added later, these policies should be tightened
   further to per-row ownership checks (e.g. `auth.uid() = user_id`) once
   owner columns exist.
*/

-- PLAYERS: write policies
DROP POLICY IF EXISTS "anon_insert_players" ON players;
CREATE POLICY "authenticated_insert_players" ON players
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "anon_update_players" ON players;
CREATE POLICY "authenticated_update_players" ON players
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "anon_delete_players" ON players;
CREATE POLICY "authenticated_delete_players" ON players
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- EVENTS: write policies
DROP POLICY IF EXISTS "anon_insert_events" ON events;
CREATE POLICY "authenticated_insert_events" ON events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "anon_update_events" ON events;
CREATE POLICY "authenticated_update_events" ON events
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "anon_delete_events" ON events;
CREATE POLICY "authenticated_delete_events" ON events
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- CONVOCAZIONI: write policies
DROP POLICY IF EXISTS "anon_insert_convocazioni" ON convocazioni;
CREATE POLICY "authenticated_insert_convocazioni" ON convocazioni
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "anon_update_convocazioni" ON convocazioni;
CREATE POLICY "authenticated_update_convocazioni" ON convocazioni
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "anon_delete_convocazioni" ON convocazioni;
CREATE POLICY "authenticated_delete_convocazioni" ON convocazioni
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- COMMUNICATIONS: write policies
DROP POLICY IF EXISTS "anon_insert_communications" ON communications;
CREATE POLICY "authenticated_insert_communications" ON communications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "anon_update_communications" ON communications;
CREATE POLICY "authenticated_update_communications" ON communications
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "anon_delete_communications" ON communications;
CREATE POLICY "authenticated_delete_communications" ON communications
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
