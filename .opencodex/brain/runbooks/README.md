# brain/runbooks — Índice de runbooks operacionais

> Runbooks executáveis canônicos vivem em `docs/runbooks/`. Este índice aponta os vigentes e marca os que precisam de consolidação (de `.agent/workflows/`).

| Runbook | Local | Status |
|---|---|---|
| Prompt Orchestration Flow | `docs/runbooks/prompt-orchestration-flow.md` | ✅ vigente |
| Release Safety Gate | `docs/runbooks/release-safety-gate.md` | ✅ vigente |
| Runtime role least-privilege (RLS) | `docs/runbooks/runtime-role-least-privilege-plan.md` + `runtime-role-fase1-ci-mission.md` | ✅ vigente (Fases 2/3 PLAN_ONLY) |
| AbacatePay provider | `docs/runbooks/abacatepay-provider.md` | ✅ vigente |
| Fase C — integração + testes | `docs/runbooks/fase-c-integracao-e-testes.md` | 🟡 blocked/em espera |

## A consolidar (de `.agent/workflows/` — REVISAR, ver archive-index)
`audit-tenant-isolation`, `generate-migration`, `prepare-release`, `run-migrations`, `smoke-test` — sobrepõem runbooks; consolidar sem duplicar em missão futura.
