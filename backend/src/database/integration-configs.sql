CREATE TABLE IF NOT EXISTS integration_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  channel VARCHAR(50) NOT NULL,
  provider_type VARCHAR(50) NOT NULL DEFAULT 'mock',
  api_url TEXT,
  phone_number_id VARCHAR(100),
  business_account_id VARCHAR(100),
  token_encrypted TEXT,
  verify_token VARCHAR(255),
  integration_enabled BOOLEAN NOT NULL DEFAULT false,
  config_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_integration_company FOREIGN KEY (company_id)
    REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT uq_integration_company_channel UNIQUE (company_id, channel)
);

CREATE INDEX IF NOT EXISTS idx_integration_configs_company
  ON integration_configs(company_id);

CREATE INDEX IF NOT EXISTS idx_integration_configs_channel
  ON integration_configs(channel);

COMMENT ON TABLE integration_configs IS 'Configuracoes de integracao por empresa e canal';
COMMENT ON COLUMN integration_configs.channel IS 'Canal: whatsapp, email, sms, push, instagram';
COMMENT ON COLUMN integration_configs.token_encrypted IS 'Token criptografado com WHATSAPP_TOKEN_ENCRYPTION_KEY';
COMMENT ON COLUMN integration_configs.integration_enabled IS 'Se a integracao esta ativa para esta empresa';
