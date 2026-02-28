-- Flyway migration: add chapter_progress table for per-user tracking

CREATE TABLE IF NOT EXISTS chapter_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    chapter_id INT NOT NULL,
    progress_percent INT NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    last_accessed_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_cp_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_cp_chapter FOREIGN KEY(chapter_id) REFERENCES chapter(chapter_id) ON DELETE CASCADE,
    CONSTRAINT uq_user_chapter UNIQUE(user_id, chapter_id)
);
