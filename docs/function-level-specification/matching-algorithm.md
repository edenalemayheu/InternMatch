# Function-Level Spec: Matching Algorithm

## Location
`backend/src/services/matchingEngine.js` — exports a single function `runMatching(roundId)`. This is the **only** implementation of the matching logic in the codebase; it is called both by the admin "Run matching algorithm now" endpoint and, in a future production version, by a scheduled job. Never duplicate this logic elsewhere.

## Signature

```
async function runMatching(roundId: string): Promise<{
  matched: Array<{ student_id: string, posting_id: string, mutual_score: number }>,
  unmatched_students: string[],
  unmatched_postings: string[]
}>
```

## Algorithm

This is a **single-pass greedy algorithm**, not full Gale–Shapley — it does not perform iterative propose/reject rounds. Document this clearly in code comments, since it's a simplified, explainable variant, not a formal stable-matching proof. It is explainable-by-design: every match can be traced to one score computed from two rank positions.

### Step 1 — Load data
Fetch all `student_rankings` and `company_rankings` rows for `roundId`.

### Step 2 — Build mutual-interest pairs
For every `(student, posting)` pair where:
- the posting's ID appears in the student's `ordered_posting_ids`, **and**
- the student's ID appears in the posting's `ordered_student_ids` (or has a score in `scores`)

... compute:

```
studentRank = index of posting_id in student's ordered_posting_ids (1-based)
companyRank = index of student_id in posting's ordered_student_ids (1-based)
             (or, if using scores: companyRank derived by sorting scores descending, or use score directly — see "Scores vs. Ranks" below)

mutual_score = (1 / studentRank) + (1 / companyRank)
```

### Step 3 — Sort
Sort all mutual-interest pairs by `mutual_score` descending. Ties: break by student ID ascending (deterministic, so re-running against the same locked data always produces the same result).

### Step 4 — Single greedy pass
Walk the sorted list once, maintaining:
- a `matchedStudents` set
- a `remainingCapacity` map per `posting_id` (initialized from `postings.capacity`)

For each pair, in order:
```
if student_id not in matchedStudents AND remainingCapacity[posting_id] > 0:
    lock the match: add to `matches`, add student_id to matchedStudents,
    decrement remainingCapacity[posting_id]
else:
    skip, continue to next pair
```

### Step 5 — Compute unmatched sets
- `unmatched_students` = all students with a `student_rankings` row for this round, minus `matchedStudents`.
- `unmatched_postings` = all postings for this round where `remainingCapacity > 0` after the pass.

### Step 6 — Persist and return
Write all matched pairs to the `matches` table (fields: `round_id, student_id, posting_id, mutual_score`). Return the structured result described in the Signature section above.

## Scores vs. Ranks (company side)

Companies can submit either an ordered list (`ordered_student_ids`) or a 1–10 score map (`scores`). To keep the formula consistent:

- If `ordered_student_ids` is present, use the 1-based index directly as `companyRank`.
- If `scores` is present instead, derive `companyRank` by sorting the company's scored students descending by score and using the resulting position (ties in score share the same rank, broken by student ID for determinism).

This ensures `mutual_score` is always computed from two rank positions, regardless of which input method the company used.

## Capacity Handling

`postings.capacity` may be greater than 1. The single pass must decrement `remainingCapacity[posting_id]` on every successful match and continue matching additional students to the same posting until capacity is exhausted, rather than treating a posting as "taken" after just one match.

## Edge Cases

- **No mutual interest for a student:** student appears only in `unmatched_students`, no error.
- **Posting with more capacity than applicants:** posting appears in `unmatched_postings` with its remaining (non-zero) capacity noted, even if some slots were filled.
- **Company submitted no ranking at all for a posting:** that posting contributes no pairs to Step 2 and is fully unmatched.
- **Re-running `runMatching` on the same round:** must be idempotent — clear any existing `matches` rows for `roundId` before writing new results, so re-running (e.g. after fixing a data issue) doesn't create duplicates.

## Seed Data Strategy (for demo purposes)

When generating fake data via `POST /api/admin/seed`, randomize rankings so the resulting match run includes a mix of:
- Clear mutual top-choice matches (both sides ranked each other #1)
- Near-misses (a student's #1 choice was already filled by the time the algorithm reached that pair)
- At least 1–2 deliberately unmatched students and 1–2 unmatched postings

This makes the algorithm's output demonstrable and worth walking through live, rather than a trivial one-to-one mapping.
