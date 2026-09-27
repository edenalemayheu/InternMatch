# UI Foundation Spec (Design System)

This document is the single source of truth for visual design. Every component, page, and piece of UI in InternMatch must draw from the tokens defined here — no inline, one-off color or spacing choices in component code.

**Design direction:** Professional, trustworthy, calm — this is a matching platform people rely on for a real outcome (an internship), so it should feel closer to a banking/institutional product than a flashy consumer app. Confidence and clarity over decoration.

---

## 1. Color Palette

### 1.1 Brand / Primary

| Token | Hex | Usage |
|---|---|---|
| `--color-primary-50` | `#EEF2FF` | subtle backgrounds, hover tints |
| `--color-primary-100` | `#E0E7FF` | selected/active light backgrounds |
| `--color-primary-300` | `#A5B4FC` | disabled primary elements, light borders |
| `--color-primary-500` | `#6366F1` | secondary buttons, links, icons |
| `--color-primary-600` | `#4F46E5` | **primary brand color** — primary buttons, active nav, key CTAs |
| `--color-primary-700` | `#4338CA` | primary button hover/pressed state |
| `--color-primary-900` | `#312E81` | dark text-on-light-primary contexts |

### 1.2 Accent (Match / Success)

Used specifically for match-related moments (shortlist confirmation, Match Day reveal) — kept distinct from primary so a "you've been matched" moment visually stands out.

| Token | Hex | Usage |
|---|---|---|
| `--color-accent-50` | `#ECFDF5` | success banners, match-card backgrounds |
| `--color-accent-500` | `#10B981` | success icons, "matched" badges |
| `--color-accent-600` | `#059669` | success button / confirm actions |

### 1.3 Neutrals (Slate scale)

| Token | Hex | Usage |
|---|---|---|
| `--color-neutral-0` | `#FFFFFF` | page background (light mode), card backgrounds |
| `--color-neutral-50` | `#F8FAFC` | app background (light mode) |
| `--color-neutral-100` | `#F1F5F9` | subtle dividers, disabled backgrounds |
| `--color-neutral-200` | `#E2E8F0` | borders, input borders |
| `--color-neutral-400` | `#94A3B8` | placeholder text, disabled text |
| `--color-neutral-600` | `#475569` | secondary body text |
| `--color-neutral-800` | `#1E293B` | primary body text |
| `--color-neutral-900` | `#0F172A` | headings, highest-emphasis text |

### 1.4 Semantic / Status

| Token | Hex | Usage |
|---|---|---|
| `--color-warning-50` | `#FFFBEB` | warning banner background |
| `--color-warning-500` | `#F59E0B` | pending/warning badges, "phase closing soon" |
| `--color-error-50` | `#FEF2F2` | error banner background |
| `--color-error-500` | `#EF4444` | error text, destructive button (e.g. "Reset Round") |
| `--color-error-600` | `#DC2626` | destructive button hover |
| `--color-info-500` | `#3B82F6` | informational badges/banners |

### 1.5 Status Badge Colors (shortlist / match states)

| Status | Background | Text |
|---|---|---|
| `pending` | `--color-neutral-100` | `--color-neutral-600` |
| `shortlisted` | `--color-primary-100` | `--color-primary-700` |
| `rejected` | `--color-error-50` | `--color-error-500` |
| `matched` | `--color-accent-50` | `--color-accent-600` |
| `not matched` | `--color-neutral-100` | `--color-neutral-600` |

### 1.6 Dark Mode

Dark mode is optional for this build, but if implemented: invert the neutral scale (`--color-neutral-900` becomes the background, `--color-neutral-50` becomes text), keep `--color-primary-500` as the primary interactive color (rather than 600, for sufficient contrast on dark backgrounds), and keep accent/semantic hues unchanged.

---

## 2. Typography

