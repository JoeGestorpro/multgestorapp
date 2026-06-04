-- outbox_message_handlers.sql
-- Tracking persistente de idempotência por handler individual.
-- Aditiva: não altera outbox_messages.

CREATE TABLE IF NOT EXISTS outbox_message_handlers (
  message_id    UUID NOT NULL REFERENCES outbox_messages(id) ON DELETE CASCADE,
  handler_name  VARCHAR(255) NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','processed','failed')),
  processed_at  TIMESTAMPTZ,
  last_error    TEXT,
  PRIMARY KEY (message_id, handler_name)
);

CREATE INDEX IF NOT EXISTS idx_outbox_message_handlers_message_id
  ON outbox_message_handlers (message_id);
