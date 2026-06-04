# Fase C — Integração de Negócio + Testes de Integração Reais (runbook)

> ⚠️ **Reconstruído em 2026-06-04** (original perdido no `git clean`, era untracked). Este é um esqueleto
> fiel ao intento conhecido (backlog + auditorias); **revisar e detalhar antes de promover**.

## Objetivo
Ligar o evento de venda às capabilities premium e validar tudo com **testes de integração reais** (banco
de verdade), saindo da quarentena de forma segura.

## Pré-condições (gates)
- ✅ **B2 (idempotência por handler)** aprovado (`e137217`) — evita crédito em DOBRO de loyalty/package no retry.
- ⚠️ **GATE de design (achado da auditoria B2):** decidir **`break` vs `continue`** no `_process` do
  `OutboxWorker`. Hoje o `break` no 1º handler que falha **bloqueia** os seguintes — para loyalty+package
  independentes, avaliar `continue` (cada handler conclui isolado) OU garantir ordem-independência + idempotência.
- ⚠️ Wiring `sale.created` está em **QUARENTENA LÓGICA** (comentado em `backend/src/server.js`).

## Escopo (C1/C2/C3)
- **C1 — Wiring de venda:** registrar `sale.created` → `handleSaleLoyaltyAccrual` + `handleSalePackageRedemption`
  (tirar da quarentena no `server.js`).
- **C2 — Dispatcher (revisão obrigatória):** aplicar a decisão break/continue; garantir idempotência por
  `(message_id, handler_name)` (já existe via B2).
- **C3 — Testes de integração reais:** `backend/docker-compose.test.yml` + helper de `test-db` (Postgres real,
  isolado), suíte cobrindo: venda credita fidelidade 1x; resgate de pacote; retry não duplica; isolamento tenant.

## Critérios de aceite (a detalhar)
- [ ] `sale.created` ligado e fora da quarentena.
- [ ] Decisão break/continue implementada e justificada.
- [ ] Retry de venda NÃO credita pontos/pacote em dobro (teste real).
- [ ] Suíte de integração verde com banco real (não mocks).
- [ ] Sem regressão; staging seletivo.

## Modo
**EXECUTE_WITH_REVIEW** — toca dispatcher central + pagamentos/wallet + multi-tenant → **auditoria final
do Claude obrigatória**.

## Não fazer
- ❌ Promover sem resolver o gate break/continue.
- ❌ Ativar FORCE RLS aqui (é o B1b).
- ❌ `git add -A` / tocar fora da allowlist.
