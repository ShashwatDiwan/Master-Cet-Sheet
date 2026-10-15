# BirBal corpus import and deployment

BirBal is retrieval-only in this milestone. It searches pre-generated chapter JSON in Render Postgres; it does not invoke Gemini, OpenAI, or any other live LLM.

## One-time import

1. Place the generated chapter `.json` files under `backend/corpus-json/Physics`, `Chemistry`, and `Mathematics` (or another dedicated folder). Do not place the generated `.txt` prompt files there.
2. Run the existing validator from `backend`:

   ```powershell
   node .\scripts\validate-corpus-json.mjs
   ```

   It accepts both `questions[]` and the external `qna[]` format. It reports missing, thin, and valid JSON, while skipping Optics because that chapter is PYQ-only.
3. Commit the JSON files with the backend, so Render receives them during deploy.
4. For exactly one deploy, set these Render environment variables:

   ```text
   FLYWAY_ENABLED=true
   JPA_DDL_AUTO=validate
   BIRBAL_IMPORT_ENABLED=true
   BIRBAL_IMPORT_DIRECTORY=corpus-json
   ```

   `BIRBAL_IMPORT_DIRECTORY` is relative to the service's working directory. `corpus-json` is correct when Render's Root Directory is `backend`. Confirm the root directory in the Render service settings before deploying; use the matching absolute/relative path if it differs.
5. Deploy and inspect the log line beginning `BirBal import finished`. Individual incompatible files are rejected into `birbal-import-report-*.txt` and logged; they do **not** prevent the reader from starting.
6. Set `BIRBAL_IMPORT_ENABLED=false` after the import succeeds, then deploy normally. This prevents unnecessary re-imports on future restarts.

## Database behavior

Flyway migration `V3__birbal_corpus_search.sql` enables Render Postgres's supported `pg_trgm` extension and creates full-text/trigram indexes, corpus tables, and the query audit table. Keep Flyway enabled; do not switch Hibernate to `update` for this feature.

The API is authenticated and resource-scoped:

- `GET /api/v1/resources/{resourceId}/birbal/ask?q=...` returns the top three matches.
- `GET /api/v1/resources/{resourceId}/birbal/browse?type=&difficulty=&concept=&page=` returns the chapter’s filterable Q&A.

Both endpoints resolve the chapter from the open resource ID, apply the per-user 40 requests/minute limit, and write an audit entry. Query audits are removed after 30 days by default; override only with `BIRBAL_AUDIT_RETENTION_DAYS` if you deliberately choose a different retention period.

## Naming

The default panel name is `BirBal` and the default blue reader toggle is `Ask Birbal`. To change the frontend display only, set `VITE_BIRBAL_NAME` and/or `VITE_BIRBAL_TOGGLE_LABEL` during the frontend build. `BIRBAL_NAME` is the matching backend display setting for future API metadata; it does not enable an AI model.
