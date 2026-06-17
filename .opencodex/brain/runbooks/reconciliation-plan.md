# 🔀 PLANO DE RECONCILIAÇÃO — inc.2 + CONTRATOS DE EVENTOS + Brain V3 → main

> **Status:** PREPARADO (não executado) · **Criado:** 2026-06-07
> **Regra inviolável:** GATE-INTEG primeiro. Push para `main` **só com confirmação humana**.
> Origem: decisão humana 2026-06-07 ("preparar ordem, ainda sem push, não pular o GATE-INTEG").

## Topologia real (importante)
As 3 frentes **não** estão em branches separadas — são uma **pilha linear interleavada** sobre `origin/main` (`fea9708`), na branch `chore/second-brain-v3`:

```
eb5b10b  test(outbox): integração mutation paths + Loop de Fechamento   ← GATE-INTEG (frente c/inc.2)
67ee6ac  feat(brain): Segundo Cérebro V3                                 ← Brain V3 (c)
bc8e6f8  docs(gov): reforçar Event Contracts Gate                        ← EVENT CONTRACTS (b)
50a64dd  feat(events): AppointmentEvents factory + refactor              ← EVENT CONTRACTS (b)
d79e564  docs(gov): inc.2 APPROVE_WITH_NOTES                             ← inc.2 (a)
0d654f3  feat(appointment): mutation paths → outbox durável              ← inc.2 (a)
b1cdb7b  docs(gov): inc.2 REQUEST_CHANGES                                ← inc.2 (a)
6f5d973  docs(gov): regra EVENT CONTRACTS + auditor-flow                 ← EVENT CONTRACTS (b)
────────  (base) fea9708 = origin/main
```

> Consequência: **não há como mesclar a→b→c como 3 passos independentes** sem reescrever histórico
> (rebase interativo — bloqueado/arriscado). O resultado correto (as 3 em `main`, GATE cumprido) é obtido
> por **um único fast-forward linear** de `main` → `eb5b10b`, preservando a ordem cronológica. **Sem rewrite.**

## Ordem de execução (gated)

### PASSO 1 — Validar GATE-INTEG (obrigatório, primeiro)
Os 8 testes de integração de `outbox-durability.test.js` **skipam local** (sem Postgres). Validar **verde** por **uma** via:
- **Via CI (recomendada):** `git push origin chore/second-brain-v3` → CI roda em qualquer branch (`on: push/pull_request: '**'`), incluindo integração com Postgres + role `app_runtime`. **Isto NÃO toca `main`.**
  - ⚠️ É um push de **branch de feature**, distinto do "push para main" (que segue gated). Requer **OK do humano** se "sem push" incluir branches.
- **Via local:** subir Postgres + `app_runtime`, exportar `ADMIN/TEST/APP_RUNTIME_URL`, `npm run test:integration`.
- **Critério:** suíte de integração **verde** (incl. os 4 mutation paths + create). Sem skip nos casos novos.
- 🛑 Se vermelho → PARAR, corrigir, re-rodar. **Não prosseguir.**

### PASSO 2 — Auditoria final consolidada (Claude Code)
Com CI verde, rodar a auditoria final única sobre todo o stack:
- ✅ inc.2: mutation paths atômicos + dual-emit (anti-regressão L-04).
- ✅ EVENT CONTRACTS: factory + `validateEventPayload` + gate no `auditor-flow` (sem hardcode).
- ✅ Brain V3: source-of-truth, CHECK 0, Loop de Fechamento, `.agent` preservado.
- ✅ Integração: 8 testes verdes no CI.
- ✅ `brain/project-state.md` reflete o estado final (Loop de Fechamento cumprido).
- ✅ Diff total restrito ao escopo; sem produção/secrets tocados indevidamente.
- Resultado: **APPROVE consolidado** registrado em `.opencodex/audits/` + `brain/audits/`.

### PASSO 3 — Push para `main` (somente com confirmação humana)
```
git checkout main
git merge --ff-only chore/second-brain-v3   # FF limpo → eb5b10b
git push origin main                         # ⛔ só após confirmação explícita
```
- Atualizar `brain/project-state.md`: `origin_main = eb5b10b`; mover itens de `local_not_in_main` → `in_main`; fechar GATE-INTEG.
- Atualizar `implementation-log` (reconciliação concluída).

## Mapa frente → commits (para rastreabilidade)
| Frente | Commits |
|---|---|
| a) inc.2 (mutation paths duráveis) | `b1cdb7b`, `0d654f3`, `d79e564` |
| b) EVENT CONTRACTS (contrato/factory/gate) | `6f5d973`, `50a64dd`, `bc8e6f8` |
| c) Brain V3 (source-of-truth/CHECK 0/loop) | `67ee6ac` |
| GATE-INTEG (testes de integração) | `eb5b10b` |

## Condições de parada (invioláveis)
- ❌ Não pular o PASSO 1 (GATE-INTEG verde no CI).
- ❌ Não fazer push para `main` sem confirmação humana explícita.
- ❌ Não reescrever histórico (sem rebase interativo) para "separar" as frentes.
