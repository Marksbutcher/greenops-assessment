-- 007_create_domain_scores.sql
-- Calculated domain-level scores

CREATE TABLE domain_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id),
  domain_id VARCHAR(50) NOT NULL,
  raw_score INTEGER NOT NULL DEFAULT 0,
  max_possible INTEGER NOT NULL,
  percentage NUMERIC(5, 1) NOT NULL DEFAULT 0,
  maturity_level INTEGER NOT NULL DEFAULT 1 CHECK (maturity_level BETWEEN 1 AND 5),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(assessment_id, domain_id)
);

CREATE INDEX idx_domain_scores_assessment ON domain_scores(assessment_id);
