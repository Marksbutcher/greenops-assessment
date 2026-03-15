-- 008_create_assessment_scores.sql
-- Overall assessment score (one per assessment)

CREATE TABLE assessment_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) UNIQUE,
  total_raw INTEGER NOT NULL DEFAULT 0,
  total_max INTEGER NOT NULL DEFAULT 1570,
  percentage NUMERIC(5, 1) NOT NULL DEFAULT 0,
  maturity_level INTEGER NOT NULL DEFAULT 1 CHECK (maturity_level BETWEEN 1 AND 5),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assessment_scores_assessment ON assessment_scores(assessment_id);
