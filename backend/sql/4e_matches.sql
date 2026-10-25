-- Persisted matching results and run audit summary.
CREATE TABLE IF NOT EXISTS matches (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), round_id uuid NOT NULL REFERENCES rounds(id) ON DELETE CASCADE, student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE, posting_id uuid NOT NULL REFERENCES postings(id) ON DELETE CASCADE, mutual_score numeric NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(round_id,student_id));
CREATE TABLE IF NOT EXISTS match_runs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), round_id uuid NOT NULL UNIQUE REFERENCES rounds(id) ON DELETE CASCADE, ran_at timestamptz NOT NULL DEFAULT now(), matched_count integer NOT NULL DEFAULT 0, unmatched_student_count integer NOT NULL DEFAULT 0, unmatched_posting_count integer NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS idx_matches_round ON matches(round_id);
ALTER TABLE matches ENABLE ROW LEVEL SECURITY; ALTER TABLE match_runs ENABLE ROW LEVEL SECURITY;
