CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE corpus_chapter (
    chapter_id INTEGER PRIMARY KEY REFERENCES chapter(chapter_id) ON DELETE CASCADE,
    source_resource_id INTEGER REFERENCES resource(resource_id) ON DELETE SET NULL,
    subject VARCHAR(64) NOT NULL,
    chapter_name VARCHAR(255) NOT NULL,
    imported_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE corpus_concept (
    chapter_id INTEGER NOT NULL REFERENCES corpus_chapter(chapter_id) ON DELETE CASCADE,
    concept_id VARCHAR(128) NOT NULL,
    concept_name VARCHAR(512) NOT NULL,
    importance VARCHAR(32),
    source_pages INTEGER[] NOT NULL DEFAULT '{}',
    one_line_summary TEXT,
    PRIMARY KEY (chapter_id, concept_id)
);

CREATE TABLE corpus_qna (
    chapter_id INTEGER NOT NULL REFERENCES corpus_chapter(chapter_id) ON DELETE CASCADE,
    qna_id VARCHAR(128) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    type VARCHAR(64),
    difficulty VARCHAR(64),
    source_pages INTEGER[] NOT NULL DEFAULT '{}',
    search_text TEXT NOT NULL,
    search_document TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', search_text)) STORED,
    PRIMARY KEY (chapter_id, qna_id)
);

CREATE TABLE corpus_qna_concept (
    chapter_id INTEGER NOT NULL,
    qna_id VARCHAR(128) NOT NULL,
    concept_id VARCHAR(128) NOT NULL,
    PRIMARY KEY (chapter_id, qna_id, concept_id),
    FOREIGN KEY (chapter_id, qna_id) REFERENCES corpus_qna(chapter_id, qna_id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id, concept_id) REFERENCES corpus_concept(chapter_id, concept_id) ON DELETE CASCADE
);

CREATE TABLE birbal_query_audit (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    resource_id INTEGER NOT NULL REFERENCES resource(resource_id),
    chapter_id INTEGER NOT NULL REFERENCES chapter(chapter_id),
    query_text VARCHAR(1000) NOT NULL,
    matched_qna_id VARCHAR(128),
    score NUMERIC(6, 5),
    outcome VARCHAR(32) NOT NULL,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_corpus_qna_search_document ON corpus_qna USING GIN (search_document);
CREATE INDEX idx_corpus_qna_search_text_trgm ON corpus_qna USING GIN (search_text gin_trgm_ops);
CREATE INDEX idx_corpus_qna_chapter_type_difficulty ON corpus_qna (chapter_id, type, difficulty);
CREATE INDEX idx_corpus_qna_concept_lookup ON corpus_qna_concept (chapter_id, concept_id, qna_id);
CREATE INDEX idx_birbal_query_audit_user_requested_at ON birbal_query_audit (user_id, requested_at DESC);
CREATE INDEX idx_birbal_query_audit_chapter_requested_at ON birbal_query_audit (chapter_id, requested_at DESC);
