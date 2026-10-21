CREATE TABLE student_tests (
    id UUID PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    test_date DATE NOT NULL,
    score NUMERIC(6,2) NOT NULL CHECK (score >= 0),
    max_score NUMERIC(6,2) NOT NULL CHECK (max_score > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT student_tests_score_within_max CHECK (score <= max_score),
    CONSTRAINT student_tests_id_user_unique UNIQUE (id, user_id)
);

CREATE TABLE student_test_chapters (
    test_id UUID NOT NULL REFERENCES student_tests(id) ON DELETE CASCADE,
    chapter_id INTEGER NOT NULL REFERENCES chapter(chapter_id),
    PRIMARY KEY (test_id, chapter_id)
);

CREATE TABLE student_mistakes (
    id UUID PRIMARY KEY,
    user_id BIGINT NOT NULL,
    test_id UUID NOT NULL,
    chapter_id INTEGER NOT NULL REFERENCES chapter(chapter_id),
    concept_id VARCHAR(128) NOT NULL,
    reason VARCHAR(24) NOT NULL,
    note VARCHAR(280),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT student_mistakes_test_owner_fk
        FOREIGN KEY (test_id, user_id) REFERENCES student_tests(id, user_id) ON DELETE CASCADE,
    CONSTRAINT student_mistakes_reason_valid CHECK (reason IN (
        'CONCEPT_GAP', 'FORGOT_FORMULA', 'CALCULATION_SLIP', 'MISREAD_QUESTION', 'RAN_OUT_OF_TIME'
    ))
);

CREATE TABLE concept_state (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chapter_id INTEGER NOT NULL REFERENCES chapter(chapter_id),
    concept_id VARCHAR(128) NOT NULL,
    mistake_count INTEGER NOT NULL CHECK (mistake_count > 0),
    last_mistake_on DATE NOT NULL,
    top_reason VARCHAR(24) NOT NULL,
    weakness_score NUMERIC(6,3) NOT NULL CHECK (weakness_score >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, chapter_id, concept_id),
    CONSTRAINT concept_state_reason_valid CHECK (top_reason IN (
        'CONCEPT_GAP', 'FORGOT_FORMULA', 'CALCULATION_SLIP', 'MISREAD_QUESTION', 'RAN_OUT_OF_TIME'
    ))
);

CREATE INDEX idx_student_tests_user_date ON student_tests (user_id, test_date DESC);
CREATE INDEX idx_student_mistakes_user_concept ON student_mistakes (user_id, chapter_id, concept_id);
CREATE INDEX idx_concept_state_user_weakness ON concept_state (user_id, weakness_score DESC, last_mistake_on DESC);

ALTER TABLE student_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_test_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_mistakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_state ENABLE ROW LEVEL SECURITY;

-- The React application never accesses these tables through Supabase's Data API.
-- Keep direct anon/authenticated access closed even on projects with broad defaults.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        EXECUTE 'REVOKE ALL ON student_tests, student_test_chapters, student_mistakes, concept_state FROM anon';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        EXECUTE 'REVOKE ALL ON student_tests, student_test_chapters, student_mistakes, concept_state FROM authenticated';
    END IF;
END $$;
