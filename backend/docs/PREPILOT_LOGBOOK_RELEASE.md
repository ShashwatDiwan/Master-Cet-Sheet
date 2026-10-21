# Prepilot Logbook release checks

1. Rehearse the existing Flyway baseline runbook on a staging database before enabling this migration in production.
2. Deploy with `FLYWAY_ENABLED=true` and `JPA_DDL_AUTO=validate`; do not let Hibernate create or update the logbook schema.
3. Confirm the Spring datasource role can access the new tables, while direct `anon` and `authenticated` roles cannot.
4. Run the BirBal corpus importer with its reviewed directory and inspect its report. Only chapters present in `corpus_chapter` and `corpus_concept` appear in the logbook.
5. Smoke test two distinct users: user A creates a test and mistakes; user B receives no result for user A's test ID.

The frontend uses only the Spring `/api/v1/logbook` endpoints. It must never receive a Supabase service role key or call the Data API for logbook data.
