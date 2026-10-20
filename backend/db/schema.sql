-- =====================================================================
-- InternMatch database schema (Supabase / PostgreSQL)
-- Built from docs/database.md
-- Run this ONCE in Supabase: SQL Editor -> New query -> paste -> Run
-- =====================================================================

-- ---------- 1. Enum types ----------
CREATE TYPE user_role AS ENUM ('student', 'company');

CREATE TYPE round_phase AS ENUM (
  'ranking_open',
  'ranking_locked',
  'shortlisting',
  'shortlist_locked',
  'interviewing',
  'company_ranking',
  'company_locked',
  'matched',
  'revealed'
);

CREATE TYPE shortlist_status AS ENUM ('pending', 'shortlisted', 'rejected');

CREATE TYPE notification_type AS ENUM ('shortlisted', 'matched', 'not_matched');

-- ---------- 2. Tables ----------

-- users: extends Supabase Auth. id must equal auth.users.id
CREATE TABLE users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text NOT NULL,
  role        user_role NOT NULL,
  is_admin    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE students (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name      text NOT NULL,
  department     text NOT NULL,
  year           text NOT NULL,
  skills         text[] NOT NULL DEFAULT '{}',
  portfolio_url  text,
  availability   text,
  contact_email  text NOT NULL,  -- NEVER return via API unless shortlisted
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE companies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  company_name    text NOT NULL,
  industry        text NOT NULL,
  contact_person  text NOT NULL,
  logo_url        text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE rounds (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label               text NOT NULL,
  phase               round_phase NOT NULL DEFAULT 'ranking_open',
  ranking_opens_at    timestamptz,  -- target dates, reference only
  ranking_locks_at    timestamptz,
  shortlist_locks_at  timestamptz,
  company_locks_at    timestamptz,
  reveal_at           timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE postings (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  round_id             uuid NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  title                text NOT NULL,
  required_department  text NOT NULL,
  required_skills      text[] NOT NULL DEFAULT '{}',
  capacity             integer NOT NULL DEFAULT 1 CHECK (capacity >= 1),
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- One row per student per round: this row IS the student's application
CREATE TABLE student_rankings (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id           uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  round_id             uuid NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  ordered_posting_ids  uuid[] NOT NULL DEFAULT '{}',  -- index 0 = top choice
  locked_at            timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, round_id)
);

-- One row per (posting, student) pair per round
CREATE TABLE shortlists (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posting_id        uuid NOT NULL REFERENCES postings(id) ON DELETE CASCADE,
  student_id        uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  round_id          uuid NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  shortlist_status  shortlist_status NOT NULL DEFAULT 'pending',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (posting_id, student_id, round_id)
);

-- One row per posting per round. Use ordered_student_ids OR scores.
CREATE TABLE company_rankings (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posting_id           uuid NOT NULL REFERENCES postings(id) ON DELETE CASCADE,
  round_id             uuid NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  ordered_student_ids  uuid[],   -- nullable
  scores               jsonb,    -- nullable, shape { "student_id": 1-10 }
  locked_at            timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (posting_id, round_id)
);

-- Output of the matching algorithm
CREATE TABLE matches (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id      uuid NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  student_id    uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  posting_id    uuid NOT NULL REFERENCES postings(id) ON DELETE CASCADE,
  mutual_score  numeric NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  -- a student can be matched to at most one posting per round
  UNIQUE (round_id, student_id)
);

CREATE TABLE notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  message     text NOT NULL,
  read        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------- 3. Indexes ----------
CREATE INDEX idx_student_rankings_round ON student_rankings(round_id);
CREATE INDEX idx_company_rankings_round ON company_rankings(round_id);
CREATE INDEX idx_shortlists_posting     ON shortlists(posting_id);
CREATE INDEX idx_shortlists_student     ON shortlists(student_id);
CREATE INDEX idx_matches_round          ON matches(round_id);
CREATE INDEX idx_postings_round         ON postings(round_id);
CREATE INDEX idx_notifications_user     ON notifications(user_id);

-- ---------- 4. Security: lock the tables to the public API ----------
-- Your React app will hold the public "anon" key. With Row Level Security
-- ON and NO policies, that key can read/write NOTHING. Only your Express
-- backend (which uses the secret service_role key) can touch the data.
-- This is how contact_email stays private.
ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE students         ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies        ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds           ENABLE ROW LEVEL SECURITY;
ALTER TABLE postings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortlists       ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    ENABLE ROW LEVEL SECURITY;

-- ---------- 5. First round (needed so the app has an active round) ----------
INSERT INTO rounds (label, phase, ranking_opens_at, ranking_locks_at,
                    shortlist_locks_at, company_locks_at, reveal_at)
VALUES ('Spring 2026', 'ranking_open',
        '2026-02-01', '2026-03-01', '2026-03-20', '2026-05-15', '2026-06-01');
