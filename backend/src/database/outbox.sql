CREATE TABLE IF NOT EXISTS outbox_messages (
  id              UUID PRIMARY KEY,
  type            VARCHAR(255) NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}',
  trace_id        VARCHAR(100),
  company_id      UUID,
  aggregate_type  VARCHAR(100),
  aggregate_id    UUID,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
  retry_count     INTEGER NOT NULL DEFAULT 0,
  max_retries     INTEGER NOT NULL DEFAULT 5,
  next_retry_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at    TIMESTAMPTZ,
  last_error      TEXT,
  locked_at       TIMESTAMPTZ,
  locked_by       VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_outbox_poll
  ON outbox_messages (status, next_retry_at, created_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_outbox_cleanup
  ON outbox_messages (created_at)
  WHERE status = 'processed';
