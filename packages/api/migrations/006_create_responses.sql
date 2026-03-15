-- 006_create_responses.sql
-- Individual question responses

CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id),
  domain_id VARCHAR(50) NOT NULL,
  question_id VARCHAR(50) NOT NULL REFERENCES questions(id),
  respondent_id UUID NOT NULL REFERENCES users(id),
  selected_option CHAR(1) CHECK (selected_option IN ('A', 'B', 'C', 'D', 'E')),
  score INTEGER CHECK (score IN (0, 2, 4, 6, 10)),
  answered_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(assessment_id, question_id)
);

CREATE INDEX idx_responses_assessment ON responses(assessment_id);
CREATE INDEX idx_responses_assessment_domain ON responses(assessment_id, domain_id);
CREATE INDEX idx_responses_respondent ON responses(respondent_id);
