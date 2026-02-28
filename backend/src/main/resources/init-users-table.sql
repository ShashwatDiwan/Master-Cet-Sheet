-- Create users table for JWT authentication and user management
-- Run this manually in your Postgres DB before starting the application

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(255),
    password VARCHAR(255) NOT NULL
);

-- Optional: Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
