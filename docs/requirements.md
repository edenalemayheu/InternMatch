# Requirements

## 1. Functional Requirements

### 1.1 Authentication & Accounts
- FR-1: Users can sign up as either a Student or a Company via role-specific entry points.
- FR-2: Users authenticate via email + password (Supabase Auth). Google OAuth is optional.
- FR-3: Admin accounts are provisioned manually (`is_admin = true` set directly in the database or via a one-time seed script) — there is no public admin signup path.
- FR-4: On login, users are routed based on role: Student → Student Dashboard, Company → Company Dashboard, Admin → Admin Panel.
- FR-5: A user who has not completed onboarding (no `students`/`companies` row yet) is redirected to `/onboarding` before reaching any dashboard.

### 1.2 Student Profile & Browsing
- FR-6: A student completes a profile once (department, year, skills, portfolio URL, availability); it is reused every round.
- FR-7: Students see postings filtered by their department/skills by default, with a toggle to view all postings.
- FR-8: A student submits one ordered list of postings (`ordered_posting_ids[]`) as their single "application" for the round.
- FR-9: A student cannot submit or edit their ranked list once the round phase has moved past `ranking_open`.

### 1.3 Company Postings, Shortlisting, Interviews
- FR-10: A company can create, edit, and view its own postings (title, required department, required skills, capacity).
- FR-11: Once round phase reaches `ranking_locked`, a company can view the full list of students who ranked each of its postings, along with their profiles.
- FR-12: A company can mark each applicant as `pending`, `shortlisted`, or `rejected`. Shortlist edits are only allowed during `ranking_locked` and `shortlisting` phases.
- FR-13: When a student is marked `shortlisted`, the student is notified and the student's contact email becomes visible to that company only.
- FR-14: A company can submit a final ranking or 1–10 score per shortlisted candidate only, during `interviewing` and `company_ranking` phases.

### 1.4 Matching
- FR-15: The matching algorithm computes a mutual-interest score for every student–posting pair present in both a student's ranked list and a company's ranked/scored list: `score = 1/(student's rank of posting) + 1/(company's rank of student)`.
- FR-16: All mutually-interested pairs are sorted by score descending and matched in a single greedy pass, respecting posting capacity.
- FR-17: Match results are only visible to students/companies once round phase = `revealed`.
- FR-18: A student or posting not matched in a round becomes eligible again automatically when the next round opens; there is no waitlist.

### 1.5 Admin
- FR-19: Admin can view all student profiles, company postings, rankings, and shortlist statuses regardless of current round phase.
- FR-20: Admin can manually advance the round's phase, run the matching algorithm on demand, and reset a round's data back to a clean state.
- FR-21: Admin actions are gated server-side by an `is_admin` check, not only hidden in the UI.

### 1.6 Notifications
- FR-22: Users receive an in-app (and email) notification when shortlisted, and when match results are revealed.

## 2. Non-Functional Requirements

- NFR-1 (Security): Contact information (student email) must never be returned by any API response unless the requesting company has a `shortlisted` status for that student, enforced server-side.
- NFR-2 (Auditability): All round-phase transitions and matching runs are logged with a timestamp and triggering admin user, so the round's history can be reconstructed for debugging or demo narration.
- NFR-3 (Explainability): The matching algorithm must be a simple, explainable single-pass greedy algorithm — not an opaque black box — since a graduation-project demo requires walking through the scoring math for specific pairs live.
- NFR-4 (Testability): Any round must be fully resettable via a single admin action, so the same round can be demoed or tested repeatedly without needing a fresh database.
- NFR-5 (Consistency): All UI must draw colors, type, and spacing from the design tokens defined in `ui-foundation-spec.md` — no inline one-off styling choices.
- NFR-6 (Deployability): The application must run on Vercel (frontend + serverless API) with Supabase as the only external data dependency, requiring no additional infrastructure.
- NFR-7 (Accessibility): All interactive elements (buttons, form inputs, toggles) must have visible focus states and sufficient color contrast (WCAG AA, 4.5:1 minimum for body text) per the design system.
- NFR-8 (Responsiveness): All pages must be usable on both desktop and mobile viewports (down to 375px width).

## 3. Out of Scope (current build)

- In-app messaging between students and companies (interview coordination happens via revealed email, off-platform).
- A "Gap Round" / waitlist system for unmatched students.
- Automatic (scheduled/cron-based) phase advancement — phase changes are admin-triggered only in this build.
- Payment, billing, or any monetization feature.
