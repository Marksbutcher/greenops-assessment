-- 002_create_users.sql
-- User entity for coordinators, respondents, and consultants

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  job_title VARCHAR(255),
  password_hash VARCHAR(255),
  role VARCHAR(20) NOT NULL CHECK (role IN ('coordinator', 'respondent', 'consultant')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
