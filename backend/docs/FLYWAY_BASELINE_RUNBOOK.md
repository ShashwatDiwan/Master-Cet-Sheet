# Flyway baseline runbook

This application currently has a live schema created by Hibernate. Do not invent
or hand-write `V1__baseline_existing_schema.sql`; create it from the exact live
schema and review it before enabling Flyway.

1. Put the production database into a quiet maintenance window and create a
   verified `pg_dump --format=custom` backup. Store the backup outside the repo.
2. Create a schema-only dump with `pg_dump --schema-only --no-owner --no-acl`.
   Save the reviewed result as `src/main/resources/db/migration/V1__baseline_existing_schema.sql`.
3. Restore the custom backup into an isolated PostgreSQL database. Set
   `FLYWAY_ENABLED=true`, `FLYWAY_BASELINE_ON_MIGRATE=true`,
   `FLYWAY_BASELINE_VERSION=1`, and `JPA_DDL_AUTO=validate`; then start the
   backend. It must record V1, apply V2, and pass Hibernate validation.
4. Run the existing API smoke tests against that clone. Only then repeat the
   same configuration in production after taking another verified backup.
5. For a brand-new database, leave `baseline-on-migrate=false`: Flyway applies
   the committed V1 schema followed by V2.

Until V1 exists and the rehearsal passes, leave the default transitional values
in `application.properties` (`FLYWAY_ENABLED=false`, `JPA_DDL_AUTO=update`).
