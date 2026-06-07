# 🎓 LESSONS LEARNED — MultGestor

> Incidentes e aprendizados para **não repetir**. Atualizado no Loop de Fechamento quando uma missão revela um erro de processo.
> **Origem:** `docs/lessons-learned.md` + incidentes reais de 06-04→06-07. **Status: Consolidado + Atualizado.**

## L-01 — `git clean` apagou governança untracked (2026-06-04)
`git clean -fd` apagou `.opencodex/` (na época untracked) → divergência Claude↔OpenCode. **Aprendizado:** governança passou a ser **rastreada** no git; runner **NUNCA** roda `git clean`. (Preflight CHECK + auto-queue-runner Regra #3.)

## L-02 — Dois cérebros desconectados (2026-06-07)
`.agent/` (Master Orchestrator) virou autoridade prescrita mas **congelada e bypassada**; `.opencodex/` virou autoridade real sem atualizar a memória. **Aprendizado:** fonte única (`brain/`) + **Loop de Fechamento** obrigatório + **CHECK 0** de contexto. Memória que não se atualiza sozinha morre.

## L-03 — Evento de domínio com transporte volátil (F2)
`appointment.*` P0 eram fire-and-forget no `eventBus` (erros engolidos, fora da transação). **Aprendizado:** eventos críticos vão pela **outbox durável** (UnitOfWork), atômicos com o write.

## L-04 — Migração de transporte que dropou comportamento (F2 inc.1, REQUEST_CHANGES)
Ao migrar `create` para outbox, o executor **removeu** `appointment.confirmed` → quebrou o WhatsApp de confirmação (consumer in-memory ativo). **Aprendizado:** migração de transporte **NÃO** muda comportamento; **não dropar evento com consumidor ativo** (dual-emit). Virou regra dura nos cards.

## L-05 — EVENT CONTRACTS: hardcode + sem validação (incidente do título)
Eventos publicados com `event_name`/`aggregate_type` hardcoded e sem `validateEventPayload` → drift entre formatos in-memory vs outbox. **Aprendizado:** contrato real + `validateEventPayload` + **factory** obrigatórios; gate de auditoria reprova violação. (`.opencodex/rules/event-contracts.md`.)

## L-06 — Auditor automático pode subestimar regra nova (F2 inc.2)
O OpenCode Auditor deu APPROVE ignorando a regra EVENT CONTRACTS recém-criada. **Aprendizado:** auditoria final do Claude Code verifica **no código real**, não no parecer; regra nova precisa ser amarrada no `auditor-flow` E nos critérios de aceite do card.

## L-07 — RLS inerte por BYPASSRLS
RLS `ENABLE` não isola nada se o role de runtime tem BYPASSRLS. **Aprendizado:** isolamento real exige role least-privilege; até lá, a app é a única barreira (filtros `company_id`).

## L-08 — Dois formatos de evento (in-memory vs outbox)
Consumer escrito para um formato quebra no outro (`event.event_name` vs `event.type`; `event.company_id` vs `context.companyId`). **Aprendizado:** acessar campos pelo formato correto; helper/factory central se variar.
