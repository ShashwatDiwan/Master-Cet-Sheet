CREATE TABLE student_birbal_profile (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    global_summary VARCHAR(900),
    physics_summary VARCHAR(1200),
    chemistry_summary VARCHAR(1200),
    mathematics_summary VARCHAR(1200),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE student_birbal_profile ENABLE ROW LEVEL SECURITY;

-- This private profile is served only through the authenticated Spring backend.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        EXECUTE 'REVOKE ALL ON student_birbal_profile FROM anon';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        EXECUTE 'REVOKE ALL ON student_birbal_profile FROM authenticated';
    END IF;
END $$;
