-- 20260702_030 — Sessões de refresh token com revogação server-side
-- Suporta rotação de refresh token e logout que invalida a sessão no servidor.
-- Idempotente: CREATE TABLE/INDEX IF NOT EXISTS.
--
-- Acesso: somente fluxos de auth (pool privilegiado, fora de contexto tenant).
-- RLS habilitado SEM policies = app_runtime não enxerga nada (defesa em
-- profundidade); roles com BYPASSRLS/owner (auth) não são afetados.

CREATE TABLE IF NOT EXISTS public.refresh_tokens (
  jti UUID PRIMARY KEY,
  subject_id UUID NOT NULL,
  auth_scope TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NULL,
  replaced_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_subject ON public.refresh_tokens (subject_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON public.refresh_tokens (expires_at);

ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
