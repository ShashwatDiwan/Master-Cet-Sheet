-- V1 is intentionally generated from a reviewed schema-only dump of the live
-- database. Do not deploy this migration until V1 has been generated and the
-- clone rehearsal documented in docs/FLYWAY_BASELINE_RUNBOOK.md has passed.

CREATE TABLE resource_files (
    resource_id INTEGER PRIMARY KEY REFERENCES resource(resource_id) ON DELETE CASCADE,
    object_key VARCHAR(1024) NOT NULL UNIQUE,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
    content_type VARCHAR(255) NOT NULL DEFAULT 'application/pdf',
    size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
    sha256 VARCHAR(64) NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE viewer_url_audit (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    -- Deliberately not a foreign key: denied/unknown resource requests must
    -- still be auditable without making the audit insert fail.
    resource_id INTEGER NOT NULL,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    outcome VARCHAR(32) NOT NULL,
    denial_reason VARCHAR(255)
);

CREATE INDEX idx_viewer_url_audit_user_requested_at
    ON viewer_url_audit (user_id, requested_at DESC);
CREATE INDEX idx_viewer_url_audit_resource_requested_at
    ON viewer_url_audit (resource_id, requested_at DESC);
