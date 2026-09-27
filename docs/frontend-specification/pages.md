# Frontend Page Specification

All visual detail (colors, spacing, type, component states) referenced below comes from [`ui-foundation-spec.md`](../ui-foundation-spec.md) — this document specifies structure and behavior per page, not visual styling in isolation.

## Route Table

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Landing page |
| `/signup?role=student` | Public | Student signup |
| `/signup?role=company` | Public | Company signup |
| `/login` | Public | Shared login (student, company, admin) |
| `/onboarding` | Auth'd, no profile yet | Role-specific profile setup |
| `/dashboard` | Student or Company | Role-based home |
| `/postings` | Student | Browse postings |
| `/rank` | Student | Build/edit ranked list |
| `/company/postings` | Company | Manage postings |
| `/company/applicants/:postingId` | Company | Review + shortlist applicants |
| `/company/interviews/:postingId` | Company | Interview notes + final ranking |
| `/reveal` | Student or Company | Match result |
| `/admin` | Admin only | Round control panel |

All routes other than `/`, `/signup`, `/login` must verify session + role **server-side** on the corresponding API calls, not only via client-side redirect.

---

## `/` — Landing Page

Single scroll, in this order:

1. **Hero** — logo, tagline "Ranked preferences. Fair outcomes." (`--text-4xl`, `--color-neutral-900`), one-line explainer (`--text-lg`, `--color-neutral-600`), two primary CTA buttons: **"I'm a Student"** → `/signup?role=student`, **"I'm a Company"** → `/signup?role=company`.
2. **Problem → Solution** — 3–4 bullet contrast pulled from root README's "The Problem" section, in a two-column layout on desktop (problem left, solution right), stacked on mobile.
3. **How It Works** — horizontal phase stepper component (§6.5 of design system) showing: Profile → Browse → Rank → Shortlist/Interview → Match.
4. **Round status banner** (optional, info-variant banner, §6.6) — fetched from `GET /api/rounds/current`, e.g. "Spring 2026 round: Ranking closes March 1."
5. **Footer** — About/author, GitHub link, license, plain text, `--color-neutral-600`.

No role-selection dropdown on a generic "Sign Up" — the two hero CTAs route directly into role-specific signup.

## `/signup` and `/login`

- Centered card (max-width 420px), white background, `--radius-lg`, `--shadow-md`.
- Signup: email, password, confirm password. Role is pre-set from the `?role=` query param and shown as a read-only badge at the top of the form (e.g. "Signing up as: Student"), not as an editable field.
- Login: email, password. After successful login: check `is_admin` first → `/admin`; else check `hasProfile` → `/onboarding` if false, else `/dashboard`.
- No admin-specific link or hint anywhere on these pages.

## `/onboarding`

- Same centered-card layout as signup.
- **Student fields:** full name, department (dropdown), year (dropdown), skills (tag input, multi-select), portfolio URL (optional), availability (dropdown or short text). ~6 fields max.
- **Company fields:** company name, industry (dropdown), contact person, logo (optional upload). ~4 fields max.
- Submit button uses primary button style; on success, redirect to `/dashboard`.

## `/dashboard` (Student)

- Top: current round phase stepper + a one-line status message ("Ranking is open until Feb 28" / "Interviews in progress" / etc.).
- Primary action card: link to `/postings` (if `ranking_open`) or `/rank` (if list already started).
- Notifications list (shortlist/reveal notifications) in a side panel or below the fold.
- If phase is `revealed`: show a prominent match-result summary card, linking to `/reveal`.

## `/dashboard` (Company)

- Top: current round phase stepper.
- Summary cards: number of postings, number of applicants across postings, number shortlisted.
- Quick links to `/company/postings` and, per posting, `/company/applicants/:postingId`.
- If phase is `revealed`: show matched students per posting.

## `/postings` (Student)

- Grid or list of posting cards (§6.3): company name, role title, required skills as badges, capacity.
- Filter toggle at top: "Relevant to you" (default, on) / "Show all."
- Each card has an "Add to ranking" action, linking into `/rank`.
- Locked state: if `round.phase != 'ranking_open'`, show a banner explaining ranking is closed, cards become view-only (no "Add to ranking" action).

## `/rank` (Student)

- Ordered list UI: drag-to-reorder (or up/down controls for accessibility) over postings the student has added.
- Top-of-list postings visually marked "#1 choice," etc.
- Submit button: primary, "Submit Ranking." Disabled + tooltip if `round.phase != 'ranking_open'`.
- Show current phase and days-remaining-until-lock prominently at the top.

## `/company/postings`

- Table or card list of the company's postings with edit/delete actions.
- "Create posting" primary button opens a form (title, required department, required skills, capacity).
- Each posting row links to `/company/applicants/:postingId`.

## `/company/applicants/:postingId`

- Table of students who ranked this posting, sorted by the student's rank of this posting (best signal first).
- Each row: student name, department, skills badges, a "View profile" expand/link, and a shortlist status control (segmented control or dropdown: Pending / Shortlisted / Rejected — colors per §1.5).
- Available only once `round.phase >= 'ranking_locked'`; before that, show an empty state explaining rankings haven't locked yet.
- Once `round.phase >= 'shortlist_locked'`, this view becomes read-only (status controls disabled) and shortlisted students show their revealed contact email inline.

## `/company/interviews/:postingId`

- Shows only students with `shortlist_status = 'shortlisted'` for this posting.
- Per student: free-text interview notes field, and a final rank/score input (numeric 1–10, or drag-to-reorder across all shortlisted students for this posting).
- "Submit Final Ranking" primary button. Available only during `interviewing`/`company_ranking` phases.

## `/reveal`

- Student: large match-result card (§6.3, accent-colored per §6.6 success variant) showing matched company + posting, or a neutral (not error-styled) "not matched this round — you're automatically eligible next round" message.
- Company: list of matched students per posting, same card style.
- Fetches from `GET /api/matches/me`; if phase isn't `revealed` yet, this route redirects back to `/dashboard`.

## `/admin`

- Top: phase stepper (§6.5) spanning the full 9-phase sequence, current phase highlighted.
- Action row: "Force advance to next phase" (primary), "Run matching algorithm now" (primary), "Reset round" (destructive, §6.1, with confirmation dialog).
- On "Run matching algorithm now": show results inline — three sections (Matched pairs / Unmatched students / Unmatched postings), each as a simple data table, including the computed `mutual_score` per match.
- Read-only data panel (tabbed): All Student Rankings / All Company Rankings / All Shortlists — plain tables, no styling flourishes, functional only.
- No date-based logic on this page — every action is a direct button triggering the corresponding admin API call.
