CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS first_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_first_access_tokens_token ON first_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_first_access_tokens_company_id ON first_access_tokens(company_id);
CREATE INDEX IF NOT EXISTS idx_first_access_tokens_user_id ON first_access_tokens(user_id);
