# Implementation decisions

## 2026-10-21 — Prepilot mistake logbook MVP

- **Decision:** Ship a dedicated authenticated logbook page with fully tagged mistakes only.
- **Options considered:** quick untagged question-number capture; a dashboard-only panel; a reader-only UI.
- **Choice:** Require chapter, curated BirBal concept, and one of five fixed reasons on every mistake. This keeps the first release's analytics and future BirBal memory trustworthy.

## 2026-10-21 — Logbook concept catalogue and security boundary

- **Decision:** Use imported `corpus_concept` data as the catalogue and keep logbook tables backend-only.
- **Options considered:** duplicate static JSON in the frontend; accept free-text concepts; grant browser clients Supabase policies.
- **Choice:** Validate `(chapter_id, concept_id)` server-side, enable RLS, and revoke direct `anon`/`authenticated` grants. The Spring backend remains the sole data path.

## 2026-10-14 — Private PDF importer recovery

- **Decision:** Verify an existing Supabase object by streaming and hashing it
  before skipping it or restoring its database metadata.
- **Options considered:** trust `resource_files` metadata; check object size
  only; stream the object and compare both SHA-256 and size.
- **Choice:** stream and compare SHA-256 plus size. This adds transfer time to
  the one-off import but prevents accidental overwrites and repairs a run that
  uploaded a PDF successfully before the database update completed.
