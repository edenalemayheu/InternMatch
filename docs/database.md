# Database Schema

Database: Supabase (PostgreSQL). All tables use `uuid` primary keys (`gen_random_uuid()`) unless noted. All tables include `created_at TIMESTAMPTZ DEFAULT now()` unless noted otherwise.

## Entity Overview

```
users ──< students
users ──< companies ──< postings ──< shortlists >── students
                                  └─< company_rankings
students ──< student_rankings
rounds ──< postings, student_rankings, company_rankings, shortlists, matches
matches >── students, postings
users ──< notifications
```

## Tables

### `users`
Mirrors/extends Supabase Auth users with app-specific role data.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | matches Supabase `auth.users.id` |
| email | text | |
| role | enum('student','company') | set at signup, not editable by user |
| is_admin | boolean | default `false`; set manually, never via public API |
| created_at | timestamptz | |

### `students`

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK → users.id | unique |
| full_name | text | |
| department | text | |
| year | text | e.g. "3rd year", "Senior" |
| skills | text[] | tag list |
| portfolio_url | text | nullable |
| availability | text | free text or enum, e.g. "Full-time summer" |
| contact_email | text | **never returned via API unless shortlisted (see `database.md` §Access Rules)** |
| created_at | timestamptz | |

### `companies`

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK → users.id | unique |
| company_name | text | |
| industry | text | |
| contact_person | text | |
| logo_url | text | nullable |
| created_at | timestamptz | |

### `rounds`

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| label | text | e.g. "Spring 2026" |
| phase | enum | see sequence below |
| ranking_opens_at | timestamptz | target date, reference only |
| ranking_locks_at | timestamptz | target date, reference only |
| shortlist_locks_at | timestamptz | target date, reference only |
| company_locks_at | timestamptz | target date, reference only |
| reveal_at | timestamptz | target date, reference only |
| created_at | timestamptz | |

`phase` enum sequence (fixed order, admin-advanced):
```
ranking_open → ranking_locked → shortlisting → shortlist_locked
→ interviewing → company_ranking → company_locked → matched → revealed
```

### `postings`

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| company_id | uuid, FK → companies.id | |
| round_id | uuid, FK → rounds.id | |
| title | text | |
| required_department | text | |
| required_skills | text[] | |
| capacity | integer | default `1`; number of students this posting can match |
| created_at | timestamptz | |

### `student_rankings`

One row per student per round — this row **is** the student's application.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| student_id | uuid, FK → students.id | |
| round_id | uuid, FK → rounds.id | |
| ordered_posting_ids | uuid[] | ordered, index 0 = top choice |
| locked_at | timestamptz | nullable; set when round phase passes `ranking_open` |

Unique constraint: `(student_id, round_id)`.

### `shortlists`

One row per (posting, student) pair per round.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| posting_id | uuid, FK → postings.id | |
| student_id | uuid, FK → students.id | |
| round_id | uuid, FK → rounds.id | |
| shortlist_status | enum('pending','shortlisted','rejected') | default `'pending'` |
| updated_at | timestamptz | |

Unique constraint: `(posting_id, student_id, round_id)`.

### `company_rankings`

One row per posting per round.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| posting_id | uuid, FK → postings.id | |
| round_id | uuid, FK → rounds.id | |
| ordered_student_ids | uuid[] | nullable — use this OR `scores` |
| scores | jsonb | nullable — shape `{ student_id: number (1-10) }` |
| locked_at | timestamptz | nullable |

Unique constraint: `(posting_id, round_id)`.

### `matches`

Output of the matching algorithm for a round.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| round_id | uuid, FK → rounds.id | |
| student_id | uuid, FK → students.id | |
| posting_id | uuid, FK → postings.id | |
| mutual_score | numeric | the computed score at match time |
| created_at | timestamptz | |

### `notifications`

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK → users.id | |
| type | enum('shortlisted','matched','not_matched') | |
| message | text | |
| read | boolean | default `false` |
| created_at | timestamptz | |

## Access Rules (enforced server-side, not just hidden in UI)

- `students.contact_email` is only included in an API response to a company when there exists a `shortlists` row for `(posting_id belonging to that company, student_id)` with `shortlist_status = 'shortlisted'` **and** `rounds.phase` is `shortlist_locked` or later.
- `student_rankings` for a given student cannot be inserted/updated once `rounds.phase` is past `ranking_open`.
- `shortlists.shortlist_status` cannot be changed once `rounds.phase` is past `shortlisting`.
- `company_rankings` cannot be inserted/updated once `rounds.phase` is past `company_ranking`.
- `matches` are only readable by non-admin users once `rounds.phase = 'revealed'`.
- All `/admin/*` reads bypass the above phase restrictions entirely.

## Indexes (recommended)

```sql
CREATE INDEX idx_student_rankings_round ON student_rankings(round_id);
CREATE INDEX idx_company_rankings_round ON company_rankings(round_id);
CREATE INDEX idx_shortlists_posting ON shortlists(posting_id);
CREATE INDEX idx_shortlists_student ON shortlists(student_id);
CREATE INDEX idx_matches_round ON matches(round_id);
CREATE INDEX idx_postings_round ON postings(round_id);
```
