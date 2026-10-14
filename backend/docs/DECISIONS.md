# Implementation decisions

## 2026-10-14 — Private PDF importer recovery

- **Decision:** Verify an existing Supabase object by streaming and hashing it
  before skipping it or restoring its database metadata.
- **Options considered:** trust `resource_files` metadata; check object size
  only; stream the object and compare both SHA-256 and size.
- **Choice:** stream and compare SHA-256 plus size. This adds transfer time to
  the one-off import but prevents accidental overwrites and repairs a run that
  uploaded a PDF successfully before the database update completed.
