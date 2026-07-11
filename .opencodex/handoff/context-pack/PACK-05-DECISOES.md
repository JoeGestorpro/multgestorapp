# PACK 05 — Decisões (vigentes e pendentes)

> ⚠️ **ARQUIVO GERADO — NÃO EDITAR À MÃO.** Fonte: `.opencodex/brain/decisions/`.
> **Gerado em:** 2026-07-04 · **state_version de origem:** 25

---

## Decisões vigentes recentes (resumo — detalhe completo no arquivo fonte)

| ID | Decisão | Resumo |
|---|---|---|
| D-015 | Fonte única do Segundo Cérebro | `.opencodex/brain/` é a única fonte de governança; secrets bloqueados no `.gitignore`; pack derivado nunca é fonte |
| D-016 | Plano premium da Barbearia JoeFelipe | Cliente pago ficou bloqueado por trial expirado sem `plan_type` atualizado — promovido manualmente; expôs o gap que motiva a missão de billing |
| D-017 | Correção de acoplamento Core×Nicho | 3 achados P0 de acoplamento indevido corrigidos (service de empresa, guard de auth do clima, scopes hardcoded no frontend) — correção pontual, sem inventar capacidade de scope-por-módulo que não existe |

Grafo completo de decisões (técnicas e de governança): `.opencodex/brain/decisions/DECISION-GRAPH.md`.

---

## Decisões pendentes (aguardando o Joe)

| ID | Decisão | O que está esperando |
|---|---|---|
| — | Autorizar o push do release `release/push-p0-batch` | Confirmação explícita ("APROVADO PUSH") — bloqueia toda a fila |
| D-005 | ClimaGestor: investir como piloto real ou congelar | Define se vale a pena construir o registry dinâmico de rotas do Core |
| — | Preços e limites dos planos comerciais | Necessário para popular a tabela `plans` em produção (missão de billing, fase 3) |
| — | Comportamento de reembolso/cancelamento no webhook | Downgrade imediato vs fim do ciclo pago — vira decisão D-xxx nova quando a missão de billing chegar nessa fase |
| D-001 | RLS: policies formais vs BYPASSRLS | Modelo atual de RLS vs policies explícitas |
| D-002 | Redis: pagar vs aceitar in-memory | Rate limit/cache distribuído limitado sem Redis |
| D-003 | WhatsApp: provider real vs mock | Hoje é mock em produção — lembretes não chegam de verdade |
| D-004 | OutboxWorker: break vs continue em erro | Comportamento de falha do worker de eventos |

---

## Regra de honestidade ao registrar decisão nova

Toda decisão nova segue o template em `.opencodex/brain/decisions/TEMPLATE-DECISION.md`:
problema → contexto → alternativas consideradas → decisão → justificativa → impacto
(positivo/negativo) → arquivos afetados. Nunca registrar uma decisão como "tomada" sem
confirmação explícita do humano quando ela for de negócio ou de alto impacto.
