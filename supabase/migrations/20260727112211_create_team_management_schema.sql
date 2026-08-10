/*
# Team Management Schema - Cheraschese Esordienti

## Overview
Full schema for managing a youth football team (esordienti).
Single-tenant app (no user authentication required).

## Tables

### 1. players
Roster of all team players.
- id: unique identifier
- name, surname: player name
- number: jersey number
- birth_date: date of birth
- role: position (portiere, difensore, centrocampista, attaccante)
- phone_parent: parent contact number
- email_parent: parent email
- notes: additional notes
- avatar_url: profile photo URL
- active: whether player is in active squad

### 2. events
Calendar events (training, matches, tournaments, retreats).
- id: unique identifier
- title: event name
- event_type: allenamento | partita | torneo | ritiro | altro
- date: event date
- time_start, time_end: start/end time (nullable for full-day)
- location: where the event takes place
- description: additional details
- time_of_day: mattino | pomeriggio | sera | full_day | da_definire

### 3. convocazioni
Squad selection per match/event.
- id: unique identifier
- event_id: FK to events
- player_id: FK to players
- status: convocato | non_convocato | in_dubbio
- response: confermato | declinato | in_attesa (player response)
- notes: notes per player

### 4. communications
Team communications/announcements.
- id: unique identifier
- title: message title
- body: message content
- priority: normale | importante | urgente
- created_at: timestamp
- pinned: whether message is pinned

## Security
- RLS enabled on all tables
- Policies allow anon + authenticated (single-tenant, no login)
*/

-- PLAYERS
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  surname text NOT NULL,
  number integer,
  birth_date date,
  role text NOT NULL DEFAULT 'centrocampista',
  phone_parent text,
  email_parent text,
  notes text,
  avatar_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_players" ON players;
CREATE POLICY "anon_select_players" ON players FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_players" ON players;
CREATE POLICY "anon_insert_players" ON players FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_players" ON players;
CREATE POLICY "anon_update_players" ON players FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_players" ON players;
CREATE POLICY "anon_delete_players" ON players FOR DELETE TO anon, authenticated USING (true);

-- EVENTS
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  event_type text NOT NULL DEFAULT 'allenamento',
  date date NOT NULL,
  time_start time,
  time_end time,
  time_of_day text NOT NULL DEFAULT 'da_definire',
  location text,
  description text,
  opponent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_events" ON events;
CREATE POLICY "anon_select_events" ON events FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_events" ON events;
CREATE POLICY "anon_insert_events" ON events FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_events" ON events;
CREATE POLICY "anon_update_events" ON events FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_events" ON events;
CREATE POLICY "anon_delete_events" ON events FOR DELETE TO anon, authenticated USING (true);

-- CONVOCAZIONI
CREATE TABLE IF NOT EXISTS convocazioni (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'convocato',
  response text NOT NULL DEFAULT 'in_attesa',
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, player_id)
);

ALTER TABLE convocazioni ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_convocazioni" ON convocazioni;
CREATE POLICY "anon_select_convocazioni" ON convocazioni FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_convocazioni" ON convocazioni;
CREATE POLICY "anon_insert_convocazioni" ON convocazioni FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_convocazioni" ON convocazioni;
CREATE POLICY "anon_update_convocazioni" ON convocazioni FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_convocazioni" ON convocazioni;
CREATE POLICY "anon_delete_convocazioni" ON convocazioni FOR DELETE TO anon, authenticated USING (true);

-- COMMUNICATIONS
CREATE TABLE IF NOT EXISTS communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  priority text NOT NULL DEFAULT 'normale',
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_communications" ON communications;
CREATE POLICY "anon_select_communications" ON communications FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_communications" ON communications;
CREATE POLICY "anon_insert_communications" ON communications FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_communications" ON communications;
CREATE POLICY "anon_update_communications" ON communications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_communications" ON communications;
CREATE POLICY "anon_delete_communications" ON communications FOR DELETE TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_convocazioni_event ON convocazioni(event_id);
CREATE INDEX IF NOT EXISTS idx_convocazioni_player ON convocazioni(player_id);
CREATE INDEX IF NOT EXISTS idx_communications_created ON communications(created_at DESC);
