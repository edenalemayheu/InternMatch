<div align="center">

<img src="./intern-match-logoo.png" alt="InternMatch logo" width="260"/>

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Status](https://img.shields.io/badge/status-in%20development-orange)](#roadmap)
[![Made with React](https://img.shields.io/badge/frontend-React-61DAFB?logo=react&logoColor=white)](#tech-stack)
[![Node.js](https://img.shields.io/badge/backend-Node.js-339933?logo=node.js&logoColor=white)](#tech-stack)
[![Supabase](https://img.shields.io/badge/database-Supabase%20(Postgres)-3ECF8E?logo=supabase&logoColor=white)](#tech-stack)

### Ranked preferences. Fair outcomes.

InternMatch is a two-sided, preference-based internship matching platform — students rank the companies they want, companies rank the students they want, and a fair matching algorithm finds the best mutual fit for both sides.

</div>

---

## Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [How It Works](#how-it-works)
- [Round Timeline](#round-timeline)
- [Interview & Contact Flow](#interview--contact-flow)
- [Unmatched Students](#unmatched-students)
- [Admin & Round Control](#admin--round-control)
- [Landing Page & Auth](#landing-page--auth)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Roadmap](#roadmap)
- [Author](#author)
- [License](#license)

## Overview

Most internship placement today is a one-way street: a student applies, and waits. There's no visibility into fit, no way to signal genuine mutual interest, and no guarantee the outcome reflects what either side actually wants.

**InternMatch flips that model.** Both students and companies submit ranked preferences, and a matching algorithm — inspired by the same class of stable-matching systems used in national medical residency placement (Gale–Shapley) — pairs them based on mutual interest rather than who applied first or who has the single highest GPA.

## The Problem

- Students send out applications with no sense of where they realistically stand.
- Companies evaluate candidates in isolation, blind to competing interest elsewhere.
- Popular companies get flooded with applicants; others struggle to reach qualified students.
- The process rewards speed and single metrics over genuine, holistic fit.

InternMatch replaces "applying" with **ranking**, and replaces manual review queues with a **transparent, automated match**.

## How It Works

Each matching round runs in six steps:

1. **Profile, once** — a student's department, year, skills, projects, certificates, and portfolio are set up once and reused every round.
2. **Filtered browsing** — students see postings relevant to their department and skills by default, with the option to view the full list.
3. **Ranking is the application** — instead of applying company-by-company, a student submits one ordered list of postings. That list *is* the application.
4. **Profile review & shortlisting** — companies review their full applicant pool's profiles (skills, projects, portfolio) at their own pace and narrow down to a shortlist. This is a review-only step — no interviews yet.
5. **Interviews** — companies interview (or portfolio review, take-home task, whatever they choose) only their shortlisted candidates. Nothing about this step is automated or scored by a formula.
6. **Company ranking & matching** — after interviews, companies submit their final ranking (or a 1–10 score per candidate) for everyone they interviewed. Once the round closes, both sides' rankings are locked and the matching algorithm runs.

### The matching algorithm

For every student–company pair with mutual interest, InternMatch computes a **mutual interest score**:

```
score = 1 / (student's rank of company) + 1 / (company's rank of student)
```

All pairs are sorted by score, highest first. The algorithm walks the sorted list once: if both sides are still free, they're matched; if either is already taken, it moves on. One sort, one pass — no iterative propose-and-reject loop — while still producing an outcome that reflects genuine mutual preference on both sides.

## Round Timeline

Built around a **June 1st "Match Day"** reveal, so students start matched internships right as summer break begins.

| Phase | Dates | What happens |
|---|---|---|
| Round opens | Feb 1 | Companies post openings; students create/update profiles |
| Browsing + ranking window | Feb 1 – Feb 28 | Students browse filtered postings and build their ranked list |
| Student rankings lock | Mar 1 | Ranked lists freeze; companies see their full applicant pool |
| Profile review & shortlisting | Mar 1 – Mar 20 | Companies review applicant profiles and narrow to a shortlist (async, no scheduling needed) |
| Shortlist finalized | Mar 20 | Companies lock their shortlist; shortlisted students are notified |
| Interviews | Mar 21 – May 10 | Companies interview only shortlisted candidates |
| Company rankings lock | May 15 | Final ranking/scores submitted and frozen |
| Algorithm runs (buffer) | May 20 – May 25 | Admin runs the match, checks for edge cases |
| **Match Day (reveal)** | **June 1** | Results revealed to everyone simultaneously |
| Internship period | June – Aug/Sept | Matched students begin their internship |

The shortlisting step is deliberately separated from interviewing: shortlisting is a low-effort, async review phase, while interviewing is the higher-effort, scheduling-heavy phase — companies should only be spending interview time on candidates who survived the cut.

> **Note:** these phase dates are targets for the real production calendar. In the current build, phase transitions are triggered manually by an admin (see [Admin & Round Control](#admin--round-control)), not by comparing against today's date.

## Interview & Contact Flow

Once a company finalizes its shortlist:

- The shortlisted student receives a notification (in-app + email): *"You've been shortlisted by [Company] for [Posting]. They'll be in touch to schedule an interview."*
- The student's **contact email is revealed to that company only**, and only after shortlisting — never before. This keeps outreach tied to the ranking system rather than allowing back-channel contact.
- From there, the company reaches out and coordinates the interview directly (email, phone, calendar tool of their choice). InternMatch does not manage scheduling.

This mirrors how platforms like LinkedIn/Handshake work: the platform's job is to unlock the *right* contact at the *right* time, not to run a scheduling system.

*(Future v2 idea: lightweight in-app messaging between shortlisted students and company admins, so coordination stays on-platform. Not part of the current build.)*

## Unmatched Students

There is no waitlist in the current build. A student or posting that doesn't get matched in a round simply becomes eligible again when the **next round** opens.

*(Future v2 idea: a short compressed "Gap Round" immediately after Match Day for unmatched students/companies with remaining capacity, so no one loses an entire summer. Not part of the current build — ship the single annual round first.)*

## Admin & Round Control

The admin role exists so rounds can be tested, demoed, and (eventually) run in production without being locked to hardcoded calendar dates.

- **Admin is a normal account** with an `is_admin` flag — there is no separate signup path or public "admin" entry point. An admin logs in through the same login form as everyone else and is redirected to `/admin` instead of a student/company dashboard.
- **Phase is a stored field, not a date comparison.** The `rounds` table has a `phase` column (`ranking_open → ranking_locked → shortlisting → shortlist_locked → interviewing → company_ranking → company_locked → matched → revealed`) plus the target dates above for reference. Phase transitions are currently admin-triggered only.
- **Admin dashboard capabilities:**
  - View every student profile and company posting, regardless of current phase
  - View all student rankings and all company rankings/scores directly, even before they'd normally lock for other users
  - **Force advance to next phase** — manually move the round forward
  - **Run matching algorithm now** — execute the matching engine on demand and see matched pairs, unmatched students, and unmatched postings
  - **Reset round** — wipe rankings/shortlists/matches back to a clean state for repeated testing
- **Path to production:** the admin "Run matching algorithm now" button and a future scheduled job (e.g. a Vercel Cron function checking phase + `reveal_at` daily) both call the same underlying `runMatching()` function — one triggered by a person, one by a schedule. Only the manual/admin path is built currently.

## Landing Page & Auth

- **Landing page:** hero with tagline + two direct CTAs — **"I'm a Student"** and **"I'm a Company"** — routing straight into role-specific signup (role is set by entry point, not a form field). Below the fold: problem/solution summary, the 5-step "How It Works" stepper, and an optional live round-status banner (e.g. "Spring 2026 round: Ranking closes March 1").
- **Auth:** Supabase Auth, email + password. Google OAuth optional.
- **Onboarding (post-auth, pre-dashboard):**
  - Student: name, department, year, skills, portfolio URL, availability
  - Company: company name, industry, contact person
- **Routing:** `/` → `/signup?role=student|company` → `/onboarding` → `/dashboard`. Routes are protected by session + role checks (server-side, not just client redirect).
- Admin login is not advertised anywhere on the public landing page — it's the same login form, gated by the `is_admin` flag.

## Features

- **Student profiles** — department, year, skills, projects, certificates, portfolio, availability
- **Smart posting filters** — relevant postings surfaced automatically, with a toggle to browse everything
- **Preference-based applications** — one ranked list per round replaces per-company applications and cover letters
- **Shortlisting & interview workflow** — companies narrow their applicant pool to a shortlist, then interview, before submitting a final ranking
- **Holistic company review** — companies rank or score candidates however they choose (skills, projects, interviews, GPA — their call)
- **Score-based greedy matching** — a fast, explainable algorithm that favors genuine mutual fit
- **Locked rounds** — rankings freeze at each phase boundary so matching runs against a stable snapshot
- **Admin control panel** — manual phase control, on-demand matching, round reset, full data visibility for testing/demo

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (JavaScript) |
| Backend | Node.js + Express (REST API) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Hosting | Vercel |
| Matching Engine | Custom score-based greedy matching algorithm |

## Database Schema

```
students          (id, department, year, skills[], portfolio_url, availability, contact_email, ...)
postings          (id, company_id, required_department, required_skills[], capacity)
student_rankings  (student_id, round_id, ordered_posting_ids[])           -- this row IS "the application"
company_rankings  (posting_id, round_id, ordered_student_ids[] or scores)
shortlists        (posting_id, student_id, round_id, shortlist_status)    -- pending | shortlisted | rejected
rounds            (id, phase, ranking_opens_at, ranking_locks_at, shortlist_locks_at,
                    company_locks_at, reveal_at)
users             (id, role, is_admin, ...)
```

## Getting Started

```bash
git clone https://github.com/edenalemayheu/InternMatch.git
cd InternMatch
npm install
npm run dev
```

## Roadmap

- [ ] Student profile creation & editing
- [ ] Posting creation & department/skill filtering
- [ ] Ranking submission UI (student side)
- [ ] Shortlisting workflow (company side, profile-review only)
- [ ] Contact-reveal + notification on shortlist
- [ ] Scoring/ranking UI (company side, post-interview)
- [ ] Score-based greedy matching engine
- [ ] Match results & reveal screen
- [ ] Admin dashboard (phase control, run-matching, reset, full data view)
- [ ] Seed data script for demo/testing
- [ ] Landing page + role-based signup/onboarding

## Author

**Eden Alemayehu**
Individual project — designed, built, and maintained solo.

[GitHub](https://github.com/edenalemayheu)

## License

Distributed under the MIT License. See [LICENSE](./LICENSE) for details.

<div align="center">

**INTERNMATCH**
*Fair Chances. Real Fit.*

</div>