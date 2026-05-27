-- Trial Email Log (Sprint 15)
-- Controle de deduplicacao de emails de trial

CREATE TABLE IF NOT EXISTS trial_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('welcome','progress','expiring','expired')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, email_type)
);

CREATE INDEX IF NOT EXISTS idx_trial_email_log_company ON trial_email_log(company_id);
CREATE INDEX IF NOT EXISTS idx_trial_email_log_type ON trial_email_log(email_type);
