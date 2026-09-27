# Folder Structure

```
InternMatch/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/                  # logo, static images
│   │   ├── components/
│   │   │   ├── ui/                  # Button, Input, Card, Badge, Stepper, Banner (design-system primitives)
│   │   │   ├── student/             # PostingCard, RankingList, StudentDashboard widgets
│   │   │   ├── company/             # PostingForm, ApplicantRow, ShortlistToggle, InterviewNotes
│   │   │   └── admin/               # PhaseStepper, RunMatchingPanel, ResetRoundDialog, DataTable
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Onboarding.jsx
│   │   │   ├── student/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Postings.jsx
│   │   │   │   └── Rank.jsx
│   │   │   ├── company/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Postings.jsx
│   │   │   │   ├── Applicants.jsx
│   │   │   │   └── Interviews.jsx
│   │   │   ├── Reveal.jsx
│   │   │   └── admin/
│   │   │       └── AdminPanel.jsx
│   │   ├── hooks/                   # useAuth, useRound, useNotifications
│   │   ├── lib/                     # supabaseClient.js, apiClient.js
│   │   ├── styles/                  # tokens.css (design tokens from ui-foundation-spec.md), globals.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js               # or equivalent bundler config
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── students.routes.js
│   │   │   ├── companies.routes.js
│   │   │   ├── postings.routes.js
│   │   │   ├── rankings.routes.js
│   │   │   ├── shortlists.routes.js
│   │   │   ├── companyRankings.routes.js
│   │   │   ├── matches.routes.js
│   │   │   ├── notifications.routes.js
│   │   │   └── admin.routes.js
│   │   ├── middleware/
│   │   │   ├── requireAuth.js
│   │   │   ├── requireRole.js
│   │   │   └── requireAdmin.js
│   │   ├── services/
│   │   │   ├── matchingEngine.js     # runMatching() — single source of truth
│   │   │   ├── phaseTransitions.js   # advancePhase() side effects
│   │   │   ├── notificationService.js
│   │   │   └── contactRevealService.js
│   │   ├── db/
│   │   │   ├── supabaseClient.js
│   │   │   └── queries/              # one file per table, thin query helpers
│   │   ├── scripts/
│   │   │   └── seed.js               # demo data generator
│   │   └── app.js
│   ├── package.json
│   └── vercel.json                   # serverless function config
│
├── docs/                             # this documentation suite
│   ├── README.md
│   ├── requirements.md
│   ├── usecase.md
│   ├── database.md
│   ├── ui-foundation-spec.md
│   ├── folder-structure.md
│   ├── api/
│   │   └── endpoints.md
│   ├── frontend-specification/
│   │   └── pages.md
│   └── function-level-specification/
│       ├── matching-algorithm.md
│       └── admin-and-auth.md
│
├── README.md
├── LICENSE
└── .gitignore
```

## Conventions

- One component per file; component filenames in `PascalCase.jsx`.
- One route file per resource in `backend/src/routes/`; keep route handlers thin, push logic into `services/`.
- `matchingEngine.js` exports a single `runMatching(roundId)` function — this is the only place the matching algorithm is implemented, called by both the admin route and (in a future version) a scheduled job. Never duplicate this logic elsewhere.
- Design tokens (colors, spacing, type scale from `ui-foundation-spec.md`) live in `frontend/src/styles/tokens.css` as CSS custom properties, imported once in `globals.css`. Components reference tokens (e.g. `var(--color-primary-600)`), never hardcoded hex values.
