-- Round phases and in-app notification storage.
DO $$ BEGIN CREATE TYPE notification_type AS ENUM ('shortlisted','matched','not_matched'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS rounds (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), label text NOT NULL, phase text NOT NULL DEFAULT 'ranking_open' CHECK(phase IN ('ranking_open','ranking_locked','shortlisting','shortlist_locked','interviewing','company_ranking','company_locked','matched','revealed')), ranking_opens_at timestamptz, ranking_locks_at timestamptz, shortlist_locks_at timestamptz, company_locks_at timestamptz, reveal_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS notifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, round_id uuid REFERENCES rounds(id) ON DELETE CASCADE, type notification_type NOT NULL, message text NOT NULL, read boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id,created_at DESC);
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY; ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS round_id uuid REFERENCES rounds(id) ON DELETE CASCADE;
