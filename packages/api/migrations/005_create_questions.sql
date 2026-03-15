-- 005_create_questions.sql
-- Question entity - stores all 157 assessment questions

CREATE TABLE questions (
  id VARCHAR(50) PRIMARY KEY,
  domain_id VARCHAR(50) NOT NULL,
  display_id VARCHAR(5) NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  option_e TEXT,
  max_score INTEGER NOT NULL DEFAULT 10 CHECK (max_score IN (6, 10)),
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_questions_domain ON questions(domain_id);
CREATE INDEX idx_questions_domain_order ON questions(domain_id, display_order);
