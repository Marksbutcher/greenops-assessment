-- 004_create_domain_assignments.sql
-- Maps respondents to domains within an assessment

CREATE TABLE domain_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id),
  domain_id VARCHAR(50) NOT NULL,
  primary_respondent_id UUID NOT NULL REFERENCES users(id),
  secondary_respondent_id UUID REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'UNASSIGNED'
    CHECK (status IN ('UNASSIGNED', 'INVITED', 'ACTIVE', 'COMPLETE', 'LOCKED')),
  access_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  token_expires_at TIMESTAMPTZ,
  expected_completion_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(assessment_id, domain_id)
);

CREATE INDEX idx_domain_assignments_assessment ON domain_assignments(assessment_id);
CREATE INDEX idx_domain_assignments_respondent ON domain_assignments(primary_respondent_id);
CREATE INDEX idx_domain_assignments_token ON domain_assignments(access_token);
CREATE INDEX idx_domain_assignments_domain ON domain_assignments(domain_id);
