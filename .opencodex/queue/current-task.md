# ⚙️ MISSÃO ATUAL — ⏸️ idle (nenhuma missão em execução)

---
status: idle
updated_at: 2026-07-02
note: >-
  Slot in-flight vazio. Sprint autônomo 2026-07-02 concluído: 7 commits locais
  em main (ace2d05..d262676), NENHUM push. Todas as missões P0 que não exigiam
  passo humano foram executadas e validadas. Próxima missão em next-task.md:
  release/push-p0-batch (HUMAN_APPROVAL_REQUIRED — push dispara deploy +
  migrations 018-021/030 em produção).
---

## ✅ Sprint autônomo pós-auditoria — CONCLUÍDO (2026-07-02)

Commits locais em `main` (sem push), todos validados por teste:

1. **`ace2d05`** `fix(barber): remove runtime ddl from schedule service` — suíte 678 pass.
2. **`e906039`** `docs(governance): reconcile mission queue with real state`.
3. **`8056831`** `fix(db): restore missing feature migrations 018-021` — mg_prepaid/packages/
   loyalty/anamnese versionados; aplicados limpos no TEST DB local.
4. **`02c5396`** `fix(security): route tenant writes through app_runtime pool` — **P0 central
   FECHADO**: `pool.connect()` com tenant no ALS sai do poolTenant (NOBYPASSRLS). Gate 0
   endurecido (novo gate crítico PATH-C). Integração 92 pass.
5. **`d112950`** `fix(security): support database tls certificate verification` — inerte até
   configurar `DATABASE_SSL_CA(_PATH)` no Render (passo humano).
6. **`f03af4d`** `fix(security): rotate refresh tokens and revoke sessions on logout` —
   migração 030 (`refresh_tokens`); rotação + revogação server-side; logout limpa os 3
   cookies. Integração 97 pass (5 testes novos).
7. **`d7f2fd1`** `fix(frontend): zero eslint errors` (antes 13) + **`d262676`**
   `fix(security): enable helmet content security policy`.

**Missão `test/rls-enforcement-local-testdb` executada:** banco local `multgestor_test`
(localhost:5432, role app_runtime NOBYPASSRLS) migrado; integração **97/97 pass** —
tenant-isolation-rls, gate0-*, outbox-durability rodando de verdade. `.env.test` local
corrigido (porta 5433→5432).

## 🔒 Pendências que EXIGEM humano

- **Push/deploy** dos 8 commits (dispara migrations 018-021 + 030 em prod — idempotentes,
  validadas no TEST, mas gate vigente).
- **TLS:** baixar CA no Supabase (Settings → Database → SSL Certificate) e setar
  `DATABASE_SSL_CA_PATH`/`DATABASE_SSL_CA` no Render.
- **WhatsApp real:** credenciais Meta (hoje provider mock em prod — lembretes não chegam).
- **Smoke manual pós-deploy** (roteiro na auditoria 2026-07-02).
- **Limpeza de artefatos** na raiz/backend (`_audit*.js`, `barber-*.png/txt`…) — deleção,
  requer lista aprovada.
- `cleanup/fase-c-branches-worktrees` (P2, HUMAN_APPROVAL_REQUIRED).

## ✅ Histórico anterior (mantido)

- **RLS runtime reads em prod (PR #20 `aeed31c`)** — ✅ 2026-07-01, canário verde.
- **Backup automation repair (PR #22)** — ✅ 2026-06-30; backup local+B2 validado 22/06.
- **JoeFelipe premium/active** — ✅ 2026-06-29 (D-016).
- **Knowledge OS 3.0** — ✅ 2026-06-24. **Fase C fechada** — ✅ 2026-06-23.

## 🗺️ Planejamento estratégico

Mapa-mãe: [`../brain/roadmaps/ROADMAP-MESTRE-MULTGESTOR-2026.md`](../brain/roadmaps/ROADMAP-MESTRE-MULTGESTOR-2026.md).
Fila vigente: ver `next-task.md` (release gate humano) e pendências acima.
