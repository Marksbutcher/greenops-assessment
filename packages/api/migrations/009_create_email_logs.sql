-- 009_create_email_logs.sql
-- Audit log for all sent emails

CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id),
  recipient_id UUID NOT NULL REFERENCES users(id),
  email_type VARCHAR(30) NOT NULL
    CHECK (email_type IN ('invitation', 'reminder', 'domain_complete', 'assessment_complete', 'consultant_notification', 'report_ready')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(10) NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  external_message_id VARCHAR(255)
);

CREATE INDEX idx_email_logs_assessment ON email_logs(assessment_id);
CREATE INDEX idx_email_logs_recipient ON email_logs(recipient_id);
CREATE INDEX idx_email_logs_type ON email_logs(email_type);