**Typeface:** [Inter](https://fonts.google.com/specimen/Inter) for everything — UI text and headings. One typeface keeps the product feeling calm and consistent rather than decorative. Fall back stack: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`.

### 2.1 Type Scale

| Token | Size / Line height | Weight | Usage |
|---|---|---|---|
| `--text-xs` | 12px / 16px | 500 | badges, timestamps, helper text |
| `--text-sm` | 14px / 20px | 400 | secondary body text, form labels |
| `--text-base` | 16px / 24px | 400 | default body text |
| `--text-lg` | 18px / 28px | 500 | card titles, emphasized body |
| `--text-xl` | 20px / 28px | 600 | section headings |
| `--text-2xl` | 24px / 32px | 600 | page titles |
| `--text-3xl` | 30px / 38px | 700 | landing page hero sub-heading |
| `--text-4xl` | 36px / 44px | 700 | landing page hero headline |

- Headings use `--color-neutral-900`.
- Body text uses `--color-neutral-800`; secondary/muted text uses `--color-neutral-600`.
- Links use `--color-primary-600`, underline on hover.

---

## 3. Spacing System

4px base unit, following an 8px rhythm for most layout spacing:

| Token | Value |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |

Use `--space-4`/`--space-6` for internal card/component padding, `--space-8`/`--space-12` for section-level spacing on pages.

---

## 4. Radius & Elevation

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 6px | badges, small buttons |
| `--radius-md` | 8px | inputs, standard buttons |
| `--radius-lg` | 12px | cards, modals |
| `--radius-full` | 9999px | avatar, pill badges |

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(15, 23, 42, 0.05)` | resting cards |
| `--shadow-md` | `0 4px 6px -1px rgba(15, 23, 42, 0.1)` | dropdowns, popovers |
| `--shadow-lg` | `0 10px 15px -3px rgba(15, 23, 42, 0.1)` | modals |

---

## 5. Breakpoints

| Token | Value | Target |
|---|---|---|
| `--bp-sm` | 375px | small mobile |
| `--bp-md` | 768px | tablet |
| `--bp-lg` | 1024px | small desktop |
| `--bp-xl` | 1280px | desktop |

Layouts should be single-column below `--bp-md`, and can use two-column/sidebar layouts at `--bp-lg` and above.

---

## 6. Core Components

### 6.1 Buttons

| Variant | Background | Text | Border | Usage |
|---|---|---|---|---|
| Primary | `--color-primary-600` | white | none | main CTAs ("Submit Ranking", "Run Matching Algorithm") |
| Primary (hover) | `--color-primary-700` | white | none | |
| Secondary | white | `--color-primary-600` | 1px `--color-primary-300` | secondary actions |
| Destructive | `--color-error-500` | white | none | "Reset Round" |
| Destructive (hover) | `--color-error-600` | white | none | |
| Disabled | `--color-neutral-100` | `--color-neutral-400` | none | locked/phase-restricted actions |

- Height: 40px (default), 32px (compact/inline), `--radius-md`, `--space-4` horizontal padding, `--text-sm` weight 600.
- Always show a visible focus ring (`2px solid --color-primary-500`, `2px offset`) for keyboard accessibility.

### 6.2 Inputs

- Height 40px, `--radius-md`, border `1px solid --color-neutral-200`, `--text-base`.
- Focus state: border `--color-primary-500`, subtle `0 0 0 3px --color-primary-100` ring.
- Error state: border `--color-error-500`, helper text below in `--color-error-500` at `--text-xs`.
- Placeholder text: `--color-neutral-400`.

### 6.3 Cards

- Background `--color-neutral-0`, border `1px solid --color-neutral-200`, `--radius-lg`, `--shadow-sm`, padding `--space-6`.
- Used for: posting cards, applicant rows, match result cards.

### 6.4 Badges

- `--radius-full`, `--text-xs` weight 600, padding `4px 10px`, colors per §1.5 status table.

### 6.5 Phase / Progress Stepper

Used on the admin panel and on any student/company page showing round phase.

- Horizontal row of steps (labels: Ranking Open, Ranking Locked, Shortlisting, Shortlist Locked, Interviewing, Company Ranking, Company Locked, Matched, Revealed).
- Completed steps: filled circle `--color-primary-600`, connecting line `--color-primary-600`.
- Current step: circle with `--color-primary-600` border, white fill, bold label.
- Upcoming steps: circle `--color-neutral-200`, label `--color-neutral-400`.

### 6.6 Notification / Banner

- Info: background `--color-primary-50`, left border `4px solid --color-primary-500`, text `--color-neutral-800`.
- Success (e.g. Match Day): background `--color-accent-50`, left border `--color-accent-500`.
- Warning: background `--color-warning-50`, left border `--color-warning-500`.
- Error: background `--color-error-50`, left border `--color-error-500`.
- Padding `--space-4`, `--radius-md`.

---

## 7. Iconography

Use a single consistent icon set — [Lucide](https://lucide.dev) (open-source, matches a clean/professional aesthetic, easy to import in React). Icon stroke width 1.5–2px, default size 20px inline with text, 24px standalone.

---

## 8. Tone & Voice (for UI copy)

- Direct and reassuring, not gimmicky. "You've been shortlisted by Acme Corp" rather than "🎉 Great news!!"
- Never imply a guarantee — always leave room for "not matched this round" to read as neutral, not as failure. E.g. "You weren't matched this round — you're automatically eligible for the next round" rather than anything that reads as rejection.
- Admin/system copy is plain and functional ("Round phase advanced to: Shortlisting") — no marketing tone in admin UI.
