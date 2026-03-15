-- 003_create_assessments.sql
-- Assessment entity with state machine status

CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id),
  coordinator_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'ACTIVE', 'IN_PROGRESS', 'UNDER_REVIEW', 'REPORT_READY', 'COMPLETE')),
  deadline DATE,
  report_file_path VARCHAR(500),
  executive_summary TEXT,
  domain_observations JSONB,
  cross_domain_analysis TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_assessments_org ON assessments(organisation_id);
CREATE INDEX idx_assessments_coordinator ON assessments(coordinator_id);
CREATE INDEX idx_assessments_status ON assessments(status);
